import { prisma } from '../config/prisma';
import { NotFoundError, ConflictError } from '../utils/errors';
import { broadcastEvent } from './realtime.service';
import { MovementType, OrderStatus, ReservationStatus } from '../types';
import { Prisma } from '@prisma/client';

export class ReservationService {
  static async reserveStockForOrder(orderId: string, locationId: string, createdBy: string) {
    // Collect pending events to broadcast only AFTER successful transaction commit
    const pendingEvents: { event: string; payload: any }[] = [];

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
        let inv = await tx.inventory.findUnique({
          where: { itemId_locationId: { itemId: item.itemId, locationId } }
        });

        if (!inv) {
          throw new ConflictError(
            `No inventory record exists at this location for item ${item.item.sku} (${item.item.name})`
          );
        }

        // Perform explicit PostgreSQL Row Locking to prevent race conditions during concurrent reservations
        await tx.$queryRaw`
          SELECT * FROM "Inventory" WHERE "id" = ${inv.id} FOR UPDATE
        `;

        const lockedInv = await tx.inventory.findUnique({ where: { id: inv.id } });
        if (!lockedInv) {
          throw new NotFoundError('Locked inventory record not found');
        }

        const available = lockedInv.physicalQuantity - lockedInv.reservedQuantity;
        if (item.quantity > available) {
          throw new ConflictError(
            `Over-reservation rejected: Requested ${item.quantity} units for ${item.item.name} (${item.item.sku}), but only ${available} available at this location.`
          );
        }

        const updatedInv = await tx.inventory.update({
          where: { id: lockedInv.id },
          data: { reservedQuantity: lockedInv.reservedQuantity + item.quantity }
        });

        const reservation = await tx.reservation.create({
          data: {
            orderItemId: item.id,
            inventoryId: lockedInv.id,
            quantity: item.quantity,
            status: ReservationStatus.RESERVED
          }
        });

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

        pendingEvents.push({
          event: 'INVENTORY_UPDATED',
          payload: {
            ...updatedInv,
            availableQuantity: updatedInv.physicalQuantity - updatedInv.reservedQuantity
          }
        });
      }

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

      pendingEvents.push({
        event: 'ORDER_RESERVED',
        payload: updatedOrder
      });

      return {
        order: updatedOrder,
        reservations: createdReservations
      };
    });

    // Broadcast WebSocket events ONLY AFTER transaction successfully commits
    pendingEvents.forEach(e => broadcastEvent(e.event, e.payload));

    return result;
  }

  static async cancelOrder(orderId: string, createdBy: string) {
    const pendingEvents: { event: string; payload: any }[] = [];

    const updatedOrder = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

            pendingEvents.push({
              event: 'INVENTORY_UPDATED',
              payload: {
                ...updatedInv,
                availableQuantity: updatedInv.physicalQuantity - updatedInv.reservedQuantity
              }
            });
          }
        }
      }

      const cancelled = await tx.customerOrder.update({
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

      pendingEvents.push({
        event: 'ORDER_CANCELLED',
        payload: cancelled
      });

      return cancelled;
    });

    // Broadcast events AFTER transaction commit
    pendingEvents.forEach(e => broadcastEvent(e.event, e.payload));

    return updatedOrder;
  }
}
