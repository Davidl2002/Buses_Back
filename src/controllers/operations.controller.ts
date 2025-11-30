import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth.middleware';

// Validar QR y marcar ticket como usado
export const validateQR = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrCode, tripId } = req.body;

    if (!qrCode) {
      throw new AppError('Código QR requerido', 400);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { qrCode },
      include: {
        trip: {
          include: {
            frequency: {
              include: {
                route: true,
                cooperativa: true
              }
            },
            bus: true
          }
        }
      }
    });

    if (!ticket) {
      throw new AppError('Ticket inválido', 404);
    }

    // Verificar que el ticket corresponda al viaje correcto
    if (tripId && ticket.tripId !== tripId) {
      throw new AppError('Este ticket no corresponde a este viaje', 400);
    }

    // Verificar que el ticket esté pagado
    if (ticket.status !== 'PAID') {
      throw new AppError(`Ticket no válido. Estado: ${ticket.status}`, 400);
    }

    // Verificar que no haya sido usado
    if (ticket.isUsed) {
      throw new AppError('Este ticket ya fue utilizado', 400);
    }

    // Verificar fecha del viaje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tripDate = new Date(ticket.trip.date);
    tripDate.setHours(0, 0, 0, 0);

    if (tripDate.getTime() !== today.getTime()) {
      throw new AppError('Este ticket no es para hoy', 400);
    }

    // Marcar como usado
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'USED',
        isUsed: true,
        usedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Ticket validado correctamente',
      data: {
        passenger: ticket.passengerName,
        cedula: ticket.passengerCedula,
        seatNumber: ticket.seatNumber,
        boardingStop: ticket.boardingStop,
        dropoffStop: ticket.dropoffStop,
        trip: {
          route: `${ticket.trip.frequency.route.origin} - ${ticket.trip.frequency.route.destination}`,
          bus: ticket.trip.bus.placa,
          departureTime: ticket.trip.departureTime
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener manifiesto de pasajeros
export const getPassengerManifest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tripId } = req.params;
    const { stop } = req.query;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
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
              in: ['PAID', 'USED']
            },
            ...(stop && { boardingStop: stop as string })
          },
          orderBy: {
            seatNumber: 'asc'
          }
        }
      }
    });

    if (!trip) {
      throw new AppError('Viaje no encontrado', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== trip.frequency.cooperativaId) {
      throw new AppError('No tienes acceso a este viaje', 403);
    }

    const manifest = {
      trip: {
        id: trip.id,
        route: `${trip.frequency.route.origin} - ${trip.frequency.route.destination}`,
        date: trip.date,
        departureTime: trip.departureTime,
        bus: `${trip.bus.marca} ${trip.bus.modelo} - ${trip.bus.placa}`,
        cooperativa: trip.frequency.cooperativa.nombre
      },
      passengers: trip.tickets.map(ticket => ({
        seatNumber: ticket.seatNumber,
        name: ticket.passengerName,
        cedula: ticket.passengerCedula,
        phone: ticket.passengerPhone,
        boardingStop: ticket.boardingStop,
        dropoffStop: ticket.dropoffStop,
        status: ticket.status,
        isUsed: ticket.isUsed
      })),
      summary: {
        totalTickets: trip.tickets.length,
        totalUsed: trip.tickets.filter(t => t.isUsed).length,
        totalPending: trip.tickets.filter(t => !t.isUsed).length
      }
    };

    res.json({
      success: true,
      data: manifest
    });
  } catch (error) {
    next(error);
  }
};

// Registrar gasto del viaje
const expenseSchema = z.object({
  tripId: z.string().uuid(),
  type: z.enum(['FUEL', 'TOLL', 'MAINTENANCE', 'FOOD', 'OTHER']),
  description: z.string(),
  amount: z.number().positive()
});

export const createTripExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = expenseSchema.parse(req.body);
    const file = req.file;

    const trip = await prisma.trip.findUnique({
      where: { id: validatedData.tripId },
      include: {
        frequency: true
      }
    });

    if (!trip) {
      throw new AppError('Viaje no encontrado', 404);
    }

    // Validar acceso (debe ser el chofer asignado o admin)
    if (
      req.user?.role !== 'SUPER_ADMIN' &&
      req.user?.role !== 'ADMIN' &&
      trip.driverId !== req.user?.id
    ) {
      throw new AppError('No tienes permiso para registrar gastos en este viaje', 403);
    }

    const expense = await prisma.tripExpense.create({
      data: {
        ...validatedData,
        reportedById: req.user!.id,
        receipt: file ? `/uploads/receipts/${file.filename}` : null
      }
    });

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// Obtener gastos de un viaje
export const getTripExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        frequency: true
      }
    });

    if (!trip) {
      throw new AppError('Viaje no encontrado', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== trip.frequency.cooperativaId) {
      throw new AppError('No tienes acceso a este viaje', 403);
    }

    const expenses = await prisma.tripExpense.findMany({
      where: { tripId },
      include: {
        reportedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);

    res.json({
      success: true,
      data: {
        expenses,
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

// Reporte de ganancias por viaje
export const getTripProfitReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
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
              in: ['PAID', 'USED']
            }
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

    const totalIncome = trip.tickets.reduce((sum, ticket) => 
      sum + parseFloat(ticket.totalPrice.toString()), 0
    );

    const totalExpenses = trip.expenses.reduce((sum, expense) => 
      sum + parseFloat(expense.amount.toString()), 0
    );

    const profit = totalIncome - totalExpenses;

    const report = {
      trip: {
        id: trip.id,
        route: `${trip.frequency.route.origin} - ${trip.frequency.route.destination}`,
        date: trip.date,
        bus: trip.bus.placa,
        cooperativa: trip.frequency.cooperativa.nombre
      },
      income: {
        ticketsSold: trip.tickets.length,
        totalIncome: totalIncome.toFixed(2)
      },
      expenses: {
        items: trip.expenses.map(exp => ({
          type: exp.type,
          description: exp.description,
          amount: parseFloat(exp.amount.toString())
        })),
        totalExpenses: totalExpenses.toFixed(2)
      },
      profit: {
        amount: profit.toFixed(2),
        percentage: totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(2) : '0.00'
      }
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// Reporte de ganancias por cooperativa (rango de fechas)
export const getCooperativaProfitReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { cooperativaId, startDate, endDate } = req.query;

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== cooperativaId) {
      throw new AppError('No tienes acceso a esta cooperativa', 403);
    }

    const where: any = {
      frequency: {
        cooperativaId: cooperativaId as string
      }
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        tickets: {
          where: {
            status: {
              in: ['PAID', 'USED']
            }
          }
        },
        expenses: true
      }
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTickets = 0;

    trips.forEach(trip => {
      trip.tickets.forEach(ticket => {
        totalIncome += parseFloat(ticket.totalPrice.toString());
        totalTickets++;
      });

      trip.expenses.forEach(expense => {
        totalExpenses += parseFloat(expense.amount.toString());
      });
    });

    const profit = totalIncome - totalExpenses;

    res.json({
      success: true,
      data: {
        period: {
          start: startDate,
          end: endDate
        },
        summary: {
          totalTrips: trips.length,
          totalTickets,
          totalIncome: totalIncome.toFixed(2),
          totalExpenses: totalExpenses.toFixed(2),
          profit: profit.toFixed(2),
          profitMargin: totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(2) : '0.00'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
