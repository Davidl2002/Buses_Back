import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  firstName: z.string().min(2, 'Nombre muy corto'),
  lastName: z.string().min(2, 'Apellido muy corto'),
  phone: z.string().optional(),
  cedula: z.string().optional(),
  role: z.enum(['CLIENTE']).default('CLIENTE')
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida')
});

export const createStaffSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  firstName: z.string().min(2, 'Nombre muy corto'),
  lastName: z.string().min(2, 'Apellido muy corto'),
  phone: z.string().optional(),
  cedula: z.string().min(10, 'Cédula inválida'),
  role: z.enum(['OFICINISTA', 'CHOFER']),
  cooperativaId: z.string().uuid()
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});
