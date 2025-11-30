import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth.middleware';

const seatSchema = z.object({
  number: z.number(),
  row: z.number(),
  col: z.number(),
  type: z.enum(['NORMAL', 'VIP', 'SEMI_CAMA']),
  isAvailable: z.boolean().default(true)
});

const busSchema = z.object({
  cooperativaId: z.string().uuid(),
  placa: z.string().min(6, 'Placa inválida'),
  marca: z.string(),
  modelo: z.string(),
  year: z.number().min(1990).max(2030),
  chasis: z.string().optional(),
  numeroInterno: z.string(),
  totalSeats: z.number().min(1),
  seatLayout: z.object({
    rows: z.number(),
    columns: z.number(),
    seats: z.array(seatSchema)
  }),
  hasAC: z.boolean().default(false),
  hasWifi: z.boolean().default(false),
  hasBathroom: z.boolean().default(false),
  hasTV: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).default('ACTIVE'),
  busGroupId: z.string().uuid().optional()
});

// Crear bus
export const createBus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = busSchema.parse(req.body);

    // Validar mínimo de asientos
    if (validatedData.totalSeats < 20) {
      throw new AppError('El bus debe tener al menos 20 asientos', 400);
    }
    if (!validatedData.seatLayout || !validatedData.seatLayout.seats || validatedData.seatLayout.seats.length !== validatedData.totalSeats) {
      throw new AppError('La configuración de asientos debe coincidir con el total de asientos', 400);
    }

    // Validar acceso a cooperativa
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== validatedData.cooperativaId) {
      throw new AppError('No puedes crear buses para otra cooperativa', 403);
    }

    // Verificar que la placa no exista
    const existingBus = await prisma.bus.findUnique({
      where: { placa: validatedData.placa }
    });

    if (existingBus) {
      throw new AppError('Ya existe un bus con esa placa', 400);
    }

    const bus = await prisma.bus.create({
      data: {
        ...validatedData,
        seatLayout: validatedData.seatLayout as any
      },
      include: {
        cooperativa: {
          select: {
            nombre: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: bus
    });
  } catch (error) {
    next(error);
  }
};

// Obtener todos los buses
export const getBuses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, cooperativaId } = req.query;

    const where: any = {};

    // Filtro por cooperativa
    if (req.user?.role !== 'SUPER_ADMIN') {
      where.cooperativaId = req.user?.cooperativaId;
    } else if (cooperativaId) {
      where.cooperativaId = cooperativaId;
    }

    // Filtro por estado
    if (status) {
      where.status = status;
    }

    const buses = await prisma.bus.findMany({
      where,
      include: {
        cooperativa: {
          select: {
            nombre: true
          }
        },
        busGroup: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        numeroInterno: 'asc'
      }
    });

    res.json({
      success: true,
      data: buses
    });
  } catch (error) {
    next(error);
  }
};

// Obtener un bus por ID
export const getBusById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const bus = await prisma.bus.findUnique({
      where: { id },
      include: {
        cooperativa: true,
        busGroup: true,
        trips: {
          where: {
            date: {
              gte: new Date()
            }
          },
          take: 5,
          orderBy: {
            date: 'asc'
          }
        }
      }
    });

    if (!bus) {
      throw new AppError('Bus no encontrado', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== bus.cooperativaId) {
      throw new AppError('No tienes acceso a este bus', 403);
    }

    res.json({
      success: true,
      data: bus
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar bus
export const updateBus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = busSchema.partial().parse(req.body);

    const existingBus = await prisma.bus.findUnique({
      where: { id }
    });

    if (!existingBus) {
      throw new AppError('Bus no encontrado', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== existingBus.cooperativaId) {
      throw new AppError('No tienes acceso a este bus', 403);
    }

    // Validar mínimo de asientos si se actualiza
    if (validatedData.totalSeats !== undefined && validatedData.totalSeats < 20) {
      throw new AppError('El bus debe tener al menos 20 asientos', 400);
    }
    if (validatedData.totalSeats !== undefined && validatedData.seatLayout && validatedData.seatLayout.seats && validatedData.seatLayout.seats.length !== validatedData.totalSeats) {
      throw new AppError('La configuración de asientos debe coincidir con el total de asientos', 400);
    }

    const bus = await prisma.bus.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.seatLayout && { seatLayout: validatedData.seatLayout as any })
      }
    });

    res.json({
      success: true,
      data: bus
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar bus
export const deleteBus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existingBus = await prisma.bus.findUnique({
      where: { id }
    });

    if (!existingBus) {
      throw new AppError('Bus no encontrado', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== existingBus.cooperativaId) {
      throw new AppError('No tienes acceso a este bus', 403);
    }

    await prisma.bus.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Bus eliminado'
    });
  } catch (error) {
    next(error);
  }
};

// Crear grupo de buses
export const createBusGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, cooperativaId } = req.body;

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== cooperativaId) {
      throw new AppError('No puedes crear grupos para otra cooperativa', 403);
    }

    const busGroup = await prisma.busGroup.create({
      data: {
        name,
        description,
        cooperativaId
      }
    });

    res.status(201).json({
      success: true,
      data: busGroup
    });
  } catch (error) {
    next(error);
  }
};

// Obtener grupos de buses
export const getBusGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const where: any = {};

    if (req.user?.role !== 'SUPER_ADMIN') {
      where.cooperativaId = req.user?.cooperativaId;
    }

    const busGroups = await prisma.busGroup.findMany({
      where,
      include: {
        buses: true,
        _count: {
          select: {
            buses: true,
            frequencies: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: busGroups
    });
  } catch (error) {
    next(error);
  }
};

// Obtener un grupo por ID
export const getBusGroupById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const group = await prisma.busGroup.findUnique({
      where: { id },
      include: {
        buses: true,
        frequencies: true
      }
    });

    if (!group) {
      throw new AppError('Grupo de buses no encontrado', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== group.cooperativaId) {
      throw new AppError('No tienes acceso a este grupo de buses', 403);
    }

    res.json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

// Actualizar grupo de buses
export const updateBusGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = await prisma.busGroup.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Grupo de buses no encontrado', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== existing.cooperativaId) {
      throw new AppError('No tienes permiso para modificar este grupo', 403);
    }

    const updated = await prisma.busGroup.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description })
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Eliminar grupo de buses (solo si no tiene buses ni frecuencias asociadas)
export const deleteBusGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.busGroup.findUnique({
      where: { id },
      include: {
        buses: true,
        frequencies: true
      }
    });

    if (!existing) {
      throw new AppError('Grupo de buses no encontrado', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== existing.cooperativaId) {
      throw new AppError('No tienes permiso para eliminar este grupo', 403);
    }

    if ((existing.buses && existing.buses.length > 0) || (existing.frequencies && existing.frequencies.length > 0)) {
      throw new AppError('No se puede eliminar un grupo que tiene buses o frecuencias asociadas. Reasigna o elimina las dependencias primero.', 400);
    }

    await prisma.busGroup.delete({ where: { id } });

    res.json({ success: true, message: 'Grupo eliminado' });
  } catch (error) {
    next(error);
  }
};
