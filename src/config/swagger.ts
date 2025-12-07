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
              enum: ['CASH', 'PAYPAL', 'TRANSFER'] 
            },
            qrCode: { type: 'string' },
            passengerName: { type: 'string' },
            passengerCedula: { type: 'string' }
          }
        },
        Frequency: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            departureTime: { type: 'string', example: '08:00' },
            operatingDays: { 
              type: 'array', 
              items: { 
                type: 'string',
                enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
              } 
            },
            routeId: { type: 'string', format: 'uuid' },
            busGroupId: { type: 'string', format: 'uuid' },
            cooperativaId: { type: 'string', format: 'uuid' }
          }
        },
        BusGroup: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            cooperativaId: { type: 'string', format: 'uuid' },
            buses: { 
              type: 'array',
              items: { $ref: '#/components/schemas/Bus' }
            }
          }
        },
        City: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            province: { type: 'string' }
          }
        },
        Expense: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tripId: { type: 'string', format: 'uuid' },
            type: { 
              type: 'string',
              enum: ['FUEL', 'TOLL', 'MAINTENANCE', 'FOOD', 'OTHER']
            },
            description: { type: 'string' },
            amount: { type: 'number' },
            receipt: { type: 'string', nullable: true },
            createdBy: { type: 'string', format: 'uuid' }
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
        description: 'Gestión de flota de buses y grupos'
      },
      {
        name: 'Ciudades',
        description: 'Gestión de ciudades disponibles'
      },
      {
        name: 'Rutas',
        description: 'Gestión de rutas de transporte'
      },
      {
        name: 'Frecuencias',
        description: 'Gestión de horarios y frecuencias de viajes'
      },
      {
        name: 'Viajes',
        description: 'Gestión de viajes programados y búsqueda pública'
      },
      {
        name: 'Tickets',
        description: 'Venta y gestión de tickets de pasajeros'
      },
      {
        name: 'Operaciones',
        description: 'Validación QR, manifiestos y gestión de gastos'
      },
      {
        name: 'Dashboard',
        description: 'Métricas y reportes del sistema'
      },
      {
        name: 'Reports',
        description: 'Reportes de ventas y estadísticas'
      },
      {
        name: 'Staff',
        description: 'Gestión de personal (choferes, oficinistas, admins)'
      },
      {
        name: 'Usuarios',
        description: 'Búsqueda y gestión de usuarios'
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
