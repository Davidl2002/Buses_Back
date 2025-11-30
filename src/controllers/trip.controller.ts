import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth.middleware';

// Obtener viajes (con filtros)
export const getTrips = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date, status, busId, routeId } = req.query;

    const where: any = {};

    // Filtro por fecha
    if (date) {
      where.date = new Date(date as string);
    }

    // Filtro por estado
    if (status) {
      where.status = status;
    }

    // Filtro por bus
    if (busId) {
      where.busId = busId;
    }

    // Filtro por cooperativa
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId) {
      where.frequency = {
        cooperativaId: req.user.cooperativaId
      };
    }

    // Filtro por ruta
    if (routeId) {
      where.frequency = {
        ...(where.frequency || {}),
        routeId: routeId
      };
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        frequency: {
          include: {
            route: true
          }
        },
        bus: {
          select: {
            placa: true,
            marca: true,
            modelo: true,
            numeroInterno: true,
            totalSeats: true,
            hasAC: true,
            hasWifi: true,
            hasBathroom: true,
            hasTV: true
          }
        },
        _count: {
          select: {
            tickets: {
              where: {
                status: {
                  in: ['PAID', 'RESERVED']
                }
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { departureTime: 'asc' }
      ]
    });

    // Transformar los datos para incluir información de ruta directamente en el trip
    const transformedTrips = trips.map(trip => ({
      ...trip,
      route: trip.frequency?.route || null,
      origin: trip.frequency?.route?.origin || null,
      destination: trip.frequency?.route?.destination || null,
      basePrice: trip.frequency?.route?.basePrice || 0,
      cooperativaId: trip.frequency?.cooperativaId || null
    }));

    res.json({
      success: true,
      data: transformedTrips
    });
  } catch (error) {
    next(error);
  }
};

// Obtener viaje por ID con información completa
export const getTripById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        frequency: {
          include: {
            route: true,
            cooperativa: true
          }
        },
        bus: true,
        tickets: {
          where: {
            status: {
              in: ['PAID', 'RESERVED', 'USED']
            }
          },
          select: {
            id: true,
            seatNumber: true,
            passengerName: true,
            status: true,
            boardingStop: true,
            dropoffStop: true
          }
        },
        expenses: true
      }
    });

    if (!trip) {
      throw new AppError('Viaje no encontrado', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== trip.frequency.cooperativaId) {
      throw new AppError('No tienes acceso a este viaje', 403);
    }

    // Transformar los datos para incluir información de ruta directamente en el trip
    const transformedTrip = {
      ...trip,
      route: trip.frequency?.route || null,
      origin: trip.frequency?.route?.origin || null,
      destination: trip.frequency?.route?.destination || null,
      basePrice: trip.frequency?.route?.basePrice || 0,
      cooperativaId: trip.frequency?.cooperativaId || null
    };

    res.json({
      success: true,
      data: transformedTrip
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar estado del viaje
export const updateTripStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      throw new AppError('Estado inválido', 400);
    }

    const existingTrip = await prisma.trip.findUnique({
      where: { id },
      include: {
        frequency: true
      }
    });

    if (!existingTrip) {
      throw new AppError('Viaje no encontrado', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== existingTrip.frequency.cooperativaId) {
      throw new AppError('No tienes acceso a este viaje', 403);
    }

    // Si se está cambiando a IN_PROGRESS, validar que el chofer no tenga otro viaje en curso
    if (status === 'IN_PROGRESS' && existingTrip.driverId) {
      const activeTrip = await prisma.trip.findFirst({
        where: {
          driverId: existingTrip.driverId,
          status: 'IN_PROGRESS',
          id: { not: id } // Excluir el viaje actual
        }
      });

      if (activeTrip) {
        throw new AppError('El chofer ya tiene un viaje en curso. Debe completar o cancelar el viaje activo antes de iniciar otro.', 400);
      }
    }

    const trip = await prisma.trip.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    next(error);
  }
};

// Asignar chofer y ayudante al viaje
export const assignPersonnel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { driverId, assistantId } = req.body;

    const existingTrip = await prisma.trip.findUnique({
      where: { id },
      include: {
        frequency: true
      }
    });

    if (!existingTrip) {
      throw new AppError('Viaje no encontrado', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== existingTrip.frequency.cooperativaId) {
      throw new AppError('No tienes acceso a este viaje', 403);
    }

    // Validar que el chofer tenga el rol correcto
    if (driverId) {
      const driver = await prisma.user.findUnique({
        where: { id: driverId }
      });

      if (!driver || driver.role !== 'CHOFER') {
        throw new AppError('El conductor debe tener rol de CHOFER', 400);
      }

      // Si el viaje está EN CURSO, validar que el chofer no tenga otro viaje activo
      if (existingTrip.status === 'IN_PROGRESS') {
        const activeTrip = await prisma.trip.findFirst({
          where: {
            driverId: driverId,
            status: 'IN_PROGRESS',
            id: { not: id }
          }
        });

        if (activeTrip) {
          throw new AppError('El chofer ya tiene un viaje en curso. No se puede asignar a múltiples viajes activos simultáneamente.', 400);
        }
      }
    }

    const trip = await prisma.trip.update({
      where: { id },
      data: {
        driverId,
        assistantId
      }
    });

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    next(error);
  }
};

