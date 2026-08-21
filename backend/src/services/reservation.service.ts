import { prisma } from '../config/prisma';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { broadcastEvent } from './realtime.service';
import { MovementType, OrderStatus, ReservationStatus } from '@prisma/client';

export class ReservationService {
  static async reserveStockForOrder(orderId: string, locationId: string, createdBy: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.customerOrder.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              item: true,
              reservations: { where: { status: ReservationStatus.RESERVED } }
            }
          }
        }
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new ConflictError('Cannot reserve stock for a cancelled order');
      }

      if (order.status === OrderStatus.CONFIRMED) {
        throw new ConflictError('Order is already confirmed and reserved');
      }

      const createdReservations = [];

      for (const item of order.items) {
        // Find existing inventory record
        let inv = await tx.inventory.findUnique({
          where: { itemId_locationId: { itemId: item.itemId, locationId } }
        });

        if (!inv) {
          throw new ConflictError(
            `No inventory record exists at this location for item ${item.item.sku} (${item.item.name})`
          );
        }

        // Perform explicit PostgreSQL Row Locking to prevent race conditions during concurrent reservations
        const lockedInventoryRows: any[] = await tx.$queryRaw`
          SELECT * FROM "Inventory" WHERE "id" = ${inv.id} FOR UPDATE
        `;

        const lockedInv = lockedInventoryRows[0] || inv;

        const available = lockedInv.physicalQuantity - lockedInv.reservedQuantity;
        if (item.quantity > available) {
          throw new ConflictError(
            `Over-reservation rejected: Requested ${item.quantity} units for ${item.item.name} (${item.item.sku}), but only ${available} available at this location.`
          );
        }

        // Increase reserved quantity
        const updatedInv = await tx.inventory.update({
          where: { id: lockedInv.id },
          data: { reservedQuantity: lockedInv.reservedQuantity + item.quantity }
        });

        // Create Reservation record
        const reservation = await tx.reservation.create({
          data: {
            orderItemId: item.id,
            inventoryId: lockedInv.id,
            quantity: item.quantity,
            status: ReservationStatus.RESERVED
          }
        });

        // Audit transaction
        await tx.inventoryTransaction.create({
          data: {
            inventoryId: lockedInv.id,
            quantity: item.quantity,
            movementType: MovementType.RESERVE,
            reason: `Reserved for Customer Order ${order.orderNumber}`,
            referenceType: 'ORDER',
            referenceId: order.id,
            createdBy
          }
        });

        createdReservations.push(reservation);

        // Realtime event per item stock update
        broadcastEvent('INVENTORY_UPDATED', {
          ...updatedInv,
          availableQuantity: updatedInv.physicalQuantity - updatedInv.reservedQuantity
        });
      }

      // Update Order Status to CONFIRMED
      const updatedOrder = await tx.customerOrder.update({
        where: { id: orderId },
        data: { status: OrderStatus.CONFIRMED },
        include: {
          customer: true,
          items: {
            include: {
              item: true,
              reservations: true
            }
          }
        }
      });

      broadcastEvent('ORDER_RESERVED', updatedOrder);

      return {
        order: updatedOrder,
        reservations: createdReservations
      };
    });
  }

  static async cancelOrder(orderId: string, createdBy: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.customerOrder.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              item: true,
              reservations: { where: { status: ReservationStatus.RESERVED } }
            }
          }
        }
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new ConflictError('Order is already cancelled');
      }

      // Release all active reservations
      for (const item of order.items) {
        for (const res of item.reservations) {
          const inv = await tx.inventory.findUnique({ where: { id: res.inventoryId } });
          if (inv) {
            const newReserved = Math.max(inv.reservedQuantity - res.quantity, 0);

            const updatedInv = await tx.inventory.update({
              where: { id: inv.id },
              data: { reservedQuantity: newReserved }
            });

            await tx.reservation.update({
              where: { id: res.id },
              data: { status: ReservationStatus.RELEASED }
            });

            await tx.inventoryTransaction.create({
              data: {
                inventoryId: inv.id,
                quantity: res.quantity,
                movementType: MovementType.RELEASE,
                reason: `Released from Cancelled Order ${order.orderNumber}`,
                referenceType: 'ORDER',
                referenceId: order.id,
                createdBy
              }
            });

            broadcastEvent('INVENTORY_UPDATED', {
              ...updatedInv,
              availableQuantity: updatedInv.physicalQuantity - updatedInv.reservedQuantity
            });
          }
        }
      }

      const updatedOrder = await tx.customerOrder.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        include: {
          customer: true,
          items: {
            include: {
              item: true,
              reservations: true
            }
          }
        }
      });

      broadcastEvent('ORDER_CANCELLED', updatedOrder);

      return updatedOrder;
    });
  }
}
