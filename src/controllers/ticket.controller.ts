import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth.middleware';
import { io } from '../index';
import { createPayment, executePayment } from '../services/paypal.service';
import { generateTicketPDF } from '../services/pdf.service';
import { sendTicketEmail } from '../services/email.service';
import crypto from 'crypto';

const ticketSchema = z.object({
  tripId: z.string().uuid(),
  passengerName: z.string().min(3),
  passengerCedula: z.string().min(10),
  passengerPhone: z.string().optional(),
  passengerEmail: z.string().email(),
  seatNumber: z.number().int().positive(),
  boardingStop: z.string(),
  dropoffStop: z.string(),
  paymentMethod: z.enum(['PAYPAL', 'CASH', 'BANK_TRANSFER']).optional()
});

// Reservar asiento (bloqueo temporal)
export const reserveSeat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tripId, seatNumber } = req.body;

    // Verificar que el asiento no esté ocupado
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        tripId,
        seatNumber,
        status: {
          in: ['RESERVED', 'PAID', 'USED']
        }
      }
    });

    if (existingTicket) {
      throw new AppError('Asiento no disponible', 400);
    }

    // Crear bloqueo temporal (5 minutos)
    const lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
    const sessionId = crypto.randomBytes(16).toString('hex');

    // Emitir evento de Socket.IO
    io.to(`trip-${tripId}`).emit('seat-locked', {
      tripId,
      seatNumber,
      lockedUntil
    });

    res.json({
      success: true,
      data: {
        sessionId,
        lockedUntil
      }
    });
  } catch (error) {
    next(error);
  }
};

// Crear ticket
export const createTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = ticketSchema.parse(req.body);

    // Obtener información del viaje
    const trip = await prisma.trip.findUnique({
      where: { id: validatedData.tripId },
      include: {
        frequency: {
          include: {
            route: true,
            cooperativa: true
          }
        },
        bus: true
      }
    });

    if (!trip) {
      throw new AppError('Viaje no encontrado', 404);
    }

    // Verificar disponibilidad del asiento
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        tripId: validatedData.tripId,
        seatNumber: validatedData.seatNumber,
        status: {
          in: ['RESERVED', 'PAID', 'USED']
        }
      }
    });

    if (existingTicket) {
      throw new AppError('Asiento no disponible', 400);
    }

    // Obtener información del asiento del layout
    const seatLayout = trip.bus.seatLayout as any;
    const seat = seatLayout.seats.find((s: any) => s.number === validatedData.seatNumber);

    if (!seat) {
      throw new AppError('Asiento inválido', 400);
    }

    // Calcular precio
    const basePrice = parseFloat(trip.frequency.route.basePrice.toString());
    let seatPremium = 0;

    if (seat.type === 'VIP') {
      seatPremium = basePrice * 0.3; // 30% extra para VIP
    } else if (seat.type === 'SEMI_CAMA') {
      seatPremium = basePrice * 0.5; // 50% extra para Semi-cama
    }

    const totalPrice = basePrice + seatPremium;

    // Generar código QR único
    const qrCode = crypto.randomBytes(32).toString('hex');

    // Crear ticket
    const ticket = await prisma.ticket.create({
      data: {
        ...validatedData,
        userId: req.user?.id,
        seatType: seat.type,
        basePrice,
        seatPremium,
        totalPrice,
        qrCode,
        status: validatedData.paymentMethod === 'CASH' ? 'PAID' : 'PENDING_PAYMENT',
        paymentStatus: validatedData.paymentMethod === 'CASH' ? 'APPROVED' : 'PENDING',
        paymentMethod: validatedData.paymentMethod
      }
    });

    // Emitir evento de Socket.IO
    io.to(`trip-${validatedData.tripId}`).emit('seat-sold', {
      tripId: validatedData.tripId,
      seatNumber: validatedData.seatNumber
    });
    // Intentar generar PDF y enviar correo al pasajero (no bloquear la creación si falla)
    try {
      const pdfBuffer = await generateTicketPDF({
        ticketId: ticket.id,
        passengerName: ticket.passengerName,
        passengerCedula: ticket.passengerCedula,
        cooperativaName: trip.frequency.cooperativa.nombre,
        origin: ticket.boardingStop,
        destination: ticket.dropoffStop,
        date: trip.date.toISOString().split('T')[0],
        time: trip.departureTime,
        seatNumber: ticket.seatNumber,
        busPlaca: trip.bus.placa,
        totalPrice: parseFloat(ticket.totalPrice.toString()),
        qrCode: ticket.qrCode
      });

      // Enviar email con el PDF adjunto. El correo informará del estado del pago según `ticket.paymentStatus`.
      await sendTicketEmail(ticket.passengerEmail, pdfBuffer, {
        ticketId: ticket.id,
        passengerName: ticket.passengerName,
        origin: ticket.boardingStop,
        destination: ticket.dropoffStop,
        date: trip.date.toISOString().split('T')[0],
        time: trip.departureTime,
        seatNumber: ticket.seatNumber,
        totalPrice: parseFloat(ticket.totalPrice.toString()),
        paymentStatus: ticket.paymentStatus,
        paymentMethod: ticket.paymentMethod
      });
    } catch (emailErr) {
      console.error('No se pudo enviar el email del ticket:', emailErr && (emailErr as any).message ? (emailErr as any).message : emailErr);
      // No rompemos la creación del ticket por fallo en email
    }

    res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

