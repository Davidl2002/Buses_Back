import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth.middleware';

const frequencySchema = z.object({
  cooperativaId: z.string().uuid(),
  routeId: z.string().uuid(),
  busGroupId: z.string().uuid().optional(),
  departureTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  operatingDays: z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])),
  antPermitNumber: z.string().optional()
});

// Crear frecuencia
export const createFrequency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = frequencySchema.parse(req.body);

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== validatedData.cooperativaId) {
      throw new AppError('No puedes crear frecuencias para otra cooperativa', 403);
    }

    // Si se asignó un busGroup, comprobar que no exista otra frecuencia activa
    // en el mismo busGroup con la misma hora y días que se solapen.
    if (validatedData.busGroupId) {
      const existing = await prisma.frequency.findMany({
        where: {
          busGroupId: validatedData.busGroupId,
          isActive: true
        }
      });

      const conflicts: Array<{ frequencyId: string; overlappingDays: string[] }> = [];
      for (const ex of existing) {
        // Si por algún motivo la frecuencia existente no tiene operatingDays, saltarla
        if (!ex.operatingDays || !ex.departureTime) continue;
        const overlap = ex.operatingDays.filter(d => validatedData.operatingDays.includes(d));
        if (overlap.length > 0 && ex.departureTime === validatedData.departureTime) {
          conflicts.push({ frequencyId: ex.id, overlappingDays: overlap });
        }
      }

      if (conflicts.length > 0) {
        const daysList = conflicts.flatMap(c => c.overlappingDays).filter((v, i, a) => a.indexOf(v) === i);
        throw new AppError(`No se puede crear la frecuencia: los días [${daysList.join(', ')}] y la hora ${validatedData.departureTime} ya están asignados a otra frecuencia en este grupo de buses.`, 400);
      }
    }

    const frequency = await prisma.frequency.create({
      data: validatedData,
      include: {
        route: true,
        busGroup: {
          include: {
            buses: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: frequency
    });
  } catch (error) {
    next(error);
  }
};

// Obtener frecuencias
export const getFrequencies = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { routeId } = req.query;
    
    const where: any = { isActive: true };

    if (req.user?.role !== 'SUPER_ADMIN') {
      where.cooperativaId = req.user?.cooperativaId;
    }

    if (routeId) {
      where.routeId = routeId;
    }

    const frequencies = await prisma.frequency.findMany({
      where,
      include: {
        route: true,
        busGroup: {
          include: {
            buses: true
          }
        },
        cooperativa: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        departureTime: 'asc'
      }
    });

    res.json({
      success: true,
      data: frequencies
    });
  } catch (error) {
    next(error);
  }
};

