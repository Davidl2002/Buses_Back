import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth.middleware';


// SUPER ADMIN - MÉTRICAS GLOBALES


export const getGlobalMetrics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Solo SUPER_ADMIN puede ver métricas globales
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new AppError('No tienes permisos para ver métricas globales', 403);
    }

    const { startDate, endDate } = req.query;

    // Filtro de fechas
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // 1. Cooperativas activas
    const cooperativasActivas = await prisma.cooperativa.count({
      where: { isActive: true }
    });

    const cooperativasTotal = await prisma.cooperativa.count();

    // 2. Total de boletos vendidos en toda la plataforma
    const ticketsVendidos = await prisma.ticket.count({
      where: {
        status: { in: ['PAID', 'USED'] },
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter
        })
      }
    });

    // 3. Ingresos totales (sin detalles por cooperativa)
    const ingresosResult = await prisma.ticket.aggregate({
      where: {
        status: { in: ['PAID', 'USED'] },
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter
        })
      },
      _sum: {
        totalPrice: true
      }
    });

    // 4. Viajes completados en toda la plataforma
    const viajesCompletados = await prisma.trip.count({
      where: {
        status: 'COMPLETED',
        ...(Object.keys(dateFilter).length > 0 && {
          date: dateFilter
        })
      }
    });

    // 5. Total de buses en la plataforma
    const busesActivos = await prisma.bus.count({
      where: { status: 'ACTIVE' }
    });

    // 6. Total de usuarios por rol
    const usuariosPorRol = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      },
      where: {
        status: 'ACTIVE'
      }
    });

    // 7. Cooperativas con más actividad
    const cooperativasTopVentas = await prisma.cooperativa.findMany({
      take: 10,
      where: { isActive: true },
      select: {
        id: true,
        nombre: true,
        _count: {
          select: {
            buses: true,
            routes: true,
            users: true
          }
        }
      },
      orderBy: {
        buses: {
          _count: 'desc'
        }
      }
    });

    res.json({
      success: true,
      data: {
        cooperativas: {
          activas: cooperativasActivas,
          total: cooperativasTotal,
          inactivas: cooperativasTotal - cooperativasActivas
        },
        ventas: {
          ticketsVendidos,
          ingresosTotal: ingresosResult._sum.totalPrice || 0
        },
        operaciones: {
          viajesCompletados,
          busesActivos
        },
        usuarios: usuariosPorRol.map(u => ({
          rol: u.role,
          total: u._count.id
        })),
        topCooperativas: cooperativasTopVentas
      }
    });
  } catch (error) {
    next(error);
  }
};


// ADMIN - DASHBOARD DE COOPERATIVA


