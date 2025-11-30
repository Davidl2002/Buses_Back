import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application, Request, Response } from 'express';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MoviPass API',
      version: '1.0.0',
      description: 'API REST para sistema de venta de tickets de buses interprovinciales',
      contact: {
        name: 'MoviPass Support',
        email: 'support@movipass.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      },
      {
        url: 'https://api.movipass.com',
        description: 'Servidor de producción'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa tu token JWT obtenido del endpoint /auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            role: { 
              type: 'string', 
              enum: ['SUPER_ADMIN', 'ADMIN', 'OFICINISTA', 'CHOFER', 'CLIENTE'] 
            },
            status: { 
              type: 'string', 
              enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] 
            },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            cedula: { type: 'string' },
            phone: { type: 'string' },
            emailVerified: { type: 'boolean' },
            cooperativaId: { type: 'string', format: 'uuid', nullable: true }
          }
        },
        Cooperativa: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string' },
            ruc: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            config: { type: 'object' }
          }
        },
        Bus: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            placa: { type: 'string' },
            marca: { type: 'string' },
            modelo: { type: 'string' },
            year: { type: 'number' },
            numeroInterno: { type: 'string' },
            totalSeats: { type: 'number' },
            seatLayout: { type: 'object' },
            hasAC: { type: 'boolean' },
            hasWifi: { type: 'boolean' },
            hasBathroom: { type: 'boolean' },
            hasTV: { type: 'boolean' },
            status: { 
              type: 'string', 
              enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'] 
            }
          }
        },
        Route: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            origin: { type: 'string' },
            destination: { type: 'string' },
            distance: { type: 'number' },
            estimatedDuration: { type: 'number' },
            basePrice: { type: 'number' },
            stops: { type: 'array', items: { type: 'object' } }
          }
        },
        Trip: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date' },
            departureTime: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] 
            },
            availableSeats: { type: 'number' }
          }
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            ticketNumber: { type: 'string' },
            seatNumber: { type: 'number' },
            price: { type: 'number' },
            status: { 
              type: 'string', 
              enum: ['RESERVED', 'PAID', 'USED', 'CANCELLED'] 
            },
            paymentMethod: { 
              type: 'string', 
              enum: ['CASH', 'PAYPAL'] 
            },
            qrCode: { type: 'string' }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Autenticación y gestión de usuarios'
      },
      {
        name: 'Cooperativas',
        description: 'Gestión de cooperativas de transporte'
      },
      {
        name: 'Buses',
        description: 'Gestión de flota de buses'
      },
      {
        name: 'Rutas',
        description: 'Gestión de rutas de transporte'
      },
      {
        name: 'Frecuencias',
        description: 'Gestión de horarios y frecuencias'
      },
      {
        name: 'Viajes',
        description: 'Gestión de viajes programados'
      },
      {
        name: 'Tickets',
        description: 'Venta y gestión de tickets'
      },
      {
        name: 'Operaciones',
        description: 'Operaciones y reportes'
      }
    ]
  },
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../routes/*.js')
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application) => {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MoviPass API Docs'
  }));

  // JSON endpoint
  app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Swagger docs disponible en: http://localhost:3000/api-docs');
};
