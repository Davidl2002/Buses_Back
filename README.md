# MoviPass API

Documentación y guía rápida del proyecto MoviPass (backend).

**Descripción:** API REST para sistema de venta de tickets de buses interprovinciales.

---

## Requisitos mínimos

- Node.js >= 18
- npm >= 9 (o `pnpm`/`yarn` según prefieras)
- PostgreSQL (o la base de datos configurada en `DATABASE_URL`)
- Git

---

## Endpoint a la documentación Swagger

- Interfaz interactiva: `http://localhost:3000/api-docs`
- JSON OpenAPI: `http://localhost:3000/api-docs.json`

> Nota: la URL local asume `PORT=3000`. Ajusta el host/puerto si tu `.env` usa otro puerto.

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
│   ├── seed.ts                # Datos iniciales
│   └── migrations/            # Migraciones de Prisma
├── src/
│   ├── config/
│   │   ├── database.ts        # Configuración de Prisma
│   │   └── swagger.ts         # Configuración Swagger
│   ├── controllers/           # Lógica de negocio (endpoints)
│   │   ├── auth.controller.ts
│   │   ├── bus.controller.ts
│   │   ├── city.controller.ts
│   │   ├── cooperativa.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── frequency.controller.ts
│   │   ├── operations.controller.ts
│   │   ├── report.controller.ts
│   │   ├── route.controller.ts
│   │   ├── staff.controller.ts
│   │   ├── ticket.controller.ts
│   │   └── trip.controller.ts
│   ├── middlewares/           # Middlewares
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   ├── upload.middleware.ts
│   │   └── validation.middleware.ts
│   ├── routes/                # Definición de rutas y documentación (Swagger)
│   │   ├── auth.routes.ts
│   │   ├── bus.routes.ts
│   │   ├── city.routes.ts
│   │   ├── cooperativa.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── frequency.routes.ts
│   │   ├── operations.routes.ts
│   │   ├── report.routes.ts
│   │   ├── route.routes.ts
│   │   ├── staff.routes.ts
│   │   ├── ticket.routes.ts
│   │   ├── trip.routes.ts
│   │   └── users.routes.ts
│   ├── services/              # Integraciones y utilidades
│   │   ├── email.service.ts
│   │   ├── jwt.service.ts
│   │   ├── paypal.service.ts
│   │   └── pdf.service.ts
│   ├── validators/            # Validaciones
│   │   ├── auth.validator.ts
│   │   └── staff.validator.ts
│   └── index.ts               # Punto de entrada
├── uploads/                   # Archivos subidos
│   ├── buses/
│   ├── logos/
│   ├── payment-proofs/
│   └── receipts/
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
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

## Cómo crear una rama para un cambio (Git flow)

Requisito previo:

Clonar el repositorio

```
git clone https://github.com/Davidl2002/Buses_Back.git
cd MovPass_Back
```

1. Asegúrate de estar en `main` y sincronizado:

```powershell
git checkout main
git pull origin main
```

2. Crea una rama descriptiva:

```powershell
git checkout -b feat/descripcion-corta
```

3. Realiza cambios, añade y commitea:

```powershell
git add .
git commit -m "feat: descripción corta del cambio"
```

4. Empuja la rama al remoto:

```powershell
git push origin feat/descripcion-corta
```
---

## 🎨 Credenciales de Prueba

Ya incluidas en el seeder (`prisma/seed.ts`):

```
SuperAdmin:
  Email: superadmin@movipass.com
  Pass:  Admin123!

Admin (Trans Chimborazo):
  Email: admin@transchimborazo.com
  Pass:  Admin123!

Oficinista:
  Email: oficinista@transchimborazo.com
  Pass:  Oficina123!

Chofer:
  Email: chofer@transchimborazo.com
  Pass:  Chofer123!

Cliente:
  Email: cliente@test.com
  Pass:  Cliente123!
```

---


## Cómo enviar un Pull Request correctamente

- Abre un PR desde tu rama hacia `main` en GitHub.
- Título claro: `feat: descripción corta` o `fix: descripción corta`.
- En la descripción incluye:
  - Resumen del cambio
  - Issue relacionado (si existe): `#123`
  - Pasos para probar localmente
  - Consideraciones o migraciones necesarias
- Etiqueta reviewers y asigna la PR según el área.
- Asegúrate que CI (si existe) pase antes de merge.

PR template sugerido:

```
Resumen:
- Qué hace este PR:

Cómo probar:
1. Paso 1
2. Paso 2

Notas:
- Migraciones: sí/no (comando)
- Dependencias nuevas: paquete X

Issue relacionado: #
```

---

## Cómo reportar bugs o proponer nuevas funciones

1. Abre un `Issue` en el repositorio.
2. Elige la plantilla adecuada: `bug` o `feature`.
3. Incluye la siguiente información mínima:
   - Descripción del problema o propuesta
   - Pasos para reproducir (si es bug)
   - Resultado esperado y resultado actual
   - Logs / stacktrace relevantes
   - Versión de la API / commit

Ejemplo mínimo para bug:

```
Título: Error al generar PDF del ticket

Pasos:
1. Reservar ticket
2. Intentar descargar PDF

Resultado esperado: PDF descargado
Resultado actual: error 500 con mensaje X

Logs: (adjuntar)
```

---

## Estilo de código y buenas prácticas

- Proyecto en TypeScript. Mantener tipado estricto cuando sea posible.
- Sigue convenciones de commits tipo Conventional Commits (feat/fix/chore/docs/etc.).
- Ejecuta linters / formatters antes de abrir PR (si están configurados):

```powershell
npm run lint
npm run format
```

---

## Contacto

- Responsable: `Davidl2002`
- Email de soporte: `dl735894@gmail.com`

---

# MoviPass Backend - Sistema de Venta de Tickets de Buses Interprovinciales

Backend completo desarrollado con Node.js, Express y TypeScript para un sistema SaaS de venta de tickets de buses interprovinciales.

## 🚀 Características

### 1. Módulo de Autenticación y Seguridad
- ✅ Registro y login con JWT
- ✅ Sistema de roles: SuperAdmin, Admin, Oficinista, Chofer, Cliente
- ✅ Verificación de email con Gmail
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
- ✅ Generación de PDF con QR
- ✅ Envío automático de tickets por email

### 5. Módulo de Operaciones
- ✅ Validación de tickets por QR
- ✅ Manifiesto de pasajeros
- ✅ Registro de gastos operativos
- ✅ Reportes de ganancias (ingresos - gastos)


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

## 👨‍💻 Autor

Desarrollado por David Lopez para el curso de Desarrollo Asistido por Software

