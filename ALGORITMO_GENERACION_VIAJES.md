# Algoritmo de Generación Automática de Viajes

## Descripción General

El algoritmo genera viajes automáticamente basándose en frecuencias configuradas, rotando buses de un grupo y asignando choferes disponibles de forma inteligente.

---

## Entrada de Datos

```json
{
  "startDate": "2025-12-09",
  "endDate": "2025-12-15",
  "frequencyIds": ["freq-uuid-1", "freq-uuid-2"]
}
```

**Parámetros:**
- `startDate`: Fecha inicial del rango
- `endDate`: Fecha final del rango
- `frequencyIds` (opcional): IDs específicos de frecuencias. Si está vacío, toma todas las frecuencias activas de la cooperativa

---

## Flujo del Algoritmo

### 1. **Obtener Frecuencias**

```typescript
const where: any = { isActive: true };

if (frequencyIds && frequencyIds.length > 0) {
  where.id = { in: frequencyIds };
} else if (req.user?.role !== 'SUPER_ADMIN') {
  where.cooperativaId = req.user?.cooperativaId;
}

const frequencies = await prisma.frequency.findMany({
  where,
  include: {
    route: true,
    busGroup: {
      include: {
        buses: { where: { status: 'ACTIVE' } }
      }
    }
  }
});
```

**Filtros aplicados:**
- Solo frecuencias activas (`isActive: true`)
- Si es ADMIN: solo su cooperativa
- Si es SUPER_ADMIN: puede especificar frecuencias o todas
- Solo buses activos del grupo

---

### 2. **Configuración de Variables**

```typescript
const turnaroundMinutes = 30; // Tiempo de preparación del bus

const dayMap = {
  'SUNDAY': 0,
  'MONDAY': 1,
  'TUESDAY': 2,
  'WEDNESDAY': 3,
  'THURSDAY': 4,
  'FRIDAY': 5,
  'SATURDAY': 6
};

const assignedDriverMap: Record<string, Record<string, string>> = {};
// Estructura: { 'YYYY-MM-DD': { driverId: busId } }
```

**Variables clave:**
- `turnaroundMinutes`: Tiempo entre viajes para que el bus esté listo
- `dayMap`: Mapeo de días de la semana
- `assignedDriverMap`: Control de asignación de choferes por día

---

### 3. **Iteración por Frecuencia**

Para cada frecuencia obtenida:

```typescript
for (const frequency of frequencies) {
  // Validar que tenga buses
  if (!frequency.busGroup || frequency.busGroup.buses.length === 0) {
    continue;
  }

  // Obtener choferes de la cooperativa
  const drivers = await prisma.user.findMany({
    where: {
      role: 'CHOFER',
      cooperativaId: frequency.cooperativaId,
      status: 'ACTIVE'
    }
  });

  const buses = frequency.busGroup.buses;
  let busIndex = 0; // Índice para rotación
```

---

### 4. **Iteración por Fecha**

```typescript
for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
  const dayOfWeek = Object.keys(dayMap).find(key => dayMap[key] === date.getDay());
  
  // Verificar si el día aplica según operatingDays
  if (!dayOfWeek || !frequency.operatingDays.includes(dayOfWeek)) {
    continue; // Saltar este día
  }
```

**Validación:** Solo procesa días que están en `operatingDays` de la frecuencia.

---

### 5. **Validación de Límite de Buses del Grupo**

```typescript
const groupBusIds = buses.map(b => b.id);
const existingGroupTripsCount = await prisma.trip.count({
  where: {
    date: new Date(date),
    departureTime: frequency.departureTime,
    busId: { in: groupBusIds },
    status: { not: 'CANCELLED' }
  }
});

if (existingGroupTripsCount >= buses.length) {
  tripsSkipped.push({ 
    frequencyId: frequency.id, 
    date: new Date(date), 
    reason: 'Límite de buses del grupo alcanzado' 
  });
  continue;
}
```

**Lógica:** Si todos los buses del grupo ya tienen un viaje a esa hora, no se puede crear más.

---

### 6. **Selección Inteligente de Bus**

El algoritmo prioriza buses que:
1. Su último destino coincide con el origen de esta ruta (optimización logística)
2. Tienen tiempo suficiente de turnaround
3. No están ocupados en otro viaje

```typescript
let selectedBus = null;

for (let i = 0; i < buses.length; i++) {
  const candidate = buses[(busIndex + i) % buses.length];

  // Obtener viajes recientes del bus
  const recentTrips = await prisma.trip.findMany({
    where: {
      busId: candidate.id,
      date: { lte: departureDateTime }
    },
    orderBy: [
      { date: 'desc' },
      { departureTime: 'desc' }
    ],
    include: {
      frequency: { include: { route: true } }
    },
    take: 10
  });

  // Verificar si hay conflicto de horario
  const conflictTrip = recentTrips.find(rt => {
    const [rh, rm] = rt.departureTime.split(':').map(Number);
    const recentDep = new Date(rt.date);
    recentDep.setHours(rh, rm, 0, 0);
    
    const routeDuration = (rt.frequency?.route?.estimatedDuration || 0);
    const recentArr = new Date(recentDep.getTime() + routeDuration * 60_000 + turnaroundMinutes * 60_000);

    return departureDateTime.getTime() < recentArr.getTime();
  });

  if (!conflictTrip) {
    selectedBus = candidate;
    
    // Bonificación si el destino previo coincide con el origen actual
    const lastTrip = recentTrips[0];
    if (lastTrip?.frequency?.route?.destination === frequency.route.origin) {
      break; // Bus ideal encontrado
    }
  }
}
```

