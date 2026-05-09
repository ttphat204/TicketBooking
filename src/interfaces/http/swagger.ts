import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ticket Booking API',
      version: '1.0.0',
      description: 'API documentation for the Ticket Booking Backend system.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        OrderRequest: {
          type: 'object',
          required: ['userId', 'ticketCategoryId', 'quantity', 'idempotencyKey'],
          properties: {
            userId: { type: 'integer' },
            ticketCategoryId: { type: 'integer' },
            quantity: { type: 'integer' },
            voucherCode: { type: 'string' },
            idempotencyKey: { type: 'string' },
          },
        },
        OrderResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string' },
            totalAmount: { type: 'number' },
            discountAmount: { type: 'number' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/interfaces/http/routes/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
