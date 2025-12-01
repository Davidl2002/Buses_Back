import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  // Limpiar datos existentes (opcional)
  // await prisma.ticket.deleteMany();
  // await prisma.trip.deleteMany();
  // await prisma.frequency.deleteMany();
  // await prisma.route.deleteMany();
  // await prisma.bus.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.cooperativa.deleteMany();

  // Crear SuperAdmin
  console.log('Creando SuperAdmin...');
  await prisma.user.upsert({
    where: { email: 'superadmin@movipass.com' },
    update: {},
    create: {
      email: 'superadmin@movipass.com',
      password: await bcrypt.hash('Admin123!', 10),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      firstName: 'Super',
      lastName: 'Admin',
      cedula: '0000000000'
    }
  });

  // Crear Cooperativas
  console.log('Creando cooperativas...');
  const cooperativa1 = await prisma.cooperativa.upsert({
    where: { ruc: '1234567890001' },
    update: {},
    create: {
      nombre: 'Trans Chimborazo',
      ruc: '1234567890001',
      email: 'info@transchimborazo.com',
      phone: '032-456789',
      address: 'Av. Los Andes 123, Riobamba',
      config: {
        logo: '',
        primaryColor: '#1976d2',
        secondaryColor: '#dc004e'
      }
    }
  });

  await prisma.cooperativa.upsert({
    where: { ruc: '9876543210001' },
    update: {},
    create: {
      nombre: 'Transportes Andinos',
      ruc: '9876543210001',
      email: 'contacto@transportesandinos.com',
      phone: '032-987654',
      address: 'Calle Principal 456, Ambato',
      config: {
        logo: '',
        primaryColor: '#388e3c',
        secondaryColor: '#f57c00'
      }
    }
  });

  // Crear Ciudades (para combos en frontend)
  console.log('Creando ciudades...');
  const cities = [
    { name: 'Quito', state: 'Pichincha' },
    { name: 'Guayaquil', state: 'Guayas' },
    { name: 'Cuenca', state: 'Azuay' },
    { name: 'Ambato', state: 'Tungurahua' },
    { name: 'Riobamba', state: 'Chimborazo' },
    { name: 'Latacunga', state: 'Cotopaxi' },
    { name: 'Machachi', state: 'Pichincha' },
    { name: 'Manta', state: 'Manabí' },
    { name: 'Portoviejo', state: 'Manabí' },
    { name: 'Santo Domingo', state: 'Santo Domingo de los Tsáchilas' }
  ];

  for (const c of cities) {
    const exists = await prisma.city.findFirst({ where: { name: c.name, state: c.state } });
    if (!exists) {
      await prisma.city.create({ data: { name: c.name, state: c.state, country: 'Ecuador' } });
    }
  }

  // Crear Admin para Cooperativa 1
  console.log('Creando usuarios...');
  await prisma.user.upsert({
    where: { email: 'admin@transchimborazo.com' },
    update: {},
    create: {
      email: 'admin@transchimborazo.com',
      password: await bcrypt.hash('Admin123!', 10),
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      firstName: 'Carlos',
      lastName: 'Pérez',
      cedula: '1801234567',
      cooperativaId: cooperativa1.id
    }
  });

  // Crear Oficinista
  await prisma.user.upsert({
    where: { email: 'oficinista@transchimborazo.com' },
    update: {},
    create: {
      email: 'oficinista@transchimborazo.com',
      password: await bcrypt.hash('Oficina123!', 10),
      role: 'OFICINISTA',
      status: 'ACTIVE',
      emailVerified: true,
      firstName: 'María',
      lastName: 'González',
      cedula: '1807654321',
      phone: '0998765432',
      cooperativaId: cooperativa1.id
    }
  });

  // Crear Chofer
  const chofer1 = await prisma.user.upsert({
    where: { email: 'chofer@transchimborazo.com' },
    update: {},
    create: {
      email: 'chofer@transchimborazo.com',
      password: await bcrypt.hash('Chofer123!', 10),
      role: 'CHOFER',
      status: 'ACTIVE',
      emailVerified: true,
      firstName: 'Juan',
      lastName: 'Morales',
      cedula: '1805555555',
      phone: '0991234567',
      cooperativaId: cooperativa1.id
    }
  });

  // Crear Cliente
  await prisma.user.upsert({
    where: { email: 'cliente@test.com' },
    update: {},
    create: {
      email: 'cliente@test.com',
      password: await bcrypt.hash('Cliente123!', 10),
      role: 'CLIENTE',
      status: 'ACTIVE',
      emailVerified: true,
      firstName: 'Ana',
      lastName: 'Rodríguez',
      cedula: '1809876543',
      phone: '0987654321'
    }
  });

  // Crear Buses
  console.log('Creando buses...');
  const busGroup1 = await prisma.busGroup.create({
    data: {
      name: 'Flota Principal',
      description: 'Buses de primera línea',
      cooperativaId: cooperativa1.id
    }
  });

  // Crear Buses con variedad
  console.log('Creando buses...');
  const bus1 = await prisma.bus.create({
    data: {
      cooperativaId: cooperativa1.id,
      placa: 'PBA-1234',
      marca: 'Mercedes Benz',
      modelo: 'Sprinter',
      year: 2022,
      numeroInterno: '001',
      totalSeats: 40,
      seatLayout: {
        rows: 10,
        columns: 4,
        seats: Array.from({ length: 40 }, (_, i) => ({
          number: i + 1,
          row: Math.floor(i / 4),
          col: i % 4,
          type: i < 8 ? 'VIP' : 'NORMAL',
          isAvailable: true
        }))
      },
      hasAC: true,
      hasWifi: true,
      hasBathroom: true,
      hasTV: true,
      status: 'ACTIVE',
      busGroupId: busGroup1.id
    }
  });

  const bus2 = await prisma.bus.create({
    data: {
      cooperativaId: cooperativa1.id,
      placa: 'PBA-5678',
      marca: 'Volvo',
      modelo: 'B11R',
      year: 2023,
      numeroInterno: '002',
      totalSeats: 44,
      seatLayout: {
        rows: 11,
        columns: 4,
        seats: Array.from({ length: 44 }, (_, i) => ({
          number: i + 1,
          row: Math.floor(i / 4),
          col: i % 4,
          type: i < 12 ? 'VIP' : 'NORMAL',
          isAvailable: true
        }))
      },
      hasAC: true,
      hasWifi: true,
      hasBathroom: true,
      hasTV: false,
      status: 'ACTIVE',
      busGroupId: busGroup1.id
    }
  });

  const bus3 = await prisma.bus.create({
    data: {
      cooperativaId: cooperativa1.id,
      placa: 'PBA-9012',
      marca: 'Scania',
      modelo: 'K360',
      year: 2021,
      numeroInterno: '003',
      totalSeats: 36,
      seatLayout: {
        rows: 9,
        columns: 4,
        seats: Array.from({ length: 36 }, (_, i) => ({
          number: i + 1,
          row: Math.floor(i / 4),
          col: i % 4,
          type: 'VIP',
          isAvailable: true
        }))
      },
      hasAC: true,
      hasWifi: true,
      hasBathroom: true,
      hasTV: true,
      status: 'ACTIVE',
      busGroupId: busGroup1.id
    }
  });

  const bus4 = await prisma.bus.create({
    data: {
      cooperativaId: cooperativa1.id,
      placa: 'PBA-3456',
      marca: 'Hino',
      modelo: 'AK1JSLC',
      year: 2020,
      numeroInterno: '004',
      totalSeats: 48,
      seatLayout: {
        rows: 12,
        columns: 4,
        seats: Array.from({ length: 48 }, (_, i) => ({
          number: i + 1,
          row: Math.floor(i / 4),
          col: i % 4,
          type: 'NORMAL',
          isAvailable: true
        }))
      },
      hasAC: false,
      hasWifi: false,
      hasBathroom: false,
      hasTV: false,
      status: 'ACTIVE',
      busGroupId: busGroup1.id
    }
  });

  const bus5 = await prisma.bus.create({
    data: {
      cooperativaId: cooperativa1.id,
      placa: 'PBA-7890',
      marca: 'Mercedes Benz',
      modelo: 'OF-1721',
      year: 2023,
      numeroInterno: '005',
      totalSeats: 42,
      seatLayout: {
        rows: 11,
        columns: 4,
        seats: Array.from({ length: 42 }, (_, i) => ({
          number: i + 1,
          row: Math.floor(i / 4) + (i >= 40 ? 1 : 0),
          col: i % 4,
          type: i < 16 ? 'VIP' : 'NORMAL',
          isAvailable: true
        }))
      },
      hasAC: true,
      hasWifi: true,
      hasBathroom: true,
      hasTV: true,
      status: 'ACTIVE',
      busGroupId: busGroup1.id
    }
  });

  const bus6 = await prisma.bus.create({
    data: {
      cooperativaId: cooperativa1.id,
      placa: 'PBA-2468',
      marca: 'Volvo',
      modelo: 'B270F',
      year: 2022,
      numeroInterno: '006',
      totalSeats: 38,
      seatLayout: {
        rows: 10,
        columns: 4,
        seats: Array.from({ length: 38 }, (_, i) => ({
          number: i + 1,
          row: Math.floor(i / 4) + (i >= 36 ? 1 : 0),
          col: i % 4,
          type: i < 10 ? 'VIP' : 'NORMAL',
          isAvailable: true
        }))
      },
      hasAC: true,
      hasWifi: false,
      hasBathroom: true,
      hasTV: false,
      status: 'ACTIVE',
      busGroupId: busGroup1.id
    }
  });

  const bus7 = await prisma.bus.create({
    data: {
      cooperativaId: cooperativa1.id,
      placa: 'PBA-1357',
      marca: 'Chevrolet',
      modelo: 'NQR',
      year: 2019,
      numeroInterno: '007',
      totalSeats: 32,
      seatLayout: {
        rows: 8,
        columns: 4,
        seats: Array.from({ length: 32 }, (_, i) => ({
          number: i + 1,
          row: Math.floor(i / 4),
          col: i % 4,
          type: 'NORMAL',
          isAvailable: true
        }))
      },
      hasAC: false,
      hasWifi: false,
      hasBathroom: false,
      hasTV: false,
      status: 'ACTIVE',
      busGroupId: busGroup1.id
    }
  });

  const bus8 = await prisma.bus.create({
    data: {
      cooperativaId: cooperativa1.id,
      placa: 'PBA-8642',
      marca: 'Scania',
      modelo: 'K410',
      year: 2023,
      numeroInterno: '008',
      totalSeats: 40,
      seatLayout: {
        rows: 10,
        columns: 4,
        seats: Array.from({ length: 40 }, (_, i) => ({
          number: i + 1,
          row: Math.floor(i / 4),
          col: i % 4,
          type: i < 20 ? 'VIP' : 'NORMAL',
          isAvailable: true
        }))
      },
      hasAC: true,
      hasWifi: true,
      hasBathroom: true,
      hasTV: true,
      status: 'ACTIVE',
      busGroupId: busGroup1.id
    }
  });

  // Crear Rutas variadas
  console.log('Creando rutas...');
  const ruta1 = await prisma.route.create({
    data: {
      cooperativaId: cooperativa1.id,
      name: 'Riobamba - Quito',
      origin: 'Riobamba',
      destination: 'Quito',
      basePrice: 4.50,
      estimatedDuration: 180,
      distanceKm: 190,
      stops: [
        { name: 'Ambato', order: 1, priceFromOrigin: 1.50 },
        { name: 'Latacunga', order: 2, priceFromOrigin: 2.50 },
        { name: 'Machachi', order: 3, priceFromOrigin: 3.50 }
      ]
    }
  });

  const ruta2 = await prisma.route.create({
    data: {
      cooperativaId: cooperativa1.id,
      name: 'Ambato - Guayaquil',
      origin: 'Ambato',
      destination: 'Guayaquil',
      basePrice: 8.00,
      estimatedDuration: 300,
      distanceKm: 280,
      stops: [
        { name: 'Guaranda', order: 1, priceFromOrigin: 2.00 },
        { name: 'Babahoyo', order: 2, priceFromOrigin: 5.00 }
      ]
    }
  });

  const ruta3 = await prisma.route.create({
    data: {
      cooperativaId: cooperativa1.id,
      name: 'Quito - Cuenca',
      origin: 'Quito',
      destination: 'Cuenca',
      basePrice: 10.00,
      estimatedDuration: 480,
      distanceKm: 450,
      stops: [
        { name: 'Latacunga', order: 1, priceFromOrigin: 2.00 },
        { name: 'Ambato', order: 2, priceFromOrigin: 3.00 },
        { name: 'Riobamba', order: 3, priceFromOrigin: 4.50 },
        { name: 'Alausí', order: 4, priceFromOrigin: 6.00 },
        { name: 'Cañar', order: 5, priceFromOrigin: 8.00 },
        { name: 'Azogues', order: 6, priceFromOrigin: 9.00 }
      ]
    }
  });

  const ruta4 = await prisma.route.create({
    data: {
      cooperativaId: cooperativa1.id,
      name: 'Riobamba - Guayaquil',
      origin: 'Riobamba',
      destination: 'Guayaquil',
      basePrice: 7.50,
      estimatedDuration: 360,
      distanceKm: 320,
      stops: [
        { name: 'Pallatanga', order: 1, priceFromOrigin: 2.50 },
        { name: 'Bucay', order: 2, priceFromOrigin: 4.00 },
        { name: 'Milagro', order: 3, priceFromOrigin: 6.00 }
      ]
    }
  });

  const ruta5 = await prisma.route.create({
    data: {
      cooperativaId: cooperativa1.id,
      name: 'Quito - Esmeraldas',
      origin: 'Quito',
      destination: 'Esmeraldas',
      basePrice: 9.00,
      estimatedDuration: 420,
      distanceKm: 380,
      stops: [
        { name: 'Calacalí', order: 1, priceFromOrigin: 1.50 },
        { name: 'Nanegalito', order: 2, priceFromOrigin: 3.00 },
        { name: 'Pedro Vicente Maldonado', order: 3, priceFromOrigin: 5.00 },
        { name: 'La Concordia', order: 4, priceFromOrigin: 6.50 },
        { name: 'Quinindé', order: 5, priceFromOrigin: 7.50 }
      ]
    }
  });

  const ruta6 = await prisma.route.create({
    data: {
      cooperativaId: cooperativa1.id,
      name: 'Ambato - Puyo',
      origin: 'Ambato',
      destination: 'Puyo',
      basePrice: 5.00,
      estimatedDuration: 240,
      distanceKm: 160,
      stops: [
        { name: 'Pelileo', order: 1, priceFromOrigin: 0.50 },
        { name: 'Baños', order: 2, priceFromOrigin: 1.50 },
        { name: 'Río Verde', order: 3, priceFromOrigin: 2.50 },
        { name: 'Mera', order: 4, priceFromOrigin: 4.00 }
      ]
    }
  });

  const ruta7 = await prisma.route.create({
    data: {
      cooperativaId: cooperativa1.id,
      name: 'Riobamba - Baños',
      origin: 'Riobamba',
      destination: 'Baños',
      basePrice: 2.50,
      estimatedDuration: 90,
      distanceKm: 80,
      stops: [
        { name: 'Penipe', order: 1, priceFromOrigin: 1.00 }
      ]
    }
  });

  const ruta8 = await prisma.route.create({
    data: {
      cooperativaId: cooperativa1.id,
      name: 'Quito - Santo Domingo',
      origin: 'Quito',
      destination: 'Santo Domingo',
      basePrice: 3.50,
      estimatedDuration: 150,
      distanceKm: 130,
      stops: [
        { name: 'Calacalí', order: 1, priceFromOrigin: 1.00 },
        { name: 'Nanegalito', order: 2, priceFromOrigin: 2.00 }
      ]
    }
  });

  // Crear Frecuencias variadas
  console.log('Creando frecuencias...');
  const frecuencia1 = await prisma.frequency.create({
    data: {
      cooperativaId: cooperativa1.id,
      routeId: ruta1.id,
      busGroupId: busGroup1.id,
      departureTime: '08:00',
      operatingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      antPermitNumber: 'ANT-2024-001'
    }
  });

  const frecuencia2 = await prisma.frequency.create({
    data: {
      cooperativaId: cooperativa1.id,
      routeId: ruta1.id,
      busGroupId: busGroup1.id,
      departureTime: '14:30',
      operatingDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SUNDAY'],
      antPermitNumber: 'ANT-2024-002'
    }
  });

  const frecuencia3 = await prisma.frequency.create({
    data: {
      cooperativaId: cooperativa1.id,
      routeId: ruta2.id,
      busGroupId: busGroup1.id,
      departureTime: '10:00',
      operatingDays: ['TUESDAY', 'THURSDAY', 'SATURDAY'],
      antPermitNumber: 'ANT-2024-003'
    }
  });

  const frecuencia4 = await prisma.frequency.create({
    data: {
      cooperativaId: cooperativa1.id,
      routeId: ruta1.id,
      busGroupId: busGroup1.id,
      departureTime: '18:00',
      operatingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      antPermitNumber: 'ANT-2024-004'
    }
  });

  const frecuencia5 = await prisma.frequency.create({
    data: {
      cooperativaId: cooperativa1.id,
      routeId: ruta3.id,
      busGroupId: busGroup1.id,
      departureTime: '06:00',
      operatingDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
      antPermitNumber: 'ANT-2024-005'
    }
  });

  const frecuencia6 = await prisma.frequency.create({
    data: {
      cooperativaId: cooperativa1.id,
      routeId: ruta3.id,
      busGroupId: busGroup1.id,
      departureTime: '22:00',
      operatingDays: ['TUESDAY', 'THURSDAY', 'SATURDAY', 'SUNDAY'],
      antPermitNumber: 'ANT-2024-006'
    }
  });

  const frecuencia7 = await prisma.frequency.create({
    data: {
      cooperativaId: cooperativa1.id,
      routeId: ruta4.id,
      busGroupId: busGroup1.id,
      departureTime: '09:30',
      operatingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      antPermitNumber: 'ANT-2024-007'
    }
  });

  const frecuencia8 = await prisma.frequency.create({
    data: {
      cooperativaId: cooperativa1.id,
      routeId: ruta4.id,
      busGroupId: busGroup1.id,
      departureTime: '15:30',
      operatingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      antPermitNumber: 'ANT-2024-008'
    }
  });

  const frecuencia9 = await prisma.frequency.create({
    data: {
      cooperativaId: cooperativa1.id,
      routeId: ruta5.id,
      busGroupId: busGroup1.id,
      departureTime: '07:00',
      operatingDays: ['MONDAY', 'THURSDAY', 'SATURDAY'],
      antPermitNumber: 'ANT-2024-009'
    }
  });

  const frecuencia10 = await prisma.frequency.create({
    data: {
      cooperativaId: cooperativa1.id,
      routeId: ruta6.id,
      busGroupId: busGroup1.id,
      departureTime: '11:00',
      operatingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      antPermitNumber: 'ANT-2024-010'
    }
  });

  const frecuencia11 = await prisma.frequency.create({
    data: {
      cooperativaId: cooperativa1.id,
      routeId: ruta6.id,
      busGroupId: busGroup1.id,
      departureTime: '16:00',
      operatingDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SUNDAY'],
      antPermitNumber: 'ANT-2024-011'
    }
  });

  const frecuencia12 = await prisma.frequency.create({
    data: {
      cooperativaId: cooperativa1.id,
      routeId: ruta7.id,
      busGroupId: busGroup1.id,
      departureTime: '12:30',
      operatingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      antPermitNumber: 'ANT-2024-012'
    }
  });

  const frecuencia13 = await prisma.frequency.create({
    data: {
      cooperativaId: cooperativa1.id,
      routeId: ruta8.id,
      busGroupId: busGroup1.id,
      departureTime: '08:30',
      operatingDays: ['TUESDAY', 'THURSDAY', 'SATURDAY'],
      antPermitNumber: 'ANT-2024-013'
    }
  });

  const frecuencia14 = await prisma.frequency.create({
    data: {
      cooperativaId: cooperativa1.id,
      routeId: ruta8.id,
      busGroupId: busGroup1.id,
      departureTime: '17:30',
      operatingDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SUNDAY'],
      antPermitNumber: 'ANT-2024-014'
    }
  });

  // Crear viajes variados (pasados, presentes y futuros)
  console.log('Creando viajes de ejemplo...');
  
  // Obtener fecha actual
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const fourDaysLater = new Date(today);
  fourDaysLater.setDate(fourDaysLater.getDate() + 4);
  const fiveDaysLater = new Date(today);
  fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
  const sixDaysLater = new Date(today);
  sixDaysLater.setDate(sixDaysLater.getDate() + 6);
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  // Viajes completados (pasado)
  await prisma.trip.create({
    data: {
      frequencyId: frecuencia1.id,
      busId: bus1.id,
      date: threeDaysAgo,
      departureTime: '08:00',
      driverId: chofer1.id,
      status: 'COMPLETED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia3.id,
      busId: bus4.id,
      date: threeDaysAgo,
      departureTime: '10:00',
      driverId: chofer1.id,
      status: 'COMPLETED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia7.id,
      busId: bus2.id,
      date: twoDaysAgo,
      departureTime: '09:30',
      driverId: chofer1.id,
      status: 'COMPLETED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia5.id,
      busId: bus3.id,
      date: twoDaysAgo,
      departureTime: '06:00',
      driverId: chofer1.id,
      status: 'COMPLETED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia10.id,
      busId: bus5.id,
      date: yesterday,
      departureTime: '11:00',
      driverId: chofer1.id,
      status: 'COMPLETED'
    }
  });

  // Viaje en progreso (hoy)
  await prisma.trip.create({
    data: {
      frequencyId: frecuencia1.id,
      busId: bus1.id,
      date: today,
      departureTime: '08:00',
      driverId: chofer1.id,
      status: 'IN_PROGRESS'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia12.id,
      busId: bus7.id,
      date: today,
      departureTime: '12:30',
      driverId: chofer1.id,
      status: 'IN_PROGRESS'
    }
  });

  // Viajes programados (futuros)
  await prisma.trip.create({
    data: {
      frequencyId: frecuencia2.id,
      busId: bus2.id,
      date: today,
      departureTime: '14:30',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia4.id,
      busId: bus6.id,
      date: today,
      departureTime: '18:00',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia1.id,
      busId: bus1.id,
      date: tomorrow,
      departureTime: '08:00',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia8.id,
      busId: bus4.id,
      date: tomorrow,
      departureTime: '15:30',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia6.id,
      busId: bus3.id,
      date: tomorrow,
      departureTime: '22:00',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia9.id,
      busId: bus8.id,
      date: dayAfterTomorrow,
      departureTime: '07:00',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia3.id,
      busId: bus4.id,
      date: dayAfterTomorrow,
      departureTime: '10:00',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia11.id,
      busId: bus5.id,
      date: dayAfterTomorrow,
      departureTime: '16:00',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia7.id,
      busId: bus2.id,
      date: threeDaysLater,
      departureTime: '09:30',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia13.id,
      busId: bus6.id,
      date: threeDaysLater,
      departureTime: '08:30',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia5.id,
      busId: bus3.id,
      date: fourDaysLater,
      departureTime: '06:00',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia10.id,
      busId: bus5.id,
      date: fourDaysLater,
      departureTime: '11:00',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia14.id,
      busId: bus7.id,
      date: fourDaysLater,
      departureTime: '17:30',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia4.id,
      busId: bus1.id,
      date: fiveDaysLater,
      departureTime: '18:00',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia12.id,
      busId: bus7.id,
      date: fiveDaysLater,
      departureTime: '12:30',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia1.id,
      busId: bus1.id,
      date: sixDaysLater,
      departureTime: '08:00',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia2.id,
      busId: bus2.id,
      date: sixDaysLater,
      departureTime: '14:30',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia6.id,
      busId: bus3.id,
      date: sevenDaysLater,
      departureTime: '22:00',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  await prisma.trip.create({
    data: {
      frequencyId: frecuencia8.id,
      busId: bus4.id,
      date: sevenDaysLater,
      departureTime: '15:30',
      driverId: chofer1.id,
      status: 'SCHEDULED'
    }
  });

  console.log('Seed completado exitosamente!');
  console.log('\Credenciales de acceso:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SuperAdmin:');
  console.log('   Email: superadmin@movipass.com');
  console.log('   Pass:  Admin123!');
  console.log('');
  console.log('Admin (Trans Chimborazo):');
  console.log('   Email: admin@transchimborazo.com');
  console.log('   Pass:  Admin123!');
  console.log('');
  console.log('Oficinista:');
  console.log('   Email: oficinista@transchimborazo.com');
  console.log('   Pass:  Oficina123!');
  console.log('');
  console.log('Chofer:');
  console.log('   Email: chofer@transchimborazo.com');
  console.log('   Pass:  Chofer123!');
  console.log('');
  console.log('Cliente:');
  console.log('   Email: cliente@test.com');
  console.log('   Pass:  Cliente123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