**Criterios de selección:**
1. No tiene conflictos de horario
2. Respeta turnaround time (30 min)
3. Preferencia si el bus ya está en la ciudad de origen

---

### 7. **Asignación Inteligente de Chofer**

```typescript
let assignedDriver = null;
const dateKey = date.toISOString().split('T')[0];

for (const driver of drivers) {
  // Verificar que no esté asignado a otro bus ese día
  if (assignedDriverMap[dateKey]?.[driver.id] && 
      assignedDriverMap[dateKey][driver.id] !== selectedBus.id) {
    continue; // Chofer ya conduce otro bus ese día
  }

  // Obtener viajes del chofer en esa fecha
  const driverTrips = await prisma.trip.findMany({
    where: {
      driverId: driver.id,
      date: tripDate,
      status: { not: 'CANCELLED' }
    },
    include: {
      frequency: { include: { route: true } }
    }
  });

  // Verificar solapamientos de horario
  let hasOverlap = false;
  for (const dt of driverTrips) {
    const [dh, dm] = dt.departureTime.split(':').map(Number);
    const existingDep = new Date(dt.date);
    existingDep.setHours(dh, dm, 0, 0);
    
    const existingDur = (dt.frequency?.route?.estimatedDuration || 0);
    const existingArr = new Date(existingDep.getTime() + existingDur * 60_000 + turnaroundMinutes * 60_000);

    if (departureDateTime.getTime() < existingArr.getTime() && 
        existingDep.getTime() < newArrival.getTime()) {
      hasOverlap = true;
      break;
    }
  }

  if (!hasOverlap) {
    assignedDriver = driver;
    break;
  }
}

// Registrar asignación
if (assignedDriver) {
  if (!assignedDriverMap[dateKey]) assignedDriverMap[dateKey] = {};
  assignedDriverMap[dateKey][assignedDriver.id] = selectedBus.id;
}
```

**Reglas de asignación:**
1. Un chofer solo puede conducir **un bus por día** (no puede cambiar de unidad)
2. Verificar que no tenga solapamiento de horarios
3. Respetar tiempo de viaje + turnaround

---

### 8. **Verificación de Duplicados**

```typescript
const exists = await prisma.trip.findFirst({
  where: {
    frequencyId: frequency.id,
    date: tripDate,
    busId: selectedBus.id
  }
});

if (exists) {
  tripsSkipped.push({ 
    frequencyId: frequency.id, 
    date: new Date(date), 
    reason: 'Viaje duplicado' 
  });
  continue;
}
```

**Validación:** No crear viajes duplicados (misma frecuencia + fecha + bus).

---

### 9. **Creación del Viaje**

```typescript
const trip = await prisma.trip.create({
  data: {
    frequencyId: frequency.id,
    busId: selectedBus.id,
    date: tripDate,
    departureTime: frequency.departureTime,
    status: 'SCHEDULED',
    driverId: assignedDriver?.id || null
  }
});

tripsCreated.push(trip);
busIndex = (busIndex + 1) % buses.length; // Rotar al siguiente bus
```

**Resultado:** Viaje creado y guardado en base de datos.

---

### 10. **Rotación de Buses**

```typescript
busIndex = (busIndex + 1) % buses.length;
```

Después de cada viaje creado, el índice avanza para usar el siguiente bus del grupo en la próxima iteración, garantizando distribución equitativa.

---

## Respuesta del Algoritmo

```json
{
  "success": true,
  "data": {
    "created": 15,
    "skipped": 2,
    "trips": [
      {
        "id": "trip-uuid-1",
        "date": "2025-12-09",
        "departureTime": "06:00",
        "busId": "bus-uuid-1",
        "driverId": "driver-uuid-1"
      }
    ],
    "skipped": [
      {
        "frequencyId": "freq-uuid-1",
        "date": "2025-12-10",
        "reason": "Límite de buses del grupo alcanzado"
      }
    ]
  }
}
```

---

## Optimizaciones del Algoritmo

1. **Reuso de buses:** Prioriza buses que ya están en la ciudad de origen
2. **Distribución equitativa:** Rotación circular de buses del grupo
3. **Evita conflictos:** Valida horarios de buses y choferes
4. **Un chofer = una unidad/día:** Previene cambios de bus en el mismo día
5. **Respeta turnaround:** 30 minutos entre viajes del mismo bus
6. **Saltos inteligentes:** Si un día no aplica por `operatingDays`, lo omite sin procesar

---

## Complejidad

- **Tiempo:** O(F × D × B × C) donde:
  - F = número de frecuencias
  - D = días en el rango
  - B = buses por grupo
  - C = choferes disponibles

- **Espacio:** O(D × C) para el mapa de asignaciones

---

## Casos Especiales

### Sin buses disponibles
```typescript
if (!frequency.busGroup || frequency.busGroup.buses.length === 0) {
  console.log(`Frecuencia ${frequency.id} no tiene buses asignados`);
  continue;
}
```

### Sin choferes disponibles
```typescript
if (assignedDriver === null) {
  // Se crea el viaje sin chofer asignado
  // El admin puede asignarlo manualmente después
}
```

### Límite de buses alcanzado
```typescript
if (existingGroupTripsCount >= buses.length) {
  tripsSkipped.push({ reason: 'Límite de buses del grupo alcanzado' });
  continue;
}
```

---

## Variables de Entorno

```env
FREQUENCY_TURNAROUND_MINUTES=30
```

Controla el tiempo mínimo entre viajes del mismo bus.
