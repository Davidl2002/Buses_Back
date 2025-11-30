# 👥 Roles del Sistema MoviPass - Flujos de Trabajo

## 1. 🔱 SUPER_ADMIN (Superadministrador)

**¿Quién es?** El dueño/administrador del sistema completo (tú o tu empresa)

**Acceso:** Todo el sistema, todas las cooperativas

**Funciones principales:**
- ✅ Crear y gestionar cooperativas
- ✅ Ver datos de todas las cooperativas
- ✅ Crear administradores para cada cooperativa
- ✅ Monitorear sistema completo
- ✅ Acceso a reportes globales

**Flujo típico:**
```
1. Login → Dashboard global
2. Ver lista de cooperativas registradas
3. Crear nueva cooperativa (nombre, RUC, contacto)
4. Asignar un ADMIN a esa cooperativa
5. Ver reportes consolidados de todas las cooperativas
```

**Pantallas en frontend:**
- Dashboard global con métricas de todas las cooperativas
- Gestión de cooperativas (CRUD completo)
- Gestión de administradores
- Reportes consolidados

---

## 2. 👔 ADMIN (Administrador de Cooperativa)

**¿Quién es?** El gerente/dueño de una cooperativa específica

**Acceso:** Solo datos de SU cooperativa

**Funciones principales:**
- ✅ Gestionar flota de buses (crear, editar, eliminar)
- ✅ Crear rutas y horarios (frecuencias)
- ✅ Generar viajes automáticamente
- ✅ Contratar personal (oficinistas, choferes)
- ✅ Ver reportes de ganancias de su cooperativa
- ✅ Configurar precios y promociones

**Flujo típico:**
```
1. Login → Dashboard de su cooperativa
2. Agregar buses con diseño de asientos personalizados
3. Crear rutas (ej: Quito-Guayaquil con paradas)
4. Configurar frecuencias (Lunes, Miércoles, Viernes a las 8:00 AM)
5. Generar viajes para todo el mes
6. Contratar choferes y oficinistas
7. Ver reportes de ventas y gastos
```

**Pantallas en frontend:**
- Dashboard con métricas de su cooperativa
- Gestión de buses (con diseñador de asientos)
- Gestión de rutas y frecuencias
- Generador de viajes (calendario)
- Gestión de personal
- Reportes financieros

---

## 3. 💼 OFICINISTA (Personal de Ventanilla)

**¿Quién es?** Empleado que vende tickets en la terminal

**Acceso:** Solo su cooperativa, funciones de venta

**Funciones principales:**
- ✅ Buscar viajes disponibles
- ✅ Vender tickets en efectivo (punto de venta)
- ✅ Ver mapa de asientos en tiempo real
- ✅ Imprimir tickets con QR
- ✅ Ver manifiesto de pasajeros
- ✅ Validar tickets (escanear QR)
- ✅ Cancelar/modificar tickets

**Flujo típico:**
```
1. Login → Punto de venta
2. Cliente llega: "Quiero ir a Guayaquil mañana"
3. Buscar viajes disponibles
4. Mostrar opciones (horarios, precios, buses)
5. Cliente elige: "El de las 8:00 AM"
6. Mostrar mapa de asientos
7. Cliente selecciona asiento #15
8. Registrar datos del pasajero
9. Cobrar en efectivo
10. Imprimir ticket con QR
11. Entregar ticket al cliente
```

**Pantallas en frontend:**
- Buscador de viajes simple
- Selector de asientos visual
- Formulario rápido de venta
- Impresión de tickets
- Lista de ventas del día
- Escáner QR (validación)

---

## 4. 🚗 CHOFER (Conductor)

**¿Quién es?** El que maneja el bus

**Acceso:** Solo viajes asignados a él

**Funciones principales:**
- ✅ Ver sus viajes programados
- ✅ Ver manifiesto de pasajeros (lista)
- ✅ Validar tickets al subir (escanear QR)
- ✅ Marcar viaje como "En progreso" o "Completado"
- ✅ Registrar gastos del viaje (combustible, peajes, comida)
- ✅ Subir comprobantes de gastos

**Flujo típico:**
```
1. Login → Mis viajes de hoy
2. Ver viaje asignado: "Quito-Guayaquil 8:00 AM - Bus #10"
3. Antes de salir: Ver manifiesto (25 pasajeros confirmados)
4. Al subir pasajeros: Escanear QR de cada ticket
   - ✅ Ticket válido → "Asiento 15 - Juan Pérez"
   - ❌ Ticket inválido → "Ya usado" o "Viaje incorrecto"
5. Durante el viaje: Registrar gastos
   - Gasolina: $45.00 (subir foto del recibo)
   - Peaje: $3.50
6. Al llegar: Marcar viaje como "Completado"
```

**Pantallas en frontend:**
- Lista de mis viajes (calendario)
- Detalle del viaje (hora, ruta, bus)
- Manifiesto de pasajeros
- Escáner QR (validación) - **MÓVIL FRIENDLY**
- Registro de gastos con foto
- Historial de viajes completados

---

## 5. 🎫 CLIENTE (Pasajero)

**¿Quién es?** Usuario final que compra tickets

