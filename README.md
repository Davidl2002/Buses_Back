# MoviPass Backend - Sistema de Venta de Tickets de Buses Interprovinciales

Backend completo desarrollado con Node.js, Express y TypeScript para un sistema SaaS de venta de tickets de buses interprovinciales.

## 🚀 Características

### 1. Módulo de Autenticación y Seguridad
- ✅ Registro y login con JWT
- ✅ Sistema de roles: SuperAdmin, Admin, Oficinista, Chofer, Cliente
- ✅ Verificación de email con Brevo
- ✅ Recuperación de contraseña
- ✅ Middleware de aislamiento por cooperativa (SaaS)

### 2. Módulo de Flota (SaaS Core)
- ✅ CRUD de Cooperativas con configuración visual
- ✅ Gestión de Buses con diseñador de asientos
- ✅ Grupos de buses para asignación automática
- ✅ Características configurables (AC, WiFi, Baño, TV)

### 3. Módulo de Logística
- ✅ CRUD de Rutas con paradas intermedias
- ✅ Frecuencias con días de operación
- ✅ Generador automático de viajes
- ✅ Asignación inteligente de buses por grupo

### 4. Módulo de Ventas y Pagos
- ✅ Búsqueda avanzada de viajes
- ✅ Motor de asientos en tiempo real con Socket.IO
- ✅ Integración con PayPal
- ✅ Pago en efectivo (oficinista)
- ✅ Upload de comprobantes
- ✅ Generación de PDF con QR
- ✅ Envío automático de tickets por email

### 5. Módulo de Operaciones
- ✅ Validación de tickets por QR
- ✅ Manifiesto de pasajeros
- ✅ Registro de gastos operativos
- ✅ Reportes de ganancias (ingresos - gastos)

## 📋 Requisitos Previos

- Node.js 18+ 
- Docker y Docker Compose
- PostgreSQL (vía Docker)

## 🛠️ Instalación

### 1. Clonar y configurar

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
```

### 2. Configurar variables de entorno

Edita el archivo `.env` con tus credenciales:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/MoviPass?schema=public"
JWT_SECRET=tu-secreto-jwt-seguro
BREVO_API_KEY=tu-api-key-de-brevo
PAYPAL_CLIENT_ID=tu-client-id-paypal
PAYPAL_CLIENT_SECRET=tu-client-secret-paypal
```

### 3. Iniciar base de datos

```bash
# Iniciar contenedor Docker de PostgreSQL
docker-compose up -d

# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Poblar con datos de prueba
npm run prisma:seed
```

### 4. Iniciar servidor

