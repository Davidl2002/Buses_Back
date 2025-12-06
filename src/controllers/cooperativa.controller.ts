import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth.middleware';

const cooperativaSchema = z.object({
  nombre: z.string().min(3, 'Nombre muy corto'),
  ruc: z.string().min(13, 'RUC inválido').max(13),
  email: z.string().email('Email inválido'),
  phone: z.string(),
  address: z.string().optional(),
  config: z.object({
    logo: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional()
  }).optional()
});

// Crear cooperativa (Solo SUPER_ADMIN)
export const createCooperativa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = cooperativaSchema.parse(req.body);

    const cooperativa = await prisma.cooperativa.create({
      data: validatedData
    });

    res.status(201).json({
      success: true,
      data: cooperativa
    });
  } catch (error) {
    next(error);
  }
};

// Obtener todas las cooperativas
export const getCooperativas = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const where: any = {};

    // Si no es SUPER_ADMIN, solo ver su cooperativa
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId) {
      where.id = req.user.cooperativaId;
    }

    const cooperativas = await prisma.cooperativa.findMany({
      where,
      include: {
        _count: {
          select: {
            buses: true,
            users: true,
            routes: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: cooperativas
    });
  } catch (error) {
    next(error);
  }
};

// Obtener una cooperativa por ID
export const getCooperativaById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== id) {
      throw new AppError('No tienes acceso a esta cooperativa', 403);
    }

    const cooperativa = await prisma.cooperativa.findUnique({
      where: { id },
      include: {
        buses: true,
        routes: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    if (!cooperativa) {
      throw new AppError('Cooperativa no encontrada', 404);
    }

    res.json({
      success: true,
      data: cooperativa
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar cooperativa
export const updateCooperativa = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = cooperativaSchema.partial().parse(req.body);

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== id) {
      throw new AppError('No tienes acceso a esta cooperativa', 403);
    }

    const cooperativa = await prisma.cooperativa.update({
      where: { id },
      data: validatedData
    });

    res.json({
      success: true,
      data: cooperativa
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar cooperativa (Solo SUPER_ADMIN) - Soft delete
export const deleteCooperativa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verificar que existe
    const cooperativa = await prisma.cooperativa.findUnique({
      where: { id }
    });

    if (!cooperativa) {
      throw new AppError('Cooperativa no encontrada', 404);
    }

    // Soft delete: marcar como inactiva
    await prisma.cooperativa.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Cooperativa desactivada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Activar cooperativa
export const activateCooperativa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verificar que existe
    const cooperativa = await prisma.cooperativa.findUnique({
      where: { id }
    });

    if (!cooperativa) {
      throw new AppError('Cooperativa no encontrada', 404);
    }

    // Activar cooperativa
    const updatedCooperativa = await prisma.cooperativa.update({
      where: { id },
      data: { isActive: true }
    });

    res.json({
      success: true,
      message: 'Cooperativa activada exitosamente',
      data: updatedCooperativa
    });
  } catch (error) {
    next(error);
  }
};
