import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    cooperativaId?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Token no proporcionado', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        cooperativaId: true,
        status: true
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Usuario no válido o inactivo', 401);
    }

    // map DB user to AuthRequest.user shape and convert null cooperativaId to undefined
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as string,
      cooperativaId: user.cooperativaId ?? undefined
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Token inválido', 401));
    } else {
      next(error);
    }
  }
};

// Middleware para verificar roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('No autenticado', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('No tienes permisos para esta acción', 403));
    }

    next();
  };
};

// Middleware que inyecta cooperativaId en queries
export const injectCooperativaId = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  // Los SUPER_ADMIN pueden ver todo
  if (req.user?.role === 'SUPER_ADMIN') {
    return next();
  }

  // Para otros roles, inyectar el cooperativaId
  if (req.user?.cooperativaId) {
    // Inyectar en body, query y params según sea necesario
    if (req.method === 'POST' || req.method === 'PUT') {
      req.body.cooperativaId = req.user.cooperativaId;
    }
  }

  next();
};
