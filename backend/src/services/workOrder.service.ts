import { prisma } from '../config/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';
import { broadcastEvent } from './realtime.service';
import { WorkOrderStatus } from '@prisma/client';

export class WorkOrderService {
  static async createWorkOrder(
    locationId: string,
    itemId: string,
    requiredQuantity: number,
    assignedUserId: string,
    createdBy: string
  ) {
    const count = await prisma.workOrder.count();
    const workOrderNumber = `WO-${1000 + count + 1}`;

    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNumber,
        locationId,
        itemId,
        requiredQuantity,
        assignedUserId,
        status: WorkOrderStatus.ASSIGNED,
        createdBy
      },
      include: {
        location: true,
        item: { include: { category: true } },
        assignedUser: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    const inv = await prisma.inventory.findUnique({
      where: { itemId_locationId: { itemId, locationId } }
    });

    const availableQuantity = inv ? inv.physicalQuantity - inv.reservedQuantity : 0;
    const shortageQuantity = Math.max(requiredQuantity - availableQuantity, 0);

    const result = {
      ...workOrder,
      availableQuantity,
      shortageQuantity
    };

    broadcastEvent('WORK_ORDER_CREATED', result);

    return result;
  }

  static async getWorkOrders(locationId?: string, status?: WorkOrderStatus) {
    const whereClause: any = {};
    if (locationId) whereClause.locationId = locationId;
    if (status) whereClause.status = status;

    const workOrders = await prisma.workOrder.findMany({
      where: whereClause,
      include: {
        location: true,
        item: { include: { category: true } },
        assignedUser: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Compute shortage for each work order
    const results = await Promise.all(
      workOrders.map(async (wo) => {
        const inv = await prisma.inventory.findUnique({
          where: { itemId_locationId: { itemId: wo.itemId, locationId: wo.locationId } }
        });
        const availableQuantity = inv ? inv.physicalQuantity - inv.reservedQuantity : 0;
        const shortageQuantity = Math.max(wo.requiredQuantity - availableQuantity, 0);
        return {
          ...wo,
          availableQuantity,
          shortageQuantity
        };
      })
    );

    return results;
  }

  static async getWorkOrderById(id: string) {
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        location: true,
        item: { include: { category: true } },
        assignedUser: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    if (!wo) {
      throw new NotFoundError('Work order not found');
    }

    const inv = await prisma.inventory.findUnique({
      where: { itemId_locationId: { itemId: wo.itemId, locationId: wo.locationId } }
    });

    const availableQuantity = inv ? inv.physicalQuantity - inv.reservedQuantity : 0;
    const shortageQuantity = Math.max(wo.requiredQuantity - availableQuantity, 0);

    return {
      ...wo,
      availableQuantity,
      shortageQuantity
    };
  }

  static async updateWorkOrderStatus(id: string, status: WorkOrderStatus) {
    const wo = await prisma.workOrder.findUnique({ where: { id } });
    if (!wo) {
      throw new NotFoundError('Work order not found');
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: { status },
      include: {
        location: true,
        item: { include: { category: true } },
        assignedUser: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    const inv = await prisma.inventory.findUnique({
      where: { itemId_locationId: { itemId: updated.itemId, locationId: updated.locationId } }
    });

    const availableQuantity = inv ? inv.physicalQuantity - inv.reservedQuantity : 0;
    const shortageQuantity = Math.max(updated.requiredQuantity - availableQuantity, 0);

    const result = {
      ...updated,
      availableQuantity,
      shortageQuantity
    };

    broadcastEvent('WORK_ORDER_UPDATED', result);

    return result;
  }
}
