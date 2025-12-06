import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth.middleware';

const stopSchema = z.object({
  name: z.string(),
  order: z.number(),
  priceFromOrigin: z.number()
});

const routeSchema = z.object({
  cooperativaId: z.string().uuid().optional(),
  name: z.string(),
  origin: z.string(),
  destination: z.string(),
  stops: z.array(stopSchema).default([]),
  basePrice: z.number().positive(),
  estimatedDuration: z.number().positive(),
  distanceKm: z.number().positive().optional()
});

// Crear ruta
export const createRoute = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = routeSchema.parse(req.body);

    // Determinar cooperativaId según el rol
    let cooperativaId = validatedData.cooperativaId;
    
    if (req.user?.role === 'ADMIN') {
      // ADMIN usa su cooperativa (ignora el body)
      if (!req.user.cooperativaId) {
        throw new AppError('Admin debe estar asociado a una cooperativa', 400);
      }
      cooperativaId = req.user.cooperativaId;
    } else if (req.user?.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN debe especificar cooperativaId
      if (!cooperativaId) {
        throw new AppError('SUPER_ADMIN debe especificar cooperativaId', 400);
      }
    }

    const route = await prisma.route.create({
      data: {
        ...validatedData,
        cooperativaId: cooperativaId!,
        stops: validatedData.stops as any
      }
    });

    res.status(201).json({
      success: true,
      data: route
    });
  } catch (error) {
    next(error);
  }
};

// Obtener todas las rutas
export const getRoutes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const where: any = { isActive: true };

    if (req.user?.role !== 'SUPER_ADMIN') {
      where.cooperativaId = req.user?.cooperativaId;
    }

    const routes = await prisma.route.findMany({
      where,
      include: {
        cooperativa: {
          select: {
            nombre: true
          }
        },
        _count: {
          select: {
            frequencies: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: routes
    });
  } catch (error) {
    next(error);
  }
};

// Obtener ruta por ID
export const getRouteById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        cooperativa: true,
        frequencies: {
          include: {
            busGroup: true
          }
        }
      }
    });

    if (!route) {
      throw new AppError('Ruta no encontrada', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== route.cooperativaId) {
      throw new AppError('No tienes acceso a esta ruta', 403);
    }

    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar ruta
export const updateRoute = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = routeSchema.partial().parse(req.body);

    const existingRoute = await prisma.route.findUnique({
      where: { id }
    });

    if (!existingRoute) {
      throw new AppError('Ruta no encontrada', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== existingRoute.cooperativaId) {
      throw new AppError('No tienes acceso a esta ruta', 403);
    }

    // Preparar datos de actualización
    const updateData: any = {
      ...validatedData,
      ...(validatedData.stops && { stops: validatedData.stops as any })
    };

    // Solo SUPER_ADMIN puede cambiar cooperativaId
    if (req.user?.role !== 'SUPER_ADMIN' && validatedData.cooperativaId) {
      delete updateData.cooperativaId;
    }

    const route = await prisma.route.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar ruta
export const deleteRoute = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existingRoute = await prisma.route.findUnique({
      where: { id }
    });

    if (!existingRoute) {
      throw new AppError('Ruta no encontrada', 404);
    }

    // Validar acceso
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== existingRoute.cooperativaId) {
      throw new AppError('No tienes acceso a esta ruta', 403);
    }

    await prisma.route.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Ruta desactivada'
    });
  } catch (error) {
    next(error);
  }
};
