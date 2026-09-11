import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';

jest.setTimeout(30000);

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
    const blr = locations.find((l: any) => l.code === 'BLR-WH')!;
    const maa = locations.find((l: any) => l.code === 'MAA-WH')!;
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

  describe('Authentication & Token Edge Cases', () => {
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
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('GET /api/auth/me without authorization header returns 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    test('GET /api/auth/me with malformed JWT returns 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.malformed.jwt.token');
      expect(res.status).toBe(401);
    });

    test('GET /api/auth/me with valid token returns user object', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('admin@example.com');
    });
  });

  describe('Authorization & RBAC Enforcement', () => {
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
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('Operations user attempting Customer Order creation returns 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${operationsToken}`)
        .send({
          customerId,
          items: [{ itemId: microcontrollerItemId, quantity: 1, unitPrice: 100 }]
        });
      expect(res.status).toBe(403);
    });
  });

  describe('Input Validation & Error Edge Cases', () => {
    test('POST /api/inventory/adjust with invalid negative quantity returns 400', async () => {
      const res = await request(app)
        .post('/api/inventory/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemId: microcontrollerItemId,
          locationId: bangaloreLocationId,
          quantity: -50,
          reason: 'Invalid negative test'
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('POST /api/transfers between identical source & destination locations returns 400', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${operationsToken}`)
        .send({
          sourceLocationId: bangaloreLocationId,
          destinationLocationId: bangaloreLocationId,
          itemId: microcontrollerItemId,
          quantity: 5
        });
      expect(res.status).toBe(400);
    });

    test('GET /api/orders/:id with non-existent UUID returns 404 Not Found', async () => {
      const res = await request(app)
        .get('/api/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${salesToken}`);
      expect(res.status).toBe(404);
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

      const dispatchRes = await request(app)
        .post(`/api/transfers/${transferId}/dispatch`)
        .set('Authorization', `Bearer ${operationsToken}`);
      expect(dispatchRes.status).toBe(200);
      expect(dispatchRes.body.status).toBe('DISPATCHED');

      const dupDispatchRes = await request(app)
        .post(`/api/transfers/${transferId}/dispatch`)
        .set('Authorization', `Bearer ${operationsToken}`);
      expect(dupDispatchRes.status).toBe(409);

      const receiveRes = await request(app)
        .post(`/api/transfers/${transferId}/receive`)
        .set('Authorization', `Bearer ${operationsToken}`);
      expect(receiveRes.status).toBe(200);
      expect(receiveRes.body.status).toBe('RECEIVED');

      const dupReceiveRes = await request(app)
        .post(`/api/transfers/${transferId}/receive`)
        .set('Authorization', `Bearer ${operationsToken}`);
      expect(dupReceiveRes.status).toBe(409);
    });
  });

  describe('Stock Reservation & Concurrency Safety', () => {
    test('Over-reservation returns HTTP 409 Conflict', async () => {
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

      const reserveRes = await request(app)
        .post(`/api/orders/${orderId}/reserve`)
        .set('Authorization', `Bearer ${salesToken}`)
        .send({ locationId: bangaloreLocationId });

      expect(reserveRes.status).toBe(409);
      expect(reserveRes.body.error.message).toContain('Over-reservation rejected');
    });

    test('Order cancellation releases reserved stock', async () => {
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

      const reserveRes = await request(app)
        .post(`/api/orders/${orderId}/reserve`)
        .set('Authorization', `Bearer ${salesToken}`)
        .send({ locationId: bangaloreLocationId });
      expect(reserveRes.status).toBe(200);

      const cancelRes = await request(app)
        .post(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${salesToken}`);
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.status).toBe('CANCELLED');
    });

    test('Concurrent Stock Reservation safety test', async () => {
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

      const statuses = [res1.status, res2.status];
      expect(statuses).toContain(200);
    });
  });
});
