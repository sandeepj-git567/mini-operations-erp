import { prisma } from '../config/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';
import { broadcastEvent } from './realtime.service';
import { OrderStatus } from '../types';

export class OrderService {
  static async createCustomer(name: string, phone: string, email: string, companyName: string) {
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      throw new ValidationError(`Customer with email ${email} already exists`);
    }

    return prisma.customer.create({
      data: { name, phone, email, companyName }
    });
  }

  static async getCustomers() {
    return prisma.customer.findMany({
      orderBy: { name: 'asc' }
    });
  }

  static async createOrder(
    customerId: string,
    items: Array<{ itemId: string; quantity: number; unitPrice: number }>,
    createdBy: string
  ) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    for (const item of items) {
      const itemRecord = await prisma.item.findUnique({ where: { id: item.itemId } });
      if (!itemRecord) {
        throw new NotFoundError(`Item with ID ${item.itemId} not found`);
      }
    }

    const count = await prisma.customerOrder.count();
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${1000 + count + 1}-${uniqueSuffix}`;

    const order = await prisma.customerOrder.create({
      data: {
        orderNumber,
        customerId,
        status: OrderStatus.DRAFT,
        createdBy,
        items: {
          create: items.map(i => ({
            itemId: i.itemId,
            quantity: i.quantity,
            unitPrice: i.unitPrice
          }))
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            item: { include: { category: true } },
            reservations: true
          }
        }
      }
    });

    broadcastEvent('ORDER_CREATED', order);

    return order;
  }

  static async getOrders(status?: OrderStatus) {
    const whereClause: any = {};
    if (status) whereClause.status = status;

    return prisma.customerOrder.findMany({
      where: whereClause,
      include: {
        customer: true,
        items: {
          include: {
            item: { include: { category: true } },
            reservations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getOrderById(id: string) {
    const order = await prisma.customerOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            item: { include: { category: true } },
            reservations: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundError('Customer order not found');
    }

    return order;
  }
}
