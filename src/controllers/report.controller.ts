import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth.middleware';

// Obtener reporte general
export const getReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, routeId, busId, reportType } = req.query;

    if (!startDate || !endDate) {
      throw new AppError('Fechas de inicio y fin son requeridas', 400);
    }

    // Determinar cooperativaId según el rol
    let cooperativaId: string | undefined;
    
    if (req.user?.role === 'ADMIN') {
      cooperativaId = req.user.cooperativaId;
    } else if (req.user?.role === 'SUPER_ADMIN' && req.query.cooperativaId) {
      cooperativaId = req.query.cooperativaId as string;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    // Construir filtros
    const ticketFilters: any = {
      createdAt: {
        gte: start,
        lte: end
      },
      status: {
        in: ['PAID', 'USED']
      }
    };

    if (cooperativaId) {
      ticketFilters.trip = {
        frequency: {
          cooperativaId
        }
      };
    }

    if (routeId) {
      ticketFilters.trip = {
        ...ticketFilters.trip,
        frequency: {
          ...ticketFilters.trip?.frequency,
          routeId: routeId as string
        }
      };
    }

    if (busId) {
      ticketFilters.trip = {
        ...ticketFilters.trip,
        busId: busId as string
      };
    }

    // Obtener tickets según filtros
    const tickets = await prisma.ticket.findMany({
      where: ticketFilters,
      include: {
        trip: {
          include: {
            frequency: {
              include: {
                route: {
                  select: {
                    origin: true,
                    destination: true
                  }
                },
                cooperativa: {
                  select: {
                    nombre: true
                  }
                }
              }
            },
            bus: {
              select: {
                placa: true,
                numeroInterno: true
              }
            }
          }
        }
      }
    });

    // Calcular estadísticas generales
    const totalRevenue = tickets.reduce((sum, ticket) => sum + Number(ticket.totalPrice), 0);
    const totalTickets = tickets.length;

    if (reportType === 'summary') {
      // Reporte resumen
      const summary = {
        totalRevenue,
        totalTickets,
        averageTicketPrice: totalTickets > 0 ? totalRevenue / totalTickets : 0,
        period: {
          start: startDate,
          end: endDate
        }
      };

      return res.json({
        success: true,
        data: summary
      });
    }

    if (reportType === 'by-route') {
      // Reporte por ruta
      const routeStats = tickets.reduce((acc: any, ticket) => {
        const routeKey = `${ticket.trip.frequency.route.origin}-${ticket.trip.frequency.route.destination}`;
        
        if (!acc[routeKey]) {
          acc[routeKey] = {
            route: routeKey,
            totalTickets: 0,
            totalRevenue: 0
          };
        }
        
        acc[routeKey].totalTickets++;
        acc[routeKey].totalRevenue += ticket.totalPrice;
        
        return acc;
      }, {});

      return res.json({
        success: true,
        data: {
          routes: Object.values(routeStats),
          total: {
            totalRevenue,
            totalTickets
          }
        }
      });
    }

    if (reportType === 'by-bus') {
      // Reporte por bus
      const busStats = tickets.reduce((acc: any, ticket) => {
        const busKey = ticket.trip.bus.placa;
        
        if (!acc[busKey]) {
          acc[busKey] = {
            placa: busKey,
            numeroInterno: ticket.trip.bus.numeroInterno,
            totalTickets: 0,
            totalRevenue: 0
          };
        }
        
        acc[busKey].totalTickets++;
        acc[busKey].totalRevenue += ticket.totalPrice;
        
        return acc;
      }, {});

      return res.json({
        success: true,
        data: {
          buses: Object.values(busStats),
          total: {
            totalRevenue,
            totalTickets
          }
        }
      });
    }

    if (reportType === 'detailed') {
      // Reporte detallado
      const detailedData = tickets.map(ticket => ({
        ticketId: ticket.id,
        date: ticket.createdAt,
        passengerName: ticket.passengerName,
        passengerCedula: ticket.passengerCedula,
        route: `${ticket.trip.frequency.route.origin} - ${ticket.trip.frequency.route.destination}`,
        bus: ticket.trip.bus.placa,
        seatNumber: ticket.seatNumber,
        price: ticket.totalPrice,
        paymentMethod: ticket.paymentMethod,
        status: ticket.status,
        cooperativa: ticket.trip.frequency.cooperativa.nombre
      }));

      return res.json({
        success: true,
        data: {
          tickets: detailedData,
          total: {
            totalRevenue,
            totalTickets
          }
        }
      });
    }

    // Por defecto, devolver resumen
    res.json({
      success: true,
      data: {
        totalRevenue,
        totalTickets,
        averageTicketPrice: totalTickets > 0 ? totalRevenue / totalTickets : 0
      }
    });

  } catch (error) {
    next(error);
  }
};

// Obtener reporte de ventas diarias
export const getDailySalesReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new AppError('Fechas de inicio y fin son requeridas', 400);
    }

    let cooperativaId: string | undefined;
    
    if (req.user?.role === 'ADMIN') {
      cooperativaId = req.user.cooperativaId;
    } else if (req.user?.role === 'SUPER_ADMIN' && req.query.cooperativaId) {
      cooperativaId = req.query.cooperativaId as string;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    const ticketFilters: any = {
      createdAt: {
        gte: start,
        lte: end
      },
      status: {
        in: ['PAID', 'USED']
      }
    };

    if (cooperativaId) {
      ticketFilters.trip = {
        frequency: {
          cooperativaId
        }
      };
    }

    const tickets = await prisma.ticket.findMany({
      where: ticketFilters,
      select: {
        createdAt: true,
        totalPrice: true
      }
    });

    // Agrupar por día
    const dailyStats = tickets.reduce((acc: any, ticket) => {
      const date = ticket.createdAt.toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          totalTickets: 0,
          totalRevenue: 0
        };
      }
      
      acc[date].totalTickets++;
      acc[date].totalRevenue += ticket.totalPrice;
      
      return acc;
    }, {});

    const sortedStats = Object.values(dailyStats).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.json({
      success: true,
      data: sortedStats
    });

  } catch (error) {
    next(error);
  }
};