// Buscar viajes disponibles (para clientes)
export const searchTrips = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      origin,
      destination,
      date,
      cooperativaId,
      hasAC,
      hasWifi,
      hasBathroom,
      isDirect
    } = req.query;

    if (!origin || !destination || !date) {
      throw new AppError('Se requiere origen, destino y fecha', 400);
    }

    const searchDate = new Date(date as string);
    
    // Buscar rutas que coincidan
    const routeWhere: any = {
      isActive: true,
      OR: [
        {
          origin: { contains: origin as string, mode: 'insensitive' },
          destination: { contains: destination as string, mode: 'insensitive' }
        }
      ]
    };

    // Si no es directo, buscar en paradas intermedias también
    if (isDirect !== 'true') {
      // Aquí podrías agregar lógica para buscar en stops JSON
    }

    if (cooperativaId) {
      routeWhere.cooperativaId = cooperativaId;
    }

    const routes = await prisma.route.findMany({
      where: routeWhere,
      select: { id: true }
    });

    if (routes.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const routeIds = routes.map(r => r.id);

    // Buscar viajes para esas rutas en la fecha especificada
    const tripWhere: any = {
      date: searchDate,
      status: 'SCHEDULED',
      frequency: {
        routeId: { in: routeIds },
        isActive: true
      }
    };

    // Filtros de bus
    const busFilters: any = {};
    if (hasAC === 'true') busFilters.hasAC = true;
    if (hasWifi === 'true') busFilters.hasWifi = true;
    if (hasBathroom === 'true') busFilters.hasBathroom = true;

    if (Object.keys(busFilters).length > 0) {
      tripWhere.bus = busFilters;
    }

    const trips = await prisma.trip.findMany({
      where: tripWhere,
      include: {
        frequency: {
          include: {
            route: true,
            cooperativa: {
              select: {
                id: true,
                nombre: true,
                config: true
              }
            }
          }
        },
        bus: {
          select: {
            id: true,
            placa: true,
            marca: true,
            modelo: true,
            totalSeats: true,
            seatLayout: true,
            hasAC: true,
            hasWifi: true,
            hasBathroom: true,
            hasTV: true
          }
        },
        _count: {
          select: {
            tickets: {
              where: {
                status: {
                  in: ['PAID', 'RESERVED']
                }
              }
            }
          }
        }
      },
      orderBy: {
        departureTime: 'asc'
      }
    });

    // Calcular asientos disponibles y transformar datos
    const tripsWithAvailability = trips.map(trip => ({
      ...trip,
      availableSeats: trip.bus.totalSeats - trip._count.tickets,
      route: trip.frequency?.route || null,
      origin: trip.frequency?.route?.origin || null,
      destination: trip.frequency?.route?.destination || null,
      basePrice: trip.frequency?.route?.basePrice || 0,
      cooperativaId: trip.frequency?.cooperativaId || null
    }));

    return res.json({
      success: true,
      data: tripsWithAvailability
    });
  } catch (error) {
    next(error);
  }
};

