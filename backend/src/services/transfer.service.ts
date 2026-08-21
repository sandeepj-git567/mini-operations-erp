import { prisma } from '../config/prisma';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { broadcastEvent } from './realtime.service';
import { TransferStatus, MovementType } from '../types';
import { Prisma } from '@prisma/client';

export class TransferService {
  static async createTransfer(
    sourceLocationId: string,
    destinationLocationId: string,
    itemId: string,
    quantity: number,
    createdBy: string
  ) {
    if (sourceLocationId === destinationLocationId) {
      throw new ValidationError('Source and destination locations must be different');
    }

    if (quantity <= 0) {
      throw new ValidationError('Transfer quantity must be greater than zero');
    }

    const sourceInv = await prisma.inventory.findUnique({
      where: { itemId_locationId: { itemId, locationId: sourceLocationId } }
    });

    const sourceAvailable = sourceInv ? sourceInv.physicalQuantity - sourceInv.reservedQuantity : 0;
    if (quantity > sourceAvailable) {
      throw new ConflictError(
        `Insufficient available stock at source location. Available: ${sourceAvailable}, Requested transfer: ${quantity}`
      );
    }

    const count = await prisma.transfer.count();
    const transferNumber = `TRF-${1000 + count + 1}`;

    const transfer = await prisma.transfer.create({
      data: {
        transferNumber,
        sourceLocationId,
        destinationLocationId,
        itemId,
        quantity,
        status: TransferStatus.REQUESTED,
        createdBy
      },
      include: {
        sourceLocation: true,
        destinationLocation: true,
        item: { include: { category: true } }
      }
    });

    broadcastEvent('TRANSFER_CREATED', transfer);

    return transfer;
  }

  static async getTransfers(status?: TransferStatus) {
    const whereClause: any = {};
    if (status) whereClause.status = status;

    return prisma.transfer.findMany({
      where: whereClause,
      include: {
        sourceLocation: true,
        destinationLocation: true,
        item: { include: { category: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async dispatchTransfer(id: string, createdBy: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const transfer = await tx.transfer.findUnique({
        where: { id },
        include: {
          sourceLocation: true,
          destinationLocation: true,
          item: true
        }
      });

      if (!transfer) {
        throw new NotFoundError('Transfer record not found');
      }

      if (transfer.status === TransferStatus.DISPATCHED) {
        throw new ConflictError('Transfer has already been dispatched');
      }

      if (transfer.status === TransferStatus.RECEIVED) {
        throw new ConflictError('Cannot dispatch a transfer that has already been received');
      }

      if (transfer.status !== TransferStatus.REQUESTED) {
        throw new ValidationError(`Invalid transfer status for dispatch: ${transfer.status}`);
      }

      // Check source inventory available stock
      const sourceInv = await tx.inventory.findUnique({
        where: { itemId_locationId: { itemId: transfer.itemId, locationId: transfer.sourceLocationId } }
      });

      const available = sourceInv ? sourceInv.physicalQuantity - sourceInv.reservedQuantity : 0;
      if (!sourceInv || transfer.quantity > available) {
        throw new ConflictError(
          `Cannot dispatch transfer: Insufficient available stock at source location (${available}) for transfer quantity (${transfer.quantity})`
        );
      }

      // Decrease source physical stock
      const updatedSourceInv = await tx.inventory.update({
        where: { id: sourceInv.id },
        data: { physicalQuantity: sourceInv.physicalQuantity - transfer.quantity }
      });

      // Create InventoryTransaction for source
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: sourceInv.id,
          quantity: transfer.quantity,
          movementType: MovementType.TRANSFER_OUT,
          reason: `Dispatched Transfer ${transfer.transferNumber}`,
          referenceType: 'TRANSFER',
          referenceId: transfer.id,
          createdBy
        }
      });

      // Update transfer status
      const updatedTransfer = await tx.transfer.update({
        where: { id },
        data: {
          status: TransferStatus.DISPATCHED,
          dispatchedAt: new Date()
        },
        include: {
          sourceLocation: true,
          destinationLocation: true,
          item: { include: { category: true } }
        }
      });

      // Broadcast real-time events
      broadcastEvent('TRANSFER_DISPATCHED', updatedTransfer);
      broadcastEvent('INVENTORY_UPDATED', {
        ...updatedSourceInv,
        availableQuantity: updatedSourceInv.physicalQuantity - updatedSourceInv.reservedQuantity
      });

      return updatedTransfer;
    });
  }

  static async receiveTransfer(id: string, createdBy: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const transfer = await tx.transfer.findUnique({
        where: { id },
        include: {
          sourceLocation: true,
          destinationLocation: true,
          item: true
        }
      });

      if (!transfer) {
        throw new NotFoundError('Transfer record not found');
      }

      if (transfer.status === TransferStatus.RECEIVED) {
        throw new ConflictError('Transfer has already been received');
      }

      if (transfer.status === TransferStatus.REQUESTED) {
        throw new ConflictError('Cannot receive a transfer before it has been dispatched');
      }

      if (transfer.status !== TransferStatus.DISPATCHED) {
        throw new ValidationError(`Invalid transfer status for receive: ${transfer.status}`);
      }

      // Upsert destination inventory
      let destInv = await tx.inventory.findUnique({
        where: { itemId_locationId: { itemId: transfer.itemId, locationId: transfer.destinationLocationId } }
      });

      if (!destInv) {
        destInv = await tx.inventory.create({
          data: {
            itemId: transfer.itemId,
            locationId: transfer.destinationLocationId,
            physicalQuantity: 0,
            reservedQuantity: 0
          }
        });
      }

      // Increase destination physical stock
      const updatedDestInv = await tx.inventory.update({
        where: { id: destInv.id },
        data: { physicalQuantity: destInv.physicalQuantity + transfer.quantity }
      });

      // Create InventoryTransaction for destination
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: destInv.id,
          quantity: transfer.quantity,
          movementType: MovementType.TRANSFER_IN,
          reason: `Received Transfer ${transfer.transferNumber}`,
          referenceType: 'TRANSFER',
          referenceId: transfer.id,
          createdBy
        }
      });

      // Update transfer status
      const updatedTransfer = await tx.transfer.update({
        where: { id },
        data: {
          status: TransferStatus.RECEIVED,
          receivedAt: new Date()
        },
        include: {
          sourceLocation: true,
          destinationLocation: true,
          item: { include: { category: true } }
        }
      });

      // Broadcast real-time events
      broadcastEvent('TRANSFER_RECEIVED', updatedTransfer);
      broadcastEvent('INVENTORY_UPDATED', {
        ...updatedDestInv,
        availableQuantity: updatedDestInv.physicalQuantity - updatedDestInv.reservedQuantity
      });

      return updatedTransfer;
    });
  }
}