// Obtener frecuencia por ID
export const getFrequencyById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const frequency = await prisma.frequency.findUnique({
      where: { id },
      include: {
        route: true,
        busGroup: {
          include: {
            buses: true
          }
        },
        trips: {
          where: {
            date: {
              gte: new Date()
            }
          },
          take: 10,
          orderBy: {
            date: 'asc'
          }
        }
      }
    });

    if (!frequency) {
      throw new AppError('Frecuencia no encontrada', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== frequency.cooperativaId) {
      throw new AppError('No tienes acceso a esta frecuencia', 403);
    }

    res.json({
      success: true,
      data: frequency
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar frecuencia
export const updateFrequency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = frequencySchema.partial().parse(req.body);

    const existingFrequency = await prisma.frequency.findUnique({
      where: { id }
    });

    if (!existingFrequency) {
      throw new AppError('Frecuencia no encontrada', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== existingFrequency.cooperativaId) {
      throw new AppError('No tienes acceso a esta frecuencia', 403);
    }

    // Si se va a cambiar busGroupId / departureTime / operatingDays, comprobar colisiones
    const newBusGroupId = (validatedData as any).busGroupId ?? existingFrequency.busGroupId;
    const newDepartureTime = (validatedData as any).departureTime ?? existingFrequency.departureTime;
    const newOperatingDays = (validatedData as any).operatingDays ?? existingFrequency.operatingDays;

    if (newBusGroupId) {
      const others = await prisma.frequency.findMany({
        where: {
          busGroupId: newBusGroupId,
          isActive: true,
          id: { not: id }
        }
      });

      const conflicts: Array<{ frequencyId: string; overlappingDays: string[] }> = [];
      for (const ex of others) {
        if (!ex.operatingDays || !ex.departureTime) continue;
        const overlap = ex.operatingDays.filter((d: string) => newOperatingDays.includes(d));
        if (overlap.length > 0 && ex.departureTime === newDepartureTime) {
          conflicts.push({ frequencyId: ex.id, overlappingDays: overlap });
        }
      }

      if (conflicts.length > 0) {
        const daysList = conflicts.flatMap(c => c.overlappingDays).filter((v, i, a) => a.indexOf(v) === i);
        throw new AppError(`No se puede actualizar la frecuencia: los días [${daysList.join(', ')}] y la hora ${newDepartureTime} ya están asignados a otra frecuencia en este grupo de buses.`, 400);
      }
    }

    const frequency = await prisma.frequency.update({
      where: { id },
      data: validatedData
    });

    res.json({
      success: true,
      data: frequency
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar frecuencia
export const deleteFrequency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existingFrequency = await prisma.frequency.findUnique({
      where: { id }
    });

    if (!existingFrequency) {
      throw new AppError('Frecuencia no encontrada', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== existingFrequency.cooperativaId) {
      throw new AppError('No tienes acceso a esta frecuencia', 403);
    }

    await prisma.frequency.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Frecuencia desactivada'
    });
  } catch (error) {
    next(error);
  }
};

// Generar viajes para un rango de fechas
export const generateTrips = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, frequencyIds } = req.body;

    if (!startDate || !endDate) {
      throw new AppError('Se requieren fechas de inicio y fin', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Obtener frecuencias
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
            buses: {
              where: {
                status: 'ACTIVE'
              },
              orderBy: {
                numeroInterno: 'asc'
              }
            }
          }
        }
      }
    });

    const tripsCreated: any[] = [];
    const tripsSkipped: any[] = [];
    const dayMap: { [key: string]: number } = {
      'SUNDAY': 0,
      'MONDAY': 1,
      'TUESDAY': 2,
      'WEDNESDAY': 3,
      'THURSDAY': 4,
      'FRIDAY': 5,
      'SATURDAY': 6
    };

    // Turnaround configurado (minutos) para permitir que un bus sea reutilizado
    const turnaroundMinutes = process.env.FREQUENCY_TURNAROUND_MINUTES ? parseInt(process.env.FREQUENCY_TURNAROUND_MINUTES, 10) : 30;

    // Map para seguimiento de choferes asignados en esta ejecución: { 'YYYY-MM-DD': { driverId: busId } }
    const assignedDriverMap: Record<string, Record<string, string>> = {};

    for (const frequency of frequencies) {
      if (!frequency.busGroup || frequency.busGroup.buses.length === 0) {
        console.log(`Frecuencia ${frequency.id} no tiene buses asignados`);
        continue;
      }

      // Obtener choferes de la cooperativa (posibles candidatos)
      const drivers = await prisma.user.findMany({
        where: {
          role: 'CHOFER',
          cooperativaId: frequency.cooperativaId,
          status: 'ACTIVE'
        }
      });

      const buses = frequency.busGroup.buses;
      let busIndex = 0;

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = Object.keys(dayMap).find(key => dayMap[key] === date.getDay());
        if (!dayOfWeek || !frequency.operatingDays.includes(dayOfWeek as any)) {
          continue;
        }

        // Construir DateTime de salida requerido
        const [hh, mm] = frequency.departureTime.split(':').map(Number);
        const departureDateTime = new Date(date);
        departureDateTime.setHours(hh, mm, 0, 0);

        // Antes de elegir, verificar si el grupo ya tiene asignados tantos viajes como buses para esta fecha/hora
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
          // No hay buses libres en el grupo para esta fecha/hora
          tripsSkipped.push({ frequencyId: frequency.id, date: new Date(date), reason: 'Límite de buses del grupo alcanzado' });
          continue;
        }

        // Elegir bus preferente: aquel cuyo último destino == route.origin y que tenga tiempo suficiente (turnaround)
        let selectedBus = null as any;

        for (let i = 0; i < buses.length; i++) {
          const candidate = buses[(busIndex + i) % buses.length];

          // Obtener los últimos trips del bus (anteriores o iguales a la fecha/hora objetivo)
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
              frequency: {
                include: { route: true }
              }
            },
            take: 5
          });

          // Si nunca tuvo viajes, es candidato inmediato
          if (!recentTrips || recentTrips.length === 0) {
            selectedBus = candidate;
            busIndex = (busIndex + i + 1) % buses.length;
            break;
          }

          const turnaroundMs = turnaroundMinutes * 60_000;

          // Verificar si alguno de los viajes recientes causa solapamiento (arrival + turnaround > departureDateTime)
          let hasOverlap = false;
          for (const rt of recentTrips) {
            const lastRoute = rt.frequency?.route;
            if (!lastRoute) continue;

            const [lh, lm] = rt.departureTime.split(':').map(Number);
            const lastDeparture = new Date(rt.date);
            lastDeparture.setHours(lh, lm, 0, 0);

            const durationMinutes = (lastRoute.estimatedDuration as number) || 0;
            const lastArrival = new Date(lastDeparture.getTime() + durationMinutes * 60_000);

            if ((lastArrival.getTime() + turnaroundMs) > departureDateTime.getTime()) {
              hasOverlap = true;
              break;
            }
          }

          if (hasOverlap) {
            // Este bus no puede atender este slot por solapamiento
            continue;
          }

          // Si el último viaje termina en el origen requerido y hay tiempo suficiente, preferirlo
          const lastTrip = recentTrips[0];
          const lastRoute = lastTrip.frequency?.route;
          if (lastRoute && lastRoute.destination === frequency.route.origin) {
            const [lh, lm] = lastTrip.departureTime.split(':').map(Number);
            const lastDeparture = new Date(lastTrip.date);
            lastDeparture.setHours(lh, lm, 0, 0);
            const durationMinutes = (lastRoute.estimatedDuration as number) || 0;
            const lastArrival = new Date(lastDeparture.getTime() + durationMinutes * 60_000);

            if ((lastArrival.getTime() + turnaroundMs) <= departureDateTime.getTime()) {
              selectedBus = candidate;
              busIndex = (busIndex + i + 1) % buses.length;
              break;
            }
          }
        }

        // Si no encontramos ninguno que cumpla la condición, fallback round-robin (comportamiento previo)
        if (!selectedBus) {
          selectedBus = buses[busIndex % buses.length];
          busIndex = (busIndex + 1) % buses.length;
        }

        // Verificar si ya existe el viaje (evitar duplicados)
        const existingTrip = await prisma.trip.findFirst({
          where: {
            frequencyId: frequency.id,
            date: new Date(date),
            busId: selectedBus.id
          }
        });

        if (existingTrip) {
          console.log(`Viaje ya existe para fecha ${date.toISOString().split('T')[0]} y bus ${selectedBus.numeroInterno}`);
          continue;
        }

        // Intentar asignar un chofer disponible para este slot (evitar solapamientos)
        let assignedDriverId: string | undefined = undefined;
        if (drivers && drivers.length > 0) {
          const candidates: Array<{ id: string; load: number } > = [];

          const newDeparture = departureDateTime;
          const routeDuration = (frequency.route?.estimatedDuration as number) || 0;
          const newArrival = new Date(newDeparture.getTime() + routeDuration * 60_000 + turnaroundMinutes * 60_000);

          for (const drv of drivers) {
            // Obtener viajes del chofer en la misma fecha
            const driverTrips = await prisma.trip.findMany({
              where: {
                driverId: drv.id,
                date: new Date(date),
                status: { not: 'CANCELLED' }
              },
              include: {
                frequency: {
                  include: { route: true }
                }
              }
            });

            // Comprobar solapamientos con los viajes existentes del chofer
            let overlap = false;
            const dateKey = date.toISOString().split('T')[0];

            // Si en esta ejecución ya asignamos este chofer a otro bus distinto para la misma fecha, descartarlo
            if (assignedDriverMap[dateKey] && assignedDriverMap[dateKey][drv.id] && assignedDriverMap[dateKey][drv.id] !== selectedBus.id) {
              continue;
            }

            // Además, si en la base de datos el chofer ya tiene viajes en otra unidad distinta a la unidad que queremos asignarle, descartarlo
            const driverBusIds = Array.from(new Set(driverTrips.map(dt => dt.busId)));
            if (driverBusIds.length > 0) {
              // Si tiene viajes en más de una unidad o tiene viajes en una unidad distinta de la actual, evitar asignación a otra unidad
              if (driverBusIds.some(bid => bid !== selectedBus.id)) {
                continue;
              }
            }
            for (const dt of driverTrips) {
              const [eh, em] = dt.departureTime.split(':').map(Number);
              const existingDep = new Date(dt.date);
              existingDep.setHours(eh, em, 0, 0);
              const existingDuration = (dt.frequency?.route?.estimatedDuration as number) || 0;
              const existingArr = new Date(existingDep.getTime() + existingDuration * 60_000 + turnaroundMinutes * 60_000);

              // overlap if newDeparture < existingArr && existingDep < newArrival
              if (newDeparture.getTime() < existingArr.getTime() && existingDep.getTime() < newArrival.getTime()) {
                overlap = true;
                break;
              }
            }

            if (!overlap) {
              // carga = viajes en DB + asignaciones hechas en esta ejecución para la fecha
              const assignedCount = assignedDriverMap[dateKey] && assignedDriverMap[dateKey][drv.id] ? 1 : 0;
              candidates.push({ id: drv.id, load: driverTrips.length + assignedCount });
            }
          }

          // Elegir candidato con menor carga (balanceo simple)
          if (candidates.length > 0) {
            candidates.sort((a, b) => a.load - b.load);
            assignedDriverId = candidates[0].id;
          }
        }

        // Crear viaje (incluyendo driver si se encontró)
        const trip = await prisma.trip.create({
          data: {
            frequencyId: frequency.id,
            busId: selectedBus.id,
            date: new Date(date),
            departureTime: frequency.departureTime,
            status: 'SCHEDULED',
            ...(assignedDriverId ? { driverId: assignedDriverId } : {})
          }
        });

        tripsCreated.push(trip);
        // Registrar asignación en el mapa para evitar asignar el mismo chofer a otra unidad el mismo día
        if (assignedDriverId) {
          const dateKey = new Date(date).toISOString().split('T')[0];
          assignedDriverMap[dateKey] = assignedDriverMap[dateKey] || {};
          assignedDriverMap[dateKey][assignedDriverId] = selectedBus.id;
        }
      }
    }

    res.json({
      success: true,
      message: `Se generaron ${tripsCreated.length} viajes. Se omitieron ${tripsSkipped.length} viajes por límites de grupo u otras razones.`,
      data: {
        created: tripsCreated,
        skipped: tripsSkipped
      }
    });
  } catch (error) {
    next(error);
  }
};
