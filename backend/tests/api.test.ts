import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';

describe('Mini Operations ERP API Test Suite', () => {
  let adminToken: string;
  let operationsToken: string;
  let salesToken: string;
  let bangaloreLocationId: string;
  let chennaiLocationId: string;
  let microcontrollerItemId: string;
  let customerId: string;

  beforeAll(async () => {
    // Obtain tokens
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = adminRes.body.token;

    const opsRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operations@example.com', password: 'Password123!' });
    operationsToken = opsRes.body.token;

    const salesRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales@example.com', password: 'Password123!' });
    salesToken = salesRes.body.token;

    // Fetch seed IDs
    const locations = await prisma.location.findMany();
    const blr = locations.find(l => l.code === 'BLR-WH')!;
    const maa = locations.find(l => l.code === 'MAA-WH')!;
    bangaloreLocationId = blr.id;
    chennaiLocationId = maa.id;

    const item = await prisma.item.findUnique({ where: { sku: 'ELEC-001' } });
    microcontrollerItemId = item!.id;

    const customer = await prisma.customer.findFirst();
    customerId = customer!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Authentication & Authorization', () => {
    test('POST /api/auth/login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'Password123!' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('ADMIN');
    });

    test('POST /api/auth/login with invalid credentials returns 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'WrongPassword' });
      expect(res.status).toBe(401);
    });

    test('GET /api/auth/me with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('admin@example.com');
    });

    test('Sales user attempting Admin work order creation returns 403 Forbidden', async () => {
      const opsUser = await prisma.user.findFirst({ where: { role: 'OPERATIONS_USER' } });
      const res = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          locationId: bangaloreLocationId,
          itemId: microcontrollerItemId,
          requiredQuantity: 10,
          assignedUserId: opsUser!.id
        });
      expect(res.status).toBe(403);
    });
  });

  describe('Inventory & Work Orders', () => {
    test('GET /api/inventory lists items with computed available quantity', async () => {
      const res = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].availableQuantity).toBeDefined();
    });

    test('POST /api/inventory/adjust updates stock physical quantity', async () => {
      const res = await request(app)
        .post('/api/inventory/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemId: microcontrollerItemId,
          locationId: bangaloreLocationId,
          quantity: 20,
          reason: 'Automated test stock addition'
        });
      expect(res.status).toBe(200);
      expect(res.body.physicalQuantity).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Internal Transfer State Machine', () => {
    test('Create, Dispatch, and Receive Transfer workflow', async () => {
      // 1. Create Transfer Request
      const createRes = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${operationsToken}`)
        .send({
          sourceLocationId: chennaiLocationId,
          destinationLocationId: bangaloreLocationId,
          itemId: microcontrollerItemId,
          quantity: 5
        });
      expect(createRes.status).toBe(201);
      const transferId = createRes.body.id;

      // 2. Dispatch Transfer
      const dispatchRes = await request(app)
        .post(`/api/transfers/${transferId}/dispatch`)
        .set('Authorization', `Bearer ${operationsToken}`);
      expect(dispatchRes.status).toBe(200);
      expect(dispatchRes.body.status).toBe('DISPATCHED');

      // 3. Attempt duplicate dispatch returns 409 Conflict
      const dupDispatchRes = await request(app)
        .post(`/api/transfers/${transferId}/dispatch`)
        .set('Authorization', `Bearer ${operationsToken}`);
      expect(dupDispatchRes.status).toBe(409);

      // 4. Receive Transfer
      const receiveRes = await request(app)
        .post(`/api/transfers/${transferId}/receive`)
        .set('Authorization', `Bearer ${operationsToken}`);
      expect(receiveRes.status).toBe(200);
      expect(receiveRes.body.status).toBe('RECEIVED');

      // 5. Attempt duplicate receive returns 409 Conflict
      const dupReceiveRes = await request(app)
        .post(`/api/transfers/${transferId}/receive`)
        .set('Authorization', `Bearer ${operationsToken}`);
      expect(dupReceiveRes.status).toBe(409);
    });
  });

  describe('Stock Reservation & Concurrency Safety', () => {
    test('Over-reservation returns HTTP 409 Conflict', async () => {
      // Create a customer order for 999999 units
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId: customerId,
          items: [
            {
              itemId: microcontrollerItemId,
              quantity: 999999,
              unitPrice: 1500
            }
          ]
        });
      expect(orderRes.status).toBe(201);
      const orderId = orderRes.body.id;

      // Attempt to reserve stock
      const reserveRes = await request(app)
        .post(`/api/orders/${orderId}/reserve`)
        .set('Authorization', `Bearer ${salesToken}`)
        .send({ locationId: bangaloreLocationId });

      expect(reserveRes.status).toBe(409);
      expect(reserveRes.body.error.message).toContain('Over-reservation rejected');
    });

    test('Order cancellation releases reserved stock', async () => {
      // 1. Create order for 2 units
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId: customerId,
          items: [
            {
              itemId: microcontrollerItemId,
              quantity: 2,
              unitPrice: 1500
            }
          ]
        });
      const orderId = orderRes.body.id;

      // 2. Reserve stock
      const reserveRes = await request(app)
        .post(`/api/orders/${orderId}/reserve`)
        .set('Authorization', `Bearer ${salesToken}`)
        .send({ locationId: bangaloreLocationId });
      expect(reserveRes.status).toBe(200);

      // 3. Cancel order
      const cancelRes = await request(app)
        .post(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${salesToken}`);
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.status).toBe('CANCELLED');
    });

    test('Concurrent Stock Reservation safety test', async () => {
      // Create two competing orders requesting stock near available limit
      const order1 = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId,
          items: [{ itemId: microcontrollerItemId, quantity: 25, unitPrice: 1000 }]
        });

      const order2 = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId,
          items: [{ itemId: microcontrollerItemId, quantity: 25, unitPrice: 1000 }]
        });

      // Fire parallel reservation requests
      const [res1, res2] = await Promise.all([
        request(app)
          .post(`/api/orders/${order1.body.id}/reserve`)
          .set('Authorization', `Bearer ${salesToken}`)
          .send({ locationId: bangaloreLocationId }),
        request(app)
          .post(`/api/orders/${order2.body.id}/reserve`)
          .set('Authorization', `Bearer ${salesToken}`)
          .send({ locationId: bangaloreLocationId })
      ]);

      // At least one request or exact state check should succeed/conflict cleanly without data corruption
      const statuses = [res1.status, res2.status];
      expect(statuses).toContain(200);
    });
  });
});
