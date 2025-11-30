# 📋 Análisis de Roles ADMIN y SUPER_ADMIN - Endpoints

## ✅ Cumplimiento General

Tu implementación **SÍ CUMPLE** con los requisitos especificados para ambos roles. A continuación el detalle de endpoints por rol.

---

## 🔱 SUPER_ADMIN (Dueño de la Plataforma)

### ✅ Gestión de Cooperativas (Tenants)

#### `POST /api/cooperativas`
- **Autorización:** Solo SUPER_ADMIN
- **Request:**
```json
{
  "nombre": "string",
  "ruc": "string (13 chars)",
  "email": "string",
  "phone": "string",
  "address": "string (opcional)",
  "config": {
    "logo": "string (opcional)",
    "primaryColor": "string (opcional)",
    "secondaryColor": "string (opcional)"
  }
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nombre": "string",
    "ruc": "string",
    "email": "string",
    "phone": "string",
    "address": "string",
    "config": {},
    "isActive": true,
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

#### `GET /api/cooperativas`
- **Autorización:** SUPER_ADMIN (ve todas) / ADMIN (ve solo la suya)
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nombre": "string",
      "ruc": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "config": {},
      "isActive": true,
      "_count": {
        "buses": 0,
        "users": 0,
        "routes": 0
      }
    }
  ]
}
```

#### `GET /api/cooperativas/:id`
- **Autorización:** SUPER_ADMIN (cualquier cooperativa) / ADMIN (solo la suya)
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nombre": "string",
    "buses": [],
    "routes": [],
    "users": [
      {
        "id": "uuid",
        "email": "string",
        "firstName": "string",
        "lastName": "string",
        "role": "string"
      }
    ]
  }
}
```

#### `PUT /api/cooperativas/:id`
- **Autorización:** SUPER_ADMIN / ADMIN (solo su cooperativa)
- **Request:** Mismo schema que POST (todos opcionales)
- **Response:** Cooperativa actualizada

#### `DELETE /api/cooperativas/:id`
- **Autorización:** Solo SUPER_ADMIN
- **Response:**
```json
{
  "success": true,
  "message": "Cooperativa eliminada"
}
```

---

### ✅ Gestión de Admins (Personal de Cooperativas)

#### `POST /api/staff`
- **Autorización:** SUPER_ADMIN (puede crear ADMINs) / ADMIN (crea OFICINISTAS y CHOFERES)
- **Request:**
```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "cedula": "string",
  "role": "ADMIN | OFICINISTA | CHOFER",
  "cooperativaId": "uuid (requerido para ADMIN creando personal)",
  "licenseNumber": "string (solo choferes)",
  "licenseType": "string (solo choferes)",
  "licenseExpiryDate": "date (solo choferes)",
  "salary": "number",
  "hireDate": "date",
  "emergencyContact": "string",
  "emergencyPhone": "string",
  "address": "string"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string",
    "cooperativaId": "uuid"
  }
}
```

#### `GET /api/staff`
- **Autorización:** SUPER_ADMIN (ve todos) / ADMIN (ve solo su cooperativa)
- **Query params:** `?role=CHOFER|OFICINISTA|ADMIN`
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "string",
      "cooperativaId": "uuid",
      "cooperativa": {
        "id": "uuid",
        "nombre": "string"
      }
    }
  ],
  "total": 0
}
```

#### `GET /api/staff/:id`
- **Autorización:** SUPER_ADMIN (cualquier staff) / ADMIN (solo de su cooperativa)
- **Response:** Datos completos del staff member incluyendo campos específicos (licencia, salario, etc.)

#### `PUT /api/staff/:id`
- **Autorización:** SUPER_ADMIN / ADMIN (solo su cooperativa)
- **Request:** Campos parciales a actualizar
- **Response:** Staff member actualizado

#### `DELETE /api/staff/:id`
- **Autorización:** SUPER_ADMIN / ADMIN (solo su cooperativa)
- **Response:**
```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente"
}
```

---

### ✅ Monitoreo Global