```bash
# Modo desarrollo
npm run dev

# Producción
npm run build
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
MovPass_Back/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── seed.ts                # Datos iniciales
├── src/
│   ├── config/
│   │   └── database.ts        # Configuración Prisma
│   ├── controllers/           # Lógica de negocio
│   │   ├── auth.controller.ts
│   │   ├── cooperativa.controller.ts
│   │   ├── bus.controller.ts
│   │   ├── route.controller.ts
│   │   ├── frequency.controller.ts
│   │   ├── trip.controller.ts
│   │   ├── ticket.controller.ts
│   │   └── operations.controller.ts
│   ├── middlewares/           # Middlewares
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── upload.middleware.ts
│   ├── routes/                # Rutas
│   ├── services/              # Servicios externos
│   │   ├── email.service.ts
│   │   ├── jwt.service.ts
│   │   ├── paypal.service.ts
│   │   └── pdf.service.ts
│   ├── validators/            # Validaciones Zod
│   └── index.ts               # Punto de entrada
├── uploads/                   # Archivos subidos
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## 🔐 Roles y Permisos

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **SUPER_ADMIN** | Administrador global | Acceso total, gestión de cooperativas |
| **ADMIN** | Administrador de cooperativa | Gestión completa de su cooperativa |
| **OFICINISTA** | Personal de ventanilla | Venta de tickets, validación QR |
| **CHOFER** | Conductor | Validación QR, registro de gastos |
| **CLIENTE** | Usuario final | Compra de tickets, ver historial |

## 🔌 Endpoints Principales

### Autenticación
```
POST   /api/auth/register          - Registro de cliente
POST   /api/auth/login             - Iniciar sesión
GET    /api/auth/verify-email      - Verificar email
POST   /api/auth/forgot-password   - Solicitar reset
POST   /api/auth/reset-password    - Resetear contraseña
POST   /api/auth/staff             - Crear staff (Admin)
```

### Cooperativas
```
POST   /api/cooperativas           - Crear cooperativa (SuperAdmin)
GET    /api/cooperativas           - Listar cooperativas
GET    /api/cooperativas/:id       - Ver cooperativa
PUT    /api/cooperativas/:id       - Actualizar
DELETE /api/cooperativas/:id       - Eliminar
```

### Buses
```
POST   /api/buses                  - Crear bus
GET    /api/buses                  - Listar buses
GET    /api/buses/:id              - Ver bus
PUT    /api/buses/:id              - Actualizar
DELETE /api/buses/:id              - Eliminar
POST   /api/buses/groups           - Crear grupo de buses
GET    /api/buses/groups/list      - Listar grupos
```

### Rutas y Frecuencias
```
POST   /api/routes                 - Crear ruta
GET    /api/routes                 - Listar rutas
POST   /api/frequencies            - Crear frecuencia
GET    /api/frequencies            - Listar frecuencias
POST   /api/frequencies/generate-trips - Generar viajes
```

### Viajes
```
GET    /api/trips/search           - Buscar viajes (público)
GET    /api/trips                  - Listar viajes
GET    /api/trips/:id              - Ver viaje
PATCH  /api/trips/:id/status       - Actualizar estado
PATCH  /api/trips/:id/personnel    - Asignar personal
```

### Tickets
```
GET    /api/tickets/seat-map/:tripId  - Mapa de asientos (público)
POST   /api/tickets/reserve-seat      - Reservar asiento
POST   /api/tickets                   - Crear ticket
GET    /api/tickets/my-tickets        - Mis tickets
POST   /api/tickets/payment/paypal/initiate - Iniciar pago PayPal
POST   /api/tickets/payment/paypal/execute  - Ejecutar pago
POST   /api/tickets/payment/upload-proof    - Subir comprobante
```

### Operaciones
```
POST   /api/operations/validate-qr     - Validar QR
GET    /api/operations/manifest/:tripId - Manifiesto
POST   /api/operations/expenses        - Registrar gasto
GET    /api/operations/expenses/:tripId - Ver gastos
GET    /api/operations/reports/trip/:tripId - Reporte de viaje
GET    /api/operations/reports/cooperativa - Reporte cooperativa
```

## 🎨 Características Especiales

### Diseñador de Asientos
El sistema permite crear layouts personalizados de buses:

```json
{
  "rows": 10,
  "columns": 4,
  "seats": [
    {
      "number": 1,
      "row": 0,
      "col": 0,
      "type": "VIP",
      "isAvailable": true
    }
  ]
}
```

### Sistema Multi-tenant (SaaS)
Cada cooperativa está aislada:
- Admin de "Cooperativa A" NO ve datos de "Cooperativa B"
- Middleware automático inyecta `cooperativaId` en queries
- SuperAdmin puede ver/gestionar todas las cooperativas

### Generador de Viajes
Genera automáticamente viajes para un rango de fechas:
- Respeta días de operación de cada frecuencia
- Asigna buses de forma rotativa desde grupos
- Evita duplicados

### Motor de Asientos en Tiempo Real
Socket.IO mantiene sincronizados los asientos:
- Bloqueo temporal al seleccionar
- Notificación cuando se vende
- Liberación automática al cancelar

## 📊 Base de Datos

El esquema incluye:
- **User**: Usuarios del sistema (todos los roles)
- **Cooperativa**: Empresas de buses
- **Bus**: Flota con diseño de asientos
- **BusGroup**: Grupos para asignación
- **Route**: Rutas con paradas intermedias
- **Frequency**: Horarios y días de operación
- **Trip**: Viajes generados (hojas de ruta)
- **Ticket**: Boletos vendidos con QR
- **TripExpense**: Gastos operativos

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Compilar TypeScript
npm start            # Producción
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir Prisma Studio
npm run prisma:seed      # Poblar datos de prueba
```

## 🐳 Docker

```bash
# Iniciar PostgreSQL
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down

# Eliminar volúmenes (¡cuidado!)
docker-compose down -v
```

## 📝 Notas Importantes

1. **Seguridad**: Cambia `JWT_SECRET` en producción
2. **PayPal**: Usa modo `sandbox` para pruebas
3. **Emails**: Configura cuenta de Brevo para emails transaccionales
4. **Uploads**: Las carpetas se crean automáticamente
5. **Socket.IO**: CORS configurado para frontend

## 🤝 Contribución

Este es un proyecto académico. Para mejoras:
1. Fork el repositorio
2. Crea una rama de feature
3. Commit tus cambios
4. Push y crea Pull Request

## 📄 Licencia

MIT

## 👨‍💻 Autor

Desarrollado por David Lopez para el curso de Desarrollo Asistido por Software

---

**¡Listo para desplegar! 🚀**