export const getCooperativaMetrics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    // Admin debe estar asociado a una cooperativa
    if (!req.user?.cooperativaId) {
      throw new AppError('Debes estar asociado a una cooperativa', 400);
    }

    const cooperativaId = req.user.cooperativaId;

    // Filtro de fechas
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // 1. Información básica de la cooperativa
    const cooperativa = await prisma.cooperativa.findUnique({
      where: { id: cooperativaId },
      select: {
        id: true,
        nombre: true,
        ruc: true,
        email: true,
        phone: true,
        config: true
      }
    });

    // 2. Ventas y tickets
    const ticketsVendidos = await prisma.ticket.count({
      where: {
        trip: {
          frequency: {
            cooperativaId
          }
        },
        status: { in: ['PAID', 'USED'] },
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter
        })
      }
    });

    const ingresosResult = await prisma.ticket.aggregate({
      where: {
        trip: {
          frequency: {
            cooperativaId
          }
        },
        status: { in: ['PAID', 'USED'] },
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter
        })
      },
      _sum: {
        totalPrice: true
      }
    });

    // 3. Estadísticas de buses y viajes
    const busesActivos = await prisma.bus.count({
      where: {
        cooperativaId,
        status: 'ACTIVE'
      }
    });

    const busesMantenimiento = await prisma.bus.count({
      where: {
        cooperativaId,
        status: 'MAINTENANCE'
      }
    });

    const viajesHoy = await prisma.trip.count({
      where: {
        frequency: {
          cooperativaId
        },
        date: new Date()
      }
    });

    const viajesCompletados = await prisma.trip.count({
      where: {
        frequency: {
          cooperativaId
        },
        status: 'COMPLETED',
        ...(Object.keys(dateFilter).length > 0 && {
          date: dateFilter
        })
      }
    });

    // 4. Personal
    const staff = await prisma.user.groupBy({
      by: ['role'],
      where: {
        cooperativaId,
        status: 'ACTIVE'
      },
      _count: {
        id: true
      }
    });

    // 5. Rutas activas
    const rutasActivas = await prisma.route.count({
      where: {
        cooperativaId,
        isActive: true
      }
    });

    res.json({
      success: true,
      data: {
        cooperativa,
        ventas: {
          ticketsVendidos,
          ingresosTotal: ingresosResult._sum.totalPrice || 0,
          promedioVentaDiaria: ticketsVendidos > 0 ? 
            (Number(ingresosResult._sum.totalPrice) / ticketsVendidos).toFixed(2) : 0
        },
        flota: {
          busesActivos,
          busesMantenimiento,
          totalBuses: busesActivos + busesMantenimiento
        },
        operaciones: {
          viajesHoy,
          viajesCompletados,
          rutasActivas
        },
        personal: staff.map(s => ({
          rol: s.role,
          total: s._count.id
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};


// ADMIN - REPORTES FINANCIEROS DETALLADOS


export const getFinancialReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, busId, routeId } = req.query;

    if (!req.user?.cooperativaId) {
      throw new AppError('Debes estar asociado a una cooperativa', 400);
    }

    const cooperativaId = req.user.cooperativaId;

    // Filtros
    const whereClause: any = {
      trip: {
        frequency: {
          cooperativaId
        }
      },
      status: { in: ['PAID', 'USED'] }
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
      if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
    }

    if (busId) {
      whereClause.trip.busId = busId as string;
    }

    if (routeId) {
      whereClause.trip.frequency.routeId = routeId as string;
    }

    // Obtener tickets con información completa
    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        trip: {
          include: {
            bus: {
              select: {
                id: true,
                placa: true,
                numeroInterno: true
              }
            },
            frequency: {
              include: {
                route: {
                  select: {
                    id: true,
                    name: true,
                    origin: true,
                    destination: true
                  }
                }
              }
            },
            expenses: {
              select: {
                type: true,
                amount: true,
                description: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Agrupar por viaje y calcular ganancias
    const viajesConBalance = tickets.reduce((acc: any[], ticket) => {
      const tripId = ticket.trip.id;
      let tripData = acc.find(t => t.tripId === tripId);

      if (!tripData) {
        const totalGastos = ticket.trip.expenses.reduce((sum, exp) => 
          sum + Number(exp.amount), 0);

        tripData = {
          tripId: ticket.trip.id,
          fecha: ticket.trip.date,
          bus: ticket.trip.bus,
          ruta: ticket.trip.frequency.route,
          ingresos: 0,
          gastos: totalGastos,
          ticketsVendidos: 0,
          gananciaNeta: 0
        };
        acc.push(tripData);
      }

      tripData.ingresos += Number(ticket.totalPrice);
      tripData.ticketsVendidos += 1;
      tripData.gananciaNeta = tripData.ingresos - tripData.gastos;

      return acc;
    }, []);

    // Resumen general
    const resumen = viajesConBalance.reduce((acc, viaje) => {
      acc.totalIngresos += viaje.ingresos;
      acc.totalGastos += viaje.gastos;
      acc.totalTickets += viaje.ticketsVendidos;
      return acc;
    }, {
      totalIngresos: 0,
      totalGastos: 0,
      gananciaNeta: 0,
      totalTickets: 0
    });

    resumen.gananciaNeta = resumen.totalIngresos - resumen.totalGastos;

    res.json({
      success: true,
      data: {
        resumen,
        viajes: viajesConBalance,
        totalViajes: viajesConBalance.length
      }
    });
  } catch (error) {
    next(error);
  }
};


// ADMIN - BALANCE POR BUS


export const getBalanceByBus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    if (!req.user?.cooperativaId) {
      throw new AppError('Debes estar asociado a una cooperativa', 400);
    }

    const cooperativaId = req.user.cooperativaId;

    // Obtener todos los buses de la cooperativa
    const buses = await prisma.bus.findMany({
      where: { cooperativaId },
      select: {
        id: true,
        placa: true,
        numeroInterno: true,
        marca: true,
        modelo: true
      }
    });

    // Para cada bus, calcular sus ingresos y gastos
    const balancePromises = buses.map(async (bus) => {
      const whereClause: any = {
        trip: {
          busId: bus.id,
          frequency: {
            cooperativaId
          }
        },
        status: { in: ['PAID', 'USED'] }
      };

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
        if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
      }

      const ingresosResult = await prisma.ticket.aggregate({
        where: whereClause,
        _sum: {
          totalPrice: true
        },
        _count: {
          id: true
        }
      });

      // Gastos del bus
      const gastosResult = await prisma.tripExpense.aggregate({
        where: {
          trip: {
            busId: bus.id,
            frequency: {
              cooperativaId
            },
            ...(startDate || endDate ? {
              date: {
                ...(startDate && { gte: new Date(startDate as string) }),
                ...(endDate && { lte: new Date(endDate as string) })
              }
            } : {})
          }
        },
        _sum: {
          amount: true
        }
      });

      const ingresos = Number(ingresosResult._sum.totalPrice) || 0;
      const gastos = Number(gastosResult._sum.amount) || 0;

      return {
        bus,
        ingresos,
        gastos,
        gananciaNeta: ingresos - gastos,
        ticketsVendidos: ingresosResult._count.id
      };
    });

    const balancePorBus = await Promise.all(balancePromises);

    // Ordenar por ganancias
    balancePorBus.sort((a, b) => b.gananciaNeta - a.gananciaNeta);

    res.json({
      success: true,
      data: balancePorBus
    });
  } catch (error) {
    next(error);
  }
};


// ADMIN - TICKETS PENDIENTES DE VERIFICACIÓN


export const getPendingPaymentVerifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.cooperativaId) {
      throw new AppError('Debes estar asociado a una cooperativa', 400);
    }

    const cooperativaId = req.user.cooperativaId;

    // Buscar tickets con transferencia bancaria pendiente de aprobación
    const pendingTickets = await prisma.ticket.findMany({
      where: {
        trip: {
          frequency: {
            cooperativaId
          }
        },
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'PENDING'
      },
      include: {
        trip: {
          include: {
            bus: {
              select: {
                placa: true,
                numeroInterno: true
              }
            },
            frequency: {
              include: {
                route: {
                  select: {
                    name: true,
                    origin: true,
                    destination: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json({
      success: true,
      data: pendingTickets,
      total: pendingTickets.length
    });
  } catch (error) {
    next(error);
  }
};


// ADMIN - APROBAR/RECHAZAR PAGO


export const updatePaymentStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ticketId } = req.params;
    const { action, reason } = req.body; // action: 'approve' | 'reject'

    if (!req.user?.cooperativaId) {
      throw new AppError('Debes estar asociado a una cooperativa', 400);
    }

    const cooperativaId = req.user.cooperativaId;

    // Verificar que el ticket pertenece a la cooperativa
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        trip: {
          frequency: {
            cooperativaId
          }
        }
      }
    });

    if (!ticket) {
      throw new AppError('Ticket no encontrado', 404);
    }

    if (ticket.paymentStatus !== 'PENDING') {
      throw new AppError('Este ticket ya fue procesado', 400);
    }

    const updateData: any = {};

    if (action === 'approve') {
      updateData.paymentStatus = 'APPROVED';
      updateData.status = 'PAID';
    } else if (action === 'reject') {
      updateData.paymentStatus = 'REJECTED';
      updateData.status = 'CANCELLED';
    } else {
      throw new AppError('Acción inválida', 400);
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData
    });

    // TODO: Enviar notificación al usuario

    res.json({
      success: true,
      data: updatedTicket,
      message: action === 'approve' ? 'Pago aprobado' : 'Pago rechazado'
    });
  } catch (error) {
    next(error);
  }
};