// Obtener ciudades de origen disponibles
export const getOriginCities = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const origins = await prisma.route.findMany({
      where: {
        isActive: true,
        frequencies: {
          some: {
            isActive: true,
            trips: {
              some: {
                status: 'SCHEDULED',
                date: {
                  gte: new Date() // Solo fechas futuras
                }
              }
            }
          }
        }
      },
      select: {
        origin: true
      },
      distinct: ['origin'],
      orderBy: {
        origin: 'asc'
      }
    });

    const cities = origins.map(route => route.origin);

    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    next(error);
  }
};

// Obtener ciudades de destino según origen seleccionado
export const getDestinationCities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { origin } = req.query;

    if (!origin) {
      throw new AppError('Se requiere ciudad de origen', 400);
    }

    const destinations = await prisma.route.findMany({
      where: {
        origin: origin as string,
        isActive: true,
        frequencies: {
          some: {
            isActive: true,
            trips: {
              some: {
                status: 'SCHEDULED',
                date: {
                  gte: new Date() // Solo fechas futuras
                }
              }
            }
          }
        }
      },
      select: {
        destination: true
      },
      distinct: ['destination'],
      orderBy: {
        destination: 'asc'
      }
    });

    const cities = destinations.map(route => route.destination);

    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    next(error);
  }
};

// Obtener fechas disponibles para una ruta específica
export const getAvailableDates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      throw new AppError('Se requiere origen y destino', 400);
    }

    // Obtener fechas de los próximos 30 días que tengan viajes disponibles
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const trips = await prisma.trip.findMany({
      where: {
        status: 'SCHEDULED',
        date: {
          gte: new Date(),
          lte: thirtyDaysFromNow
        },
        frequency: {
          isActive: true,
          route: {
            origin: origin as string,
            destination: destination as string,
            isActive: true
          }
        }
      },
      select: {
        date: true
      },
      distinct: ['date'],
      orderBy: {
        date: 'asc'
      }
    });

    const dates = trips.map(trip => trip.date.toISOString().split('T')[0]); // Formato YYYY-MM-DD

    res.json({
      success: true,
      data: dates
    });
  } catch (error) {
    next(error);
  }
};

