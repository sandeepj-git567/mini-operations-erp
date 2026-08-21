import { prisma } from '../config/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';
import { broadcastEvent } from './realtime.service';
import { MovementType } from '@prisma/client';

export class InventoryService {
  static async getInventories(locationId?: string, categoryId?: string, lowStock?: boolean) {
    const whereClause: any = {};
    if (locationId) whereClause.locationId = locationId;
    if (categoryId) whereClause.item = { categoryId };

    const rawInventories = await prisma.inventory.findMany({
      where: whereClause,
      include: {
        item: {
          include: { category: true }
        },
        location: true
      },
      orderBy: { item: { sku: 'asc' } }
    });

    const inventoriesWithAvailable = rawInventories.map(inv => ({
      ...inv,
      availableQuantity: inv.physicalQuantity - inv.reservedQuantity
    }));

    if (lowStock) {
      return inventoriesWithAvailable.filter(inv => inv.availableQuantity < 10);
    }

    return inventoriesWithAvailable;
  }

  static async getInventoryById(id: string) {
    const inv = await prisma.inventory.findUnique({
      where: { id },
      include: {
        item: { include: { category: true } },
        location: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!inv) {
      throw new NotFoundError('Inventory record not found');
    }

    return {
      ...inv,
      availableQuantity: inv.physicalQuantity - inv.reservedQuantity
    };
  }

  static async adjustInventory(
    itemId: string,
    locationId: string,
    quantity: number,
    reason: string,
    createdBy: string
  ) {
    return prisma.$transaction(async (tx) => {
      let inv = await tx.inventory.findUnique({
        where: { itemId_locationId: { itemId, locationId } }
      });

      if (!inv) {
        if (quantity < 0) {
          throw new ValidationError('Cannot perform negative adjustment for non-existent inventory');
        }
        inv = await tx.inventory.create({
          data: {
            itemId,
            locationId,
            physicalQuantity: 0,
            reservedQuantity: 0
          }
        });
      }

      const newPhysical = inv.physicalQuantity + quantity;
      if (newPhysical < 0) {
        throw new ValidationError(`Physical quantity cannot be negative. Current: ${inv.physicalQuantity}, Adjustment: ${quantity}`);
      }

      if (newPhysical < inv.reservedQuantity) {
        throw new ValidationError(`Physical quantity (${newPhysical}) cannot be less than reserved quantity (${inv.reservedQuantity})`);
      }

      const updatedInv = await tx.inventory.update({
        where: { id: inv.id },
        data: { physicalQuantity: newPhysical },
        include: {
          item: { include: { category: true } },
          location: true
        }
      });

      const movementType: MovementType = quantity > 0 ? MovementType.IN : MovementType.OUT;

      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inv.id,
          quantity: Math.abs(quantity),
          movementType,
          reason,
          createdBy
        }
      });

      const payload = {
        ...updatedInv,
        availableQuantity: updatedInv.physicalQuantity - updatedInv.reservedQuantity
      };

      broadcastEvent('INVENTORY_UPDATED', payload);

      return payload;
    });
  }

  static async getTransactions(inventoryId: string) {
    return prisma.inventoryTransaction.findMany({
      where: { inventoryId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
