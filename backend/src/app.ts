import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import authRoutes from './routes/auth.routes';
import inventoryRoutes from './routes/inventory.routes';
import workOrderRoutes from './routes/workOrder.routes';
import transferRoutes from './routes/transfer.routes';
import customerRoutes from './routes/customer.routes';
import orderRoutes from './routes/order.routes';
import healthRoutes from './routes/health.routes';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

app.use(cors());
app.use(express.json());

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini Operations ERP API Specification',
      version: '1.0.0',
      description: 'Production REST API for Mini Operations ERP featuring Auth, Inventory, Work Orders, Stock Transfers, Customer Orders, and Stock Reservation.'
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: []
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Attach manual custom Swagger UI spec
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup({
  ...swaggerSpec,
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@example.com' },
                  password: { type: 'string', example: 'Password123!' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Successful login returning JWT' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get Current Authenticated User',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Current user object' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health Check',
        responses: {
          200: { description: 'API & Database Health Status' }
        }
      }
    },
    '/inventory': {
      get: {
        tags: ['Inventory'],
        summary: 'List Inventory items with available stock',
        parameters: [
          { name: 'locationId', in: 'query', schema: { type: 'string' } },
          { name: 'categoryId', in: 'query', schema: { type: 'string' } },
          { name: 'lowStock', in: 'query', schema: { type: 'boolean' } }
        ],
        responses: { 200: { description: 'List of inventory records' } }
      }
    },
    '/inventory/adjust': {
      post: {
        tags: ['Inventory'],
        summary: 'Adjust Physical Stock Quantity',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  itemId: { type: 'string' },
                  locationId: { type: 'string' },
                  quantity: { type: 'integer', example: 50 },
                  reason: { type: 'string', example: 'Initial stock intake' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Updated inventory record' },
          400: { description: 'Validation error' },
          403: { description: 'Forbidden - ADMIN/OPERATIONS_USER required' }
        }
      }
    },
    '/work-orders': {
      get: {
        tags: ['Work Orders'],
        summary: 'List Work Orders',
        responses: { 200: { description: 'List of work orders with calculated shortage' } }
      },
      post: {
        tags: ['Work Orders'],
        summary: 'Create Work Order',
        responses: { 201: { description: 'Created work order' } }
      }
    },
    '/transfers': {
      get: {
        tags: ['Transfers'],
        summary: 'List Internal Stock Transfers',
        responses: { 200: { description: 'List of transfers' } }
      },
      post: {
        tags: ['Transfers'],
        summary: 'Create Transfer Request',
        responses: { 201: { description: 'Created transfer request' } }
      }
    },
    '/transfers/{id}/dispatch': {
      post: {
        tags: ['Transfers'],
        summary: 'Dispatch Internal Transfer',
        responses: {
          200: { description: 'Dispatched transfer' },
          409: { description: 'Conflict - already dispatched/received or insufficient stock' }
        }
      }
    },
    '/transfers/{id}/receive': {
      post: {
        tags: ['Transfers'],
        summary: 'Receive Internal Transfer',
        responses: {
          200: { description: 'Received transfer' },
          409: { description: 'Conflict - already received or not dispatched' }
        }
      }
    },
    '/customers': {
      get: { tags: ['Customers'], summary: 'List Customers' },
      post: { tags: ['Customers'], summary: 'Create Customer' }
    },
    '/orders': {
      get: { tags: ['Customer Orders'], summary: 'List Customer Orders' },
      post: { tags: ['Customer Orders'], summary: 'Create Customer Order' }
    },
    '/orders/{id}/reserve': {
      post: {
        tags: ['Customer Orders'],
        summary: 'Reserve Stock for Customer Order',
        responses: {
          200: { description: 'Stock reserved successfully' },
          409: { description: 'Over-reservation Conflict Error' }
        }
      }
    },
    '/orders/{id}/cancel': {
      post: {
        tags: ['Customer Orders'],
        summary: 'Cancel Customer Order and Release Stock',
        responses: { 200: { description: 'Order cancelled and stock released' } }
      }
    }
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/health', healthRoutes);

app.use(errorHandler);