// Obtener layout de asientos para un viaje específico
export const getTripSeats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bus: {
          select: {
            totalSeats: true,
            seatLayout: true
          }
        },
        tickets: {
          where: {
            status: {
              in: ['RESERVED', 'PAID', 'USED']
            }
          },
          select: {
            seatNumber: true,
            status: true,
            passengerName: true
          }
        }
      }
    });

    if (!trip) {
      throw new AppError('Viaje no encontrado', 404);
    }

    const seatLayout = trip.bus.seatLayout as any;
    const occupiedSeats = new Set(trip.tickets.map(ticket => ticket.seatNumber));

    // Marcar asientos como disponibles u ocupados
    const seatsWithStatus = seatLayout.seats.map((seat: any) => ({
      ...seat,
      isAvailable: !occupiedSeats.has(seat.number),
      status: occupiedSeats.has(seat.number) ? 'OCCUPIED' : 'AVAILABLE'
    }));

    res.json({
      success: true,
      data: {
        tripId,
        totalSeats: trip.bus.totalSeats,
        layout: {
          ...seatLayout,
          seats: seatsWithStatus
        },
        occupiedSeats: trip.tickets.map(ticket => ({
          seatNumber: ticket.seatNumber,
          status: ticket.status,
          passengerName: ticket.passengerName
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Crear viaje manualmente
export const createTrip = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { frequencyId, busId, date, departureTime, driverId, assistantId, status } = req.body;

    if (!frequencyId || !busId || !date || !departureTime) {
      throw new AppError('Se requieren frequencyId, busId, date y departureTime', 400);
    }

    // Normalizar fecha (solo fecha)
    const tripDate = new Date(date);
    tripDate.setHours(0, 0, 0, 0);

    // Obtener frecuencia y ruta
    const frequency = await prisma.frequency.findUnique({
      where: { id: frequencyId },
      include: { route: true, busGroup: { include: { buses: true } } }
    });

    if (!frequency) throw new AppError('Frecuencia no encontrada', 404);

    // Permisos por cooperativa
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== frequency.cooperativaId) {
      throw new AppError('No tienes permiso para crear viajes en esta frecuencia', 403);
    }

    // Verificar bus
    const bus = await prisma.bus.findUnique({ where: { id: busId } });
    if (!bus) throw new AppError('Bus no encontrado', 404);
    if (bus.status !== 'ACTIVE') throw new AppError('El bus no está activo', 400);
    if (bus.cooperativaId !== frequency.cooperativaId) throw new AppError('El bus no pertenece a la misma cooperativa', 400);

    // Verificar duplicados (mismo frequencyId, date, busId)
    const exists = await prisma.trip.findFirst({ where: { frequencyId, date: tripDate, busId } });
    if (exists) throw new AppError('Ya existe un viaje para esa frecuencia, fecha y bus', 400);

    // Si se envía driverId, validar disponibilidad y rol
    let assignedDriverId: string | undefined = undefined;
    const turnaroundMinutes = process.env.FREQUENCY_TURNAROUND_MINUTES ? parseInt(process.env.FREQUENCY_TURNAROUND_MINUTES, 10) : 30;

    if (driverId) {
      const driver = await prisma.user.findUnique({ where: { id: driverId } });
      if (!driver || driver.role !== 'CHOFER') throw new AppError('Driver inválido', 400);
      if (driver.cooperativaId !== frequency.cooperativaId) throw new AppError('Driver no pertenece a la misma cooperativa', 400);

      // Comprobar solapamientos en la fecha
      const [dh, dm] = departureTime.split(':').map(Number);
      const newDeparture = new Date(tripDate);
      newDeparture.setHours(dh, dm, 0, 0);
      const routeDuration = (frequency.route?.estimatedDuration as number) || 0;
      const newArrival = new Date(newDeparture.getTime() + routeDuration * 60_000 + turnaroundMinutes * 60_000);

      const driverTrips = await prisma.trip.findMany({
        where: { driverId, date: tripDate, status: { not: 'CANCELLED' } },
        include: { frequency: { include: { route: true } } }
      });

      for (const dt of driverTrips) {
        const [eh, em] = dt.departureTime.split(':').map(Number);
        const existingDep = new Date(dt.date);
        existingDep.setHours(eh, em, 0, 0);
        const existingDur = (dt.frequency?.route?.estimatedDuration as number) || 0;
        const existingArr = new Date(existingDep.getTime() + existingDur * 60_000 + turnaroundMinutes * 60_000);
        if (newDeparture.getTime() < existingArr.getTime() && existingDep.getTime() < newArrival.getTime()) {
          throw new AppError('El chofer tiene un viaje que solapa en esa fecha/hora', 400);
        }
        // además evitar que conductor ya tenga viajes en otra unidad distinta el mismo día
        if (dt.busId && dt.busId !== busId) {
          throw new AppError('El chofer ya está asignado a otra unidad ese día', 400);
        }
      }

      assignedDriverId = driverId;
    }

    // Crear viaje
    const trip = await prisma.trip.create({
      data: {
        frequencyId,
        busId,
        date: tripDate,
        departureTime,
        status: status || 'SCHEDULED',
        ...(assignedDriverId ? { driverId: assignedDriverId } : {}),
        ...(assistantId ? { assistantId } : {})
      }
    });

    return res.status(201).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

// Actualizar viaje (editar campos como bus, date, departureTime, driver, assistant, status)
export const updateTrip = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { busId, date, departureTime, driverId, assistantId, status } = req.body;

    const existing = await prisma.trip.findUnique({ where: { id }, include: { frequency: { include: { route: true } } } });
    if (!existing) throw new AppError('Viaje no encontrado', 404);

    // Permisos
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== existing.frequency.cooperativaId) {
      throw new AppError('No tienes permiso para editar este viaje', 403);
    }

    const updateData: any = {};
    const turnaroundMinutes = process.env.FREQUENCY_TURNAROUND_MINUTES ? parseInt(process.env.FREQUENCY_TURNAROUND_MINUTES, 10) : 30;

    // Si se cambia bus, validar existencia y cooperativa
    if (busId) {
      const bus = await prisma.bus.findUnique({ where: { id: busId } });
      if (!bus) throw new AppError('Bus no encontrado', 404);
      if (bus.status !== 'ACTIVE') throw new AppError('El bus no está activo', 400);
      if (bus.cooperativaId !== existing.frequency.cooperativaId) throw new AppError('El bus no pertenece a la misma cooperativa', 400);
      updateData.busId = busId;
    }

    // Fecha/hora
    let tripDate = existing.date;
    if (date) {
      tripDate = new Date(date);
      tripDate.setHours(0, 0, 0, 0);
      updateData.date = tripDate;
    }
    if (departureTime) updateData.departureTime = departureTime;

    // Verificar duplicado si cambian frequency/date/busId
    const newFrequencyId = existing.frequencyId;
    const newBusId = updateData.busId || existing.busId;
    const newDate = updateData.date || existing.date;
    const conflict = await prisma.trip.findFirst({ where: { frequencyId: newFrequencyId, date: newDate, busId: newBusId, id: { not: id } } });
    if (conflict) throw new AppError('Ya existe otro viaje con esa frecuencia, fecha y bus', 400);

    // Si se proporciona driverId, validar disponibilidad y reglas (no conducir 2 unidades distintas el mismo día)
    if (driverId) {
      const driver = await prisma.user.findUnique({ where: { id: driverId } });
      if (!driver || driver.role !== 'CHOFER') throw new AppError('Driver inválido', 400);
      if (driver.cooperativaId !== existing.frequency.cooperativaId) throw new AppError('Driver no pertenece a la misma cooperativa', 400);

      // comprobar solapamientos
      const [dh, dm] = (departureTime || existing.departureTime).split(':').map(Number);
      const newDeparture = new Date(newDate);
      newDeparture.setHours(dh, dm, 0, 0);
      const routeDuration = (existing.frequency?.route?.estimatedDuration as number) || 0;
      const newArrival = new Date(newDeparture.getTime() + routeDuration * 60_000 + turnaroundMinutes * 60_000);

      const driverTrips = await prisma.trip.findMany({ where: { driverId, date: newDate, status: { not: 'CANCELLED' }, id: { not: id } }, include: { frequency: { include: { route: true } } } });
      for (const dt of driverTrips) {
        const [eh, em] = dt.departureTime.split(':').map(Number);
        const existingDep = new Date(dt.date);
        existingDep.setHours(eh, em, 0, 0);
        const existingDur = (dt.frequency?.route?.estimatedDuration as number) || 0;
        const existingArr = new Date(existingDep.getTime() + existingDur * 60_000 + turnaroundMinutes * 60_000);
        if (newDeparture.getTime() < existingArr.getTime() && existingDep.getTime() < newArrival.getTime()) {
          throw new AppError('El chofer tiene un viaje que solapa en esa fecha/hora', 400);
        }
        if (dt.busId && dt.busId !== newBusId) {
          throw new AppError('El chofer ya está asignado a otra unidad ese día', 400);
        }
      }

      updateData.driverId = driverId;
    }

    if (assistantId) updateData.assistantId = assistantId;
    if (status) updateData.status = status;

    const updated = await prisma.trip.update({ where: { id }, data: updateData });
    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
// Obtener hoja de ruta por BusGroup y fecha
export const getRouteSheet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date, startDate, endDate, groupId } = req.query;

    if ((!date && !(startDate && endDate)) || !groupId) {
      // Lanzar error y retornar para evitar continuar la ejecución
      next(new AppError('Se requiere `groupId` y `date` ó `startDate` + `endDate`', 400));
      return;
    }

    const from = date ? new Date(date as string) : new Date(startDate as string);
    const to = date ? new Date(date as string) : new Date(endDate as string);

    // Normalizar horas para inclusión completa del día
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    // Obtener BusGroup con buses
    const group = await prisma.busGroup.findUnique({
      where: { id: groupId as string },
      include: { buses: true, cooperativa: true }
    });

    if (!group) {
      next(new AppError('BusGroup no encontrado', 404));
      return;
    }

    // Validar acceso por cooperativa
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== group.cooperativaId) {
      next(new AppError('No tienes acceso a este group', 403));
      return;
    }

    // Obtener todos los trips para las buses del grupo en el rango solicitado en UNA consulta
    const busIds = group.buses.map(b => b.id);
    if (busIds.length === 0) {
      res.json({ success: true, data: { groupId, groupName: group.name, dates: [] } });
      return;
    }

    const trips = await prisma.trip.findMany({
      where: {
        busId: { in: busIds },
        date: { gte: from, lte: to },
        status: { not: 'CANCELLED' }
      },
      include: {
        frequency: { include: { route: true } },
        tickets: { where: { status: { in: ['PAID', 'RESERVED'] } }, select: { id: true } }
      },
      orderBy: [
        { date: 'asc' },
        { departureTime: 'asc' }
      ]
    });

    // Reunir driverId/assistantId únicos y obtener sus nombres en una sola consulta
    const userIds = Array.from(new Set(trips.flatMap(t => [t.driverId, t.assistantId].filter(Boolean) as string[])));
    const usersMap: Record<string, { id: string; firstName: string; lastName: string }> = {};
    if (userIds.length > 0) {
      const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true } });
      for (const u of users) usersMap[u.id] = u;
    }

    // Agrupar por fecha (YYYY-MM-DD) y por bus
    const grouped: Record<string, Record<string, any[]>> = {};
    for (const t of trips) {
      const key = t.date.toISOString().split('T')[0];
      grouped[key] = grouped[key] || {};
      grouped[key][t.busId] = grouped[key][t.busId] || [];
      grouped[key][t.busId].push({
        id: t.id,
        departureTime: t.departureTime,
        status: t.status,
        route: t.frequency?.route || null,
        passengersCount: t.tickets.length,
        driver: t.driverId ? { id: t.driverId, name: `${usersMap[t.driverId]?.firstName || ''} ${usersMap[t.driverId]?.lastName || ''}`.trim() } : null,
        assistant: t.assistantId ? { id: t.assistantId, name: `${usersMap[t.assistantId]?.firstName || ''} ${usersMap[t.assistantId]?.lastName || ''}`.trim() } : null
      });
    }

    // Construir respuesta: array de fechas con buses y sus trips
    const datesResult: any[] = Object.keys(grouped).sort().map(dateKey => {
      const busesForDate = Object.keys(grouped[dateKey]).map(busId => {
        const bus = group.buses.find(b => b.id === busId) as any;
        return {
          bus: { id: bus.id, numeroInterno: bus.numeroInterno, placa: bus.placa },
          trips: grouped[dateKey][busId]
        };
      });
      return { date: dateKey, buses: busesForDate };
    });

    res.json({ success: true, data: { groupId, groupName: group.name, dates: datesResult } });
    return;
  } catch (error) {
    next(error);
    return;
  }
};
