import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCities = async (req: Request, res: Response) => {
  try {
    const { q, state, country } = req.query as any;

    const where: any = { isActive: true };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { state: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (state) where.state = String(state);
    if (country) where.country = String(country);

    const cities = await prisma.city.findMany({ where, orderBy: { name: 'asc' } });

    return res.json({ success: true, data: cities, total: cities.length });
  } catch (error) {
    console.error('Error getting cities:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const getCityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const city = await prisma.city.findUnique({ where: { id } });
    if (!city) return res.status(404).json({ success: false, message: 'City not found' });
    return res.json({ success: true, data: city });
  } catch (error) {
    console.error('Error getting city by id:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const createCity = async (req: Request, res: Response) => {
  try {
    const { name, state, country } = req.body;PrismaClient
    const userReq = req as any;

    if (!userReq.user || !['SUPER_ADMIN', 'ADMIN'].includes(userReq.user.role)) {
      return res.status(403).json({ success: false, message: 'No tienes permisos para crear ciudades' });
    }

    const exists = await prisma.city.findFirst({ where: { name, state } });
    if (exists) return res.status(400).json({ success: false, message: 'La ciudad ya existe' });

    const city = await prisma.city.create({ data: { name, state, country: country || 'Ecuador' } });
    return res.status(201).json({ success: true, data: city });
  } catch (error) {
    console.error('Error creating city:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const updateCity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, state, country, isActive } = req.body;
    const userReq = req as any;

    if (!userReq.user || !['SUPER_ADMIN', 'ADMIN'].includes(userReq.user.role)) {
      return res.status(403).json({ success: false, message: 'No tienes permisos para actualizar ciudades' });
    }

    const existing = await prisma.city.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'City not found' });

    const updated = await prisma.city.update({ where: { id }, data: { name, state, country, isActive } });
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating city:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const deleteCity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userReq = req as any;

    if (!userReq.user || !['SUPER_ADMIN', 'ADMIN'].includes(userReq.user.role)) {
      return res.status(403).json({ success: false, message: 'No tienes permisos para eliminar ciudades' });
    }

    const existing = await prisma.city.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'City not found' });

    // Soft delete
    await prisma.city.update({ where: { id }, data: { isActive: false } });
    return res.json({ success: true, message: 'City removed' });
  } catch (error) {
    console.error('Error deleting city:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