**Acceso:** Sus propios datos y tickets

**Funciones principales:**
- ✅ Buscar viajes (PÚBLICO - sin login)
- ✅ Registrarse/Login
- ✅ Reservar asiento (bloqueado 5 minutos)
- ✅ Comprar ticket
- ✅ Pagar con PayPal o efectivo (en ventanilla)
- ✅ Ver sus tickets (historial)
- ✅ Descargar ticket con QR
- ✅ Cancelar ticket (según políticas)

**Flujo típico:**
```
1. Entrar a la web (sin login)
2. Buscar: Origen "Quito" → Destino "Guayaquil" → Fecha "28/Nov"
3. Ver resultados:
   - Trans Chimborazo - 8:00 AM - $8.50 - 15 asientos
   - Andinos Express - 10:00 AM - $9.00 - 20 asientos
4. Elegir viaje → Ver mapa de asientos
5. Seleccionar asiento #15 (se bloquea 5 minutos)
6. ¿Tienes cuenta? → NO → Registrarse rápido
7. Login
8. Confirmar datos del pasajero
9. Elegir método de pago:
   - PayPal → Pagar online → Ticket enviado al email
   - Efectivo → "Pagar en ventanilla" → Código de reserva
10. Ver "Mis Tickets"
11. Descargar PDF con QR
12. Al viajar: Mostrar QR al chofer
```

**Pantallas en frontend:**
- Home con buscador (PÚBLICO)
- Resultados de búsqueda
- Selector de asientos interactivo
- Registro/Login rápido
- Checkout (formulario + pago)
- Mis tickets (con QR descargable)
- Perfil de usuario

---

## 📊 Comparativa de Permisos

| Función | SUPER_ADMIN | ADMIN | OFICINISTA | CHOFER | CLIENTE |
|---------|-------------|-------|------------|--------|---------|
| Ver todas las cooperativas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestionar su cooperativa | ✅ | ✅ | ❌ | ❌ | ❌ |
| Crear buses/rutas | ✅ | ✅ | ❌ | ❌ | ❌ |
| Vender tickets | ✅ | ✅ | ✅ | ❌ | ❌ |
| Buscar viajes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comprar ticket (como cliente) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Validar QR | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver manifiesto | ✅ | ✅ | ✅ | ✅ | ❌ |
| Registrar gastos | ✅ | ✅ | ❌ | ✅ | ❌ |
| Ver reportes | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 🎯 Resumen de Interfaces

### Frontend necesitará 3 tipos de dashboards:

1. **Dashboard Público** → Para clientes (búsqueda, compra)
2. **Dashboard Administrativo** → Para SUPER_ADMIN y ADMIN (gestión completa)
3. **Dashboard Operativo** → Para OFICINISTA y CHOFER (venta y validación)

---

## 🔐 Implementación de Roles en el Backend

### Middleware de autorización:

```typescript
// Ya implementado en auth.middleware.ts
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role!)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para esta acción'
      });
    }
    next();
  };
};
```

### Ejemplos de uso en rutas:

```typescript
// Solo SUPER_ADMIN
router.post('/cooperativas', 
  authenticate, 
  authorize('SUPER_ADMIN'), 
  createCooperativa
);

// ADMIN o SUPER_ADMIN
router.post('/buses', 
  authenticate, 
  authorize('ADMIN', 'SUPER_ADMIN'), 
  createBus
);

// Personal operativo
router.post('/validate-qr', 
  authenticate, 
  authorize('CHOFER', 'OFICINISTA', 'ADMIN', 'SUPER_ADMIN'), 
  validateQR
);

// Cualquier usuario autenticado
router.get('/my-tickets', 
  authenticate, 
  getMyTickets
);

// Público (sin autenticación)
router.get('/trips/search', 
  searchTrips
);
```

---

## 💡 Tips para el Frontend

### Manejo de roles en React/Next.js:

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const user = getUserFromToken();
  
  const can = (action: string) => {
    const permissions = {
      'SUPER_ADMIN': ['*'], // Todos los permisos
      'ADMIN': ['manage_buses', 'manage_routes', 'view_reports'],
      'OFICINISTA': ['sell_tickets', 'validate_qr'],
      'CHOFER': ['view_trips', 'validate_qr', 'register_expenses'],
      'CLIENTE': ['buy_tickets', 'view_my_tickets']
    };
    
    return permissions[user.role]?.includes(action) || 
           permissions[user.role]?.includes('*');
  };
  
  return { user, can };
};

// Uso en componente
const { can } = useAuth();

{can('manage_buses') && (
  <Button onClick={createBus}>Crear Bus</Button>
)}
```

### Redirección según rol:

```typescript
// Después del login
switch(user.role) {
  case 'SUPER_ADMIN':
    router.push('/admin/cooperativas');
    break;
  case 'ADMIN':
    router.push('/dashboard/overview');
    break;
  case 'OFICINISTA':
    router.push('/pos/search'); // Point of Sale
    break;
  case 'CHOFER':
    router.push('/driver/my-trips');
    break;
  case 'CLIENTE':
    router.push('/my-tickets');
    break;
}
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

¡Usa este documento como referencia para diseñar tu frontend! 🚀