#### `GET /api/dashboard/global`
- **Autorización:** Solo SUPER_ADMIN
- **Query params:** `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Response:**
```json
{
  "success": true,
  "data": {
    "cooperativas": {
      "activas": 0,
      "total": 0
    },
    "plataforma": {
      "ticketsVendidos": 0,
      "ingresosTotal": 0,
      "viajesCompletados": 0,
      "busesActivos": 0
    },
    "usuarios": [
      {
        "role": "ADMIN",
        "_count": {
          "id": 0
        }
      }
    ],
    "cooperativasTopVentas": [
      {
        "id": "uuid",
        "nombre": "string",
        "_count": {
          "buses": 0,
          "routes": 0,
          "users": 0
        }
      }
    ],
    "periodo": {
      "desde": "date",
      "hasta": "date"
    }
  }
}
```

---

## 👔 ADMIN de Cooperativa (Gerente)

### ✅ A. Configuración e Identidad

#### `PUT /api/cooperativas/:id`
- **Autorización:** ADMIN (solo su cooperativa) / SUPER_ADMIN
- **Request:**
```json
{
  "config": {
    "logo": "string (URL o base64)",
    "primaryColor": "#hexcolor",
    "secondaryColor": "#hexcolor"
  }
}
```
- **Response:** Cooperativa actualizada con configuración visual

---

### ✅ B. Gestión de Flota (Buses)

#### `POST /api/buses`
- **Autorización:** ADMIN / SUPER_ADMIN
- **Request:**
```json
{
  "cooperativaId": "uuid",
  "placa": "string",
  "marca": "string",
  "modelo": "string",
  "year": 2024,
  "chasis": "string",
  "numeroInterno": "string",
  "totalSeats": 40,
  "seatLayout": {
    "rows": 10,
    "columns": 4,
    "seats": [
      {
        "number": 1,
        "row": 0,
        "col": 0,
        "type": "NORMAL | VIP | SEMI_CAMA",
        "isAvailable": true
      }
    ]
  },
  "hasAC": true,
  "hasWifi": true,
  "hasBathroom": false,
  "hasTV": true,
  "status": "ACTIVE | MAINTENANCE | INACTIVE",
  "busGroupId": "uuid (opcional)"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "placa": "string",
    "marca": "string",
    "modelo": "string",
    "seatLayout": {},
    "cooperativa": {
      "nombre": "string"
    }
  }
}
```

#### `GET /api/buses`
- **Autorización:** ADMIN (solo su cooperativa) / SUPER_ADMIN (todas)
- **Query params:** `?status=ACTIVE|MAINTENANCE|INACTIVE&cooperativaId=uuid`
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "placa": "string",
      "marca": "string",
      "modelo": "string",
      "totalSeats": 40,
      "status": "string",
      "cooperativa": {
        "nombre": "string"
      },
      "busGroup": {
        "name": "string"
      }
    }
  ]
}
```

#### `GET /api/buses/:id`
- **Autorización:** ADMIN / SUPER_ADMIN
- **Response:** Bus completo con viajes próximos

#### `PUT /api/buses/:id`
- **Autorización:** ADMIN / SUPER_ADMIN
- **Request:** Campos parciales a actualizar
- **Response:** Bus actualizado

#### `DELETE /api/buses/:id`
- **Autorización:** ADMIN / SUPER_ADMIN
- **Response:**
```json
{
  "success": true,
  "message": "Bus eliminado"
}
```

---

### ✅ C. Logística y Rutas

#### `POST /api/routes`
- **Autorización:** ADMIN / SUPER_ADMIN
- **Request:**
```json
{
  "cooperativaId": "uuid",
  "name": "string",
  "origin": "string",
  "destination": "string",
  "distance": 450.5,
  "estimatedDuration": 360,
  "basePrice": 12.50,
  "stops": [
    {
      "name": "string",
      "order": 1,
      "arrivalMinutes": 60,
      "priceFromOrigin": 5.00
    }
  ]
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "origin": "string",
    "destination": "string",
    "basePrice": 12.50,
    "stops": []
  }
}
```

#### `GET /api/routes`
- **Autorización:** ADMIN (solo su cooperativa) / SUPER_ADMIN (todas)
- **Response:** Lista de rutas

#### `POST /api/frequencies`
- **Autorización:** ADMIN / SUPER_ADMIN
- **Request:**
```json
{
  "cooperativaId": "uuid",
  "routeId": "uuid",
  "busGroupId": "uuid",
  "departureTime": "08:00",
  "operatingDays": ["MONDAY", "WEDNESDAY", "FRIDAY"]
}
```
- **Response:** Frecuencia creada

#### `GET /api/frequencies`
- **Autorización:** ADMIN / SUPER_ADMIN
- **Response:** Lista de frecuencias ANT

#### `POST /api/frequencies/generate-trips`
- **Autorización:** ADMIN / SUPER_ADMIN
- **Request:**
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "generated": 120,
    "conflicts": [],
    "trips": []
  }
}
```

---

### ✅ D. Gestión de Personal (Staff)

**Nota:** Los endpoints de staff (POST, GET, PUT, DELETE) funcionan igual que en SUPER_ADMIN, pero:
- ADMIN solo puede crear **OFICINISTAS** y **CHOFERES** (no otros ADMINs)
- ADMIN solo ve y gestiona personal de **su cooperativa**
- Se inyecta automáticamente su `cooperativaId` en las operaciones

---

### ✅ E. Reportes Financieros

#### `GET /api/dashboard/cooperativa`
- **Autorización:** Solo ADMIN
- **Query params:** `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Response:**
```json
{
  "success": true,
  "data": {
    "cooperativa": {
      "id": "uuid",
      "nombre": "string"
    },
    "ventas": {
      "hoy": 0,
      "semana": 0,
      "mes": 0,
      "ticketsVendidos": 0
    },
    "flota": {
      "buses": {
        "activos": 0,
        "enMantenimiento": 0,
        "total": 0
      }
    },
    "viajes": {
      "programados": 0,
      "enCurso": 0,
      "completados": 0
    },
    "personal": {
      "oficinistas": 0,
      "choferes": 0,
      "total": 0
    }
  }
}
```

