import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { 
  registerSchema, 
  loginSchema, 
  createStaffSchema,
  forgotPasswordSchema,
  resetPasswordSchema 
} from '../validators/auth.validator';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { generateToken, generateVerificationToken, generateResetToken } from '../services/jwt.service';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';
import { AuthRequest } from '../middlewares/auth.middleware';

// Registro de clientes (público)
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Verificar si el email ya existe
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUserByEmail) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Verificar si la cédula ya existe
    const existingUserByCedula = await prisma.user.findUnique({
      where: { cedula: validatedData.cedula }
    });

    if (existingUserByCedula) {
      throw new AppError('La cédula ya está registrada', 400);
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Generar token de verificación
    const verificationToken = generateVerificationToken();

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
        verificationToken,
        role: 'CLIENTE',
        status: 'PENDING_VERIFICATION'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true
      }
    });

    // Enviar email de verificación con Gmail
    await sendVerificationEmail(user.email, verificationToken, user.firstName);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado. Por favor verifica tu email.',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Verificación de email
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.redirect(`${process.env.FRONTEND_URL}/login?verified=false&message=Token inválido`);
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?verified=false&message=Token inválido o expirado`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        status: 'ACTIVE',
        verificationToken: null
      }
    });

    // Redirigir al frontend con mensaje de éxito
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=true&message=Email verificado exitosamente`);
  } catch (error) {
    console.error('Error verificando email:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=false&message=Error al verificar email`);
  }
};

// Login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Credenciales inválidas', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('Cuenta inactiva o pendiente de verificación', 401);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      cooperativaId: user.cooperativaId || undefined
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          cooperativaId: user.cooperativaId
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Crear staff (Oficinistas y Choferes) - Solo para Admin
export const createStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createStaffSchema.parse(req.body);

    // Verificar que el admin pertenezca a la cooperativa
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.cooperativaId !== validatedData.cooperativaId) {
      throw new AppError('No puedes crear staff para otra cooperativa', 403);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      throw new AppError('El email ya está registrado', 400);
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const staff = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
        emailVerified: true,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        cooperativaId: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Staff creado exitosamente',
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// Solicitar recuperación de contraseña
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      // No revelar si el email existe
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás un correo de recuperación'
      });
    }

    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    await sendPasswordResetEmail(user.email, resetToken, user.firstName);

    res.json({
      success: true,
      message: 'Si el email existe, recibirás un correo de recuperación'
    });
  } catch (error) {
    next(error);
  }
};

// Resetear contraseña
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { 
        resetToken: validatedData.token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      throw new AppError('Token inválido o expirado', 400);
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Obtener perfil del usuario autenticado
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        cedula: true,
        role: true,
        cooperativaId: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        cooperativa: {
          select: {
            id: true,
            nombre: true,
            config: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar perfil del usuario autenticado
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone, email, currentPassword, newPassword } = req.body;

    const userId = req.user!.id;

    // Validar que no se intenten cambiar campos prohibidos
    if (req.body.role || req.body.cooperativaId || req.body.status || req.body.emailVerified) {
      throw new AppError('No puedes modificar role, cooperativa, status o emailVerified', 403);
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Preparar datos a actualizar
    const updateData: any = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;

    // Si se quiere cambiar el email
    if (email && email !== existingUser.email) {
      // Verificar que el nuevo email no esté en uso
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        throw new AppError('El email ya está en uso', 400);
      }

      updateData.email = email;
      updateData.emailVerified = false; // Requiere nueva verificación
    }

    // Si se quiere cambiar la contraseña
    if (newPassword) {
      if (!currentPassword) {
        throw new AppError('Debes proporcionar tu contraseña actual', 400);
      }

      // Verificar contraseña actual
      const isPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);
      if (!isPasswordValid) {
        throw new AppError('Contraseña actual incorrecta', 400);
      }

      // Validar nueva contraseña
      if (newPassword.length < 8) {
        throw new AppError('La nueva contraseña debe tener al menos 8 caracteres', 400);
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        cedula: true,
        role: true,
        cooperativaId: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        cooperativa: {
          select: {
            id: true,
            nombre: true,
            config: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Perfil actualizado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};