// Iniciar pago con PayPal
export const initiatePayPalPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        trip: {
          include: {
            frequency: {
              include: {
                route: true
              }
            }
          }
        }
      }
    });

    if (!ticket) {
      throw new AppError('Ticket no encontrado', 404);
    }

    if (ticket.status !== 'PENDING_PAYMENT') {
      throw new AppError('El ticket no está pendiente de pago', 400);
    }

    const payment = await createPayment({
      amount: parseFloat(ticket.totalPrice.toString()),
      description: `Ticket ${ticket.trip.frequency.route.origin} - ${ticket.trip.frequency.route.destination}`,
      returnUrl: `${process.env.FRONTEND_URL}/payment/success?ticketId=${ticketId}`,
      cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel?ticketId=${ticketId}`
    });

    const approvalUrl = payment.links.find((link: any) => link.rel === 'approval_url')?.href;

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        approvalUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// Ejecutar pago de PayPal
export const executePayPalPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentId, payerId, ticketId } = req.body;

    const payment = await executePayment(paymentId, payerId);

    if (payment.state === 'approved') {
      const ticket = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'PAID',
          paymentStatus: 'APPROVED',
          paymentId: paymentId
        },
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

      // Generar PDF y enviar email
      const pdfBuffer = await generateTicketPDF({
        ticketId: ticket.id,
        passengerName: ticket.passengerName,
        passengerCedula: ticket.passengerCedula,
        cooperativaName: ticket.trip.frequency.cooperativa.nombre,
        origin: ticket.boardingStop,
        destination: ticket.dropoffStop,
        date: ticket.trip.date.toISOString().split('T')[0],
        time: ticket.trip.departureTime,
        seatNumber: ticket.seatNumber,
        busPlaca: ticket.trip.bus.placa,
        totalPrice: parseFloat(ticket.totalPrice.toString()),
        qrCode: ticket.qrCode
      });

      await sendTicketEmail(ticket.passengerEmail, pdfBuffer, {
        ticketId: ticket.id,
        passengerName: ticket.passengerName,
        origin: ticket.boardingStop,
        destination: ticket.dropoffStop,
        date: ticket.trip.date.toISOString().split('T')[0],
        time: ticket.trip.departureTime,
        seatNumber: ticket.seatNumber,
        totalPrice: parseFloat(ticket.totalPrice.toString())
      });

      res.json({
        success: true,
        data: ticket
      });
    } else {
      throw new AppError('Pago rechazado', 400);
    }
  } catch (error) {
    next(error);
  }
};

// Subir comprobante de pago
export const uploadPaymentProof = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ticketId } = req.body;
    const file = req.file;

    if (!file) {
      throw new AppError('Archivo requerido', 400);
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        paymentProof: `/uploads/payment-proofs/${file.filename}`,
        paymentStatus: 'PENDING'
      }
    });

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

// Obtener mapa de asientos de un viaje
export const getSeatMap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bus: {
          select: {
            seatLayout: true,
            totalSeats: true
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
            status: true
          }
        }
      }
    });

    if (!trip) {
      throw new AppError('Viaje no encontrado', 404);
    }

    const seatLayout = trip.bus.seatLayout as any;
    const occupiedSeats = trip.tickets.map(t => t.seatNumber);

    // Marcar asientos ocupados
    const seats = seatLayout.seats.map((seat: any) => ({
      ...seat,
      isOccupied: occupiedSeats.includes(seat.number)
    }));

    res.json({
      success: true,
      data: {
        rows: seatLayout.rows,
        columns: seatLayout.columns,
        seats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener tickets del usuario
export const getMyTickets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { userId: req.user!.id },
          { passengerEmail: req.user!.email }
        ]
      },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

// List tickets (ADMIN / SUPER_ADMIN) with filters and pagination
export const getTickets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      startDate,
      endDate,
      status,
      paymentStatus,
      busId,
      cooperativaId,
      page,
      limit
    } = req.query as any;

    // Admin must be associated to a cooperativa
    if (req.user?.role === 'ADMIN' && !req.user.cooperativaId) {
      throw new AppError('Debes estar asociado a una cooperativa', 400);
    }

    const where: any = {};

    // Scoping by cooperativa: ADMIN sees only own cooperativa; SUPER_ADMIN can pass cooperativaId
    if (req.user?.role === 'ADMIN') {
      where.trip = {
        frequency: {
          cooperativaId: req.user.cooperativaId
        }
      };
    } else if (req.user?.role === 'SUPER_ADMIN' && cooperativaId) {
      where.trip = {
        frequency: {
          cooperativaId: cooperativaId as string
        }
      };
    }

    if (status) where.status = status as string;
    if (paymentStatus) where.paymentStatus = paymentStatus as string;
    if (busId) {
      where.trip = where.trip || {};
      where.trip.busId = busId as string;
    }

    if (startDate || endDate) {
      where.trip = where.trip || {};
      where.trip.date = {};
      if (startDate) where.trip.date.gte = new Date(startDate as string);
      if (endDate) where.trip.date.lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string) || 1;
    const take = Math.min(parseInt(limit as string) || 50, 200);
    const skip = (pageNum - 1) * take;

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
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
          },
          user: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ]);

    res.json({ success: true, data: tickets, total, page: pageNum, limit: take });
  } catch (error) {
    next(error);
  }
};

// Obtener ticket por ID
export const getTicketById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
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
      throw new AppError('Ticket no encontrado', 404);
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

// Descargar PDF del ticket
export const downloadTicketPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            frequency: { include: { route: true, cooperativa: true } },
            bus: true
          }
        }
      }
    });

    if (!ticket) {
      throw new AppError('Ticket no encontrado', 404);
    }

    // Permisos: cliente solo puede descargar sus tickets
    if (req.user && req.user.role === 'CLIENTE') {
      if (ticket.userId && ticket.userId !== req.user.id && ticket.passengerEmail !== req.user.email) {
        throw new AppError('No tienes permiso para descargar este ticket', 403);
      }
    }

    // Generar PDF en tiempo real
    const pdfBuffer = await generateTicketPDF({
      ticketId: ticket.id,
      passengerName: ticket.passengerName,
      passengerCedula: ticket.passengerCedula,
      cooperativaName: ticket.trip.frequency?.cooperativa?.nombre || '',
      origin: ticket.boardingStop,
      destination: ticket.dropoffStop,
      date: ticket.trip.date.toISOString().split('T')[0],
      time: ticket.trip.departureTime,
      seatNumber: ticket.seatNumber,
      busPlaca: ticket.trip.bus.placa,
      totalPrice: parseFloat(ticket.totalPrice.toString()),
      qrCode: ticket.qrCode
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticket.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// Cancelar ticket
export const cancelTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        trip: true
      }
    });

    if (!ticket) {
      throw new AppError('Ticket no encontrado', 404);
    }

    // Validar que el usuario pueda cancelar
    if (req.user?.role === 'CLIENTE' && ticket.userId !== req.user.id) {
      throw new AppError('No puedes cancelar este ticket', 403);
    }

    // No permitir cancelación si el viaje ya pasó
    if (ticket.trip.date < new Date()) {
      throw new AppError('No se puede cancelar un ticket de un viaje pasado', 400);
    }

    await prisma.ticket.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });

    // Emitir evento para liberar el asiento
    io.to(`trip-${ticket.tripId}`).emit('seat-released', {
      tripId: ticket.tripId,
      seatNumber: ticket.seatNumber
    });

    res.json({
      success: true,
      message: 'Ticket cancelado'
    });
  } catch (error) {
    next(error);
  }
};