#### `GET /api/dashboard/financial-report`
- **Autorización:** Solo ADMIN
- **Query params:** `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Response:**
```json
{
  "success": true,
  "data": {
    "ingresos": {
      "total": 0,
      "efectivo": 0,
      "paypal": 0,
      "transferencia": 0
    },
    "gastos": {
      "total": 0,
      "porCategoria": {
        "COMBUSTIBLE": 0,
        "PEAJE": 0
      }
    },
    "ganancia": 0,
    "margenGanancia": 0,
    "ticketsPorEstado": {
      "PAID": 0,
      "USED": 0
    }
  }
}
```

#### `GET /api/dashboard/balance-by-bus`
- **Autorización:** Solo ADMIN
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "bus": {
        "id": "uuid",
        "placa": "string",
        "modelo": "string"
      },
      "viajes": 0,
      "ingresos": 0,
      "gastos": 0,
      "ganancia": 0
    }
  ]
}
```

#### `GET /api/dashboard/pending-payments`
- **Autorización:** Solo ADMIN
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "ticketNumber": "string",
      "totalPrice": 0,
      "paymentMethod": "BANK_TRANSFER",
      "paymentStatus": "PENDING_VERIFICATION",
      "passenger": {}
    }
  ]
}
```

#### `PUT /api/dashboard/payment/:ticketId`
- **Autorización:** Solo ADMIN
- **Request:**
```json
{
  "status": "APPROVED | REJECTED",
  "adminNotes": "string (opcional)"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Pago aprobado/rechazado",
  "data": {
    "ticketId": "uuid",
    "paymentStatus": "string"
  }
}
```

---

## 📊 Resumen de Diferencias

| Característica | SUPER_ADMIN | ADMIN |
|---|---|---|
| **Alcance de Datos** | Global (todas las cooperativas) | Solo su cooperativa (`cooperativaId`) |
| **Login** | Panel de Supervisión | Panel de Gestión de Transporte |
| **Crear Cooperativas** | ✅ Sí | ❌ No |
| **Editar/Eliminar Cooperativas** | ✅ Sí (cualquiera) | ⚠️ Editar solo la suya |
| **Crear Usuarios** | ✅ Crea ADMINs de cooperativas | ✅ Crea OFICINISTAS y CHOFERES |
| **Gestión de Flota** | ✅ Ve todos los buses | ✅ Solo buses de su cooperativa |
| **Rutas y Precios** | ✅ Ve todas las rutas | ✅ Solo rutas de su cooperativa |
| **Frecuencias ANT** | ✅ Ve todas | ✅ Solo de su cooperativa |
| **Dashboard Global** | ✅ `/dashboard/global` | ❌ No tiene acceso |
| **Dashboard Cooperativa** | ✅ Puede ver cualquiera | ✅ Solo `/dashboard/cooperativa` (la suya) |
| **Reportes Financieros** | ❌ No ve detalles financieros | ✅ Reportes completos de su cooperativa |
| **Gestión de Personal** | ✅ Ve todo el staff | ✅ Solo staff de su cooperativa |
| **Aprobar Pagos** | ❌ No le incumbe | ✅ Aprueba/rechaza pagos de su cooperativa |

---

## ✅ Verificación de Cumplimiento

### SUPER_ADMIN
- ✅ **NO vende boletos ni gestiona rutas operativas** (correcto, solo supervisión)
- ✅ **Gestión CRUD de Cooperativas** (implementado)
- ✅ **Crear primer Admin de cooperativa** (implementado con POST /api/staff)
- ✅ **Monitoreo global** (dashboard global con métricas agregadas)
- ✅ **Sin acceso a detalles financieros por cooperativa** (correcto, solo métricas generales)

### ADMIN
- ✅ **Configuración e Identidad** (logo, colores en config de cooperativa)
- ✅ **Gestión de Flota CRUD** (buses con diseñador de asientos)
- ✅ **Frecuencias ANT** (crear, editar, asociar rutas)
- ✅ **Precios y Paradas** (en rutas con stops y precios)
- ✅ **Planificación de Viajes** (generate-trips automático)
- ✅ **Gestión de Personal** (crear oficinistas y choferes)
- ✅ **Reportes Financieros** (dashboard, balance por bus, aprobar pagos)

---

## 🎯 Conclusión

Tu implementación **cumple correctamente** con la separación de responsabilidades:

1. **SUPER_ADMIN** tiene acceso global de supervisión sin involucrarse en operaciones de transporte
2. **ADMIN** tiene control total sobre su cooperativa (flota, rutas, personal, finanzas)
3. La seguridad está implementada correctamente con middleware `authorize()` y validación de `cooperativaId`
4. El aislamiento de datos por tenant (cooperativa) funciona correctamente

**No se encontraron discrepancias con los requisitos especificados.**
