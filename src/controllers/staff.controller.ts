import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export const getStaff = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    const userReq = req as any;
    
    // Verificar permisos
    if (!userReq.user || !['SUPER_ADMIN', 'ADMIN'].includes(userReq.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }
    
    // Construir el filtro
    let whereClause: any = {
      status: 'ACTIVE',
      emailVerified: true
    };

    // Si se especifica un rol, filtrarlo
    if (role) {
      // Mapear DRIVER a CHOFER
      const mappedRole = role === 'DRIVER' ? 'CHOFER' : role;
      whereClause.role = mappedRole as UserRole;
    }

    // Control de acceso por rol:
    // SUPER_ADMIN: puede ver todo el staff
    // ADMIN: solo puede ver el staff de su cooperativa
    if (userReq.user.role === 'ADMIN') {
      if (!userReq.user.cooperativaId) {
        return res.status(400).json({
          success: false,
          message: 'Admin debe estar asociado a una cooperativa'
        });
      }
      whereClause.cooperativaId = userReq.user.cooperativaId;
    }
    // SUPER_ADMIN no tiene restricciones de cooperativa

    const staff = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        cedula: true,
        role: true,
        status: true,
        cooperativaId: true,
        // Campos específicos para empleados/choferes
        licenseNumber: true,
        licenseType: true,
        licenseExpiryDate: true,
        salary: true,
        hireDate: true,
        emergencyContact: true,
        emergencyPhone: true,
        address: true,
        cooperativa: {
          select: {
            id: true,
            nombre: true
          }
        },
        createdAt: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    return res.json({
      success: true,
      data: staff,
      total: staff.length
    });

  } catch (error) {
    console.error('Error getting staff:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getStaffById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userReq = req as any;

    // Verificar permisos
    if (!userReq.user || !['SUPER_ADMIN', 'ADMIN'].includes(userReq.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    let whereClause: any = {
      id,
      status: 'ACTIVE'
    };

    // Control de acceso por rol:
    // SUPER_ADMIN: puede ver cualquier staff member
    // ADMIN: solo puede ver staff de su cooperativa
    if (userReq.user.role === 'ADMIN') {
      if (!userReq.user.cooperativaId) {
        return res.status(400).json({
          success: false,
          message: 'Admin debe estar asociado a una cooperativa'
        });
      }
      whereClause.cooperativaId = userReq.user.cooperativaId;
    }

    const staff = await prisma.user.findFirst({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        cedula: true,
        role: true,
        status: true,
        cooperativaId: true,
        // Campos específicos para empleados/choferes
        licenseNumber: true,
        licenseType: true,
        licenseExpiryDate: true,
        salary: true,
        hireDate: true,
        emergencyContact: true,
        emergencyPhone: true,
        address: true,
        cooperativa: {
          select: {
            id: true,
            nombre: true
          }
        },
        createdAt: true
      }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    return res.json({
      success: true,
      data: staff
    });

  } catch (error) {
    console.error('Error getting staff by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      cedula,
      role,
      licenseNumber,
      licenseType,
      licenseExpiryDate,
      salary,
      hireDate,
      emergencyContact,
      emergencyPhone,
      address
    } = req.body;
    
    const userReq = req as any;

    // Verificar permisos
    if (!userReq.user || !['SUPER_ADMIN', 'ADMIN'].includes(userReq.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear staff'
      });
    }

    // Determinar cooperativa para el nuevo staff
    let assignedCooperativaId = req.body.cooperativaId || null;
    
    if (userReq.user.role === 'ADMIN') {
      // ADMIN siempre asigna su propia cooperativa (ignora el body)
      if (!userReq.user.cooperativaId) {
        return res.status(400).json({
          success: false,
          message: 'Admin debe estar asociado a una cooperativa'
        });
      }
      assignedCooperativaId = userReq.user.cooperativaId;
    }
    // SUPER_ADMIN puede especificar cooperativaId en el body o dejarlo null

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Verificar si la cédula ya existe (si se proporciona)
    if (cedula) {
      const existingCedula = await prisma.user.findUnique({
        where: { cedula }
      });

      if (existingCedula) {
        return res.status(400).json({
          success: false,
          message: 'La cédula ya está registrada'
        });
      }
    }

    // Hash de la contraseña
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear el usuario
    const newStaff = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        cedula,
        role: role as UserRole,
        status: 'ACTIVE',
        emailVerified: true, // Staff creado por admin se considera verificado
        cooperativaId: assignedCooperativaId,
        // Campos específicos para empleados/choferes
        licenseNumber,
        licenseType,
        licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null,
        salary: salary ? parseFloat(salary) : null,
        hireDate: hireDate ? new Date(hireDate) : null,
        emergencyContact,
        emergencyPhone,
        address
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        cedula: true,
        role: true,
        status: true,
        cooperativaId: true,
        licenseNumber: true,
        licenseType: true,
        licenseExpiryDate: true,
        salary: true,
        hireDate: true,
        emergencyContact: true,
        emergencyPhone: true,
        address: true,
        createdAt: true
      }
    });

    return res.status(201).json({
      success: true,
      data: newStaff,
      message: 'Staff member created successfully'
    });

  } catch (error) {
    console.error('Error creating staff:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      cedula,
      role,
      status,
      cooperativaId,
      password,
      licenseNumber,
      licenseType,
      licenseExpiryDate,
      salary,
      hireDate,
      emergencyContact,
      emergencyPhone,
      address
    } = req.body;

    const userReq = req as any;

    // Verificar permisos
    if (!userReq.user || !['SUPER_ADMIN', 'ADMIN'].includes(userReq.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar staff'
      });
    }

    // Verificar que el staff existe y aplicar control de acceso
    let whereClause: any = { id };
    if (userReq.user.role === 'ADMIN') {
      if (!userReq.user.cooperativaId) {
        return res.status(400).json({
          success: false,
          message: 'Admin debe estar asociado a una cooperativa'
        });
      }
      whereClause.cooperativaId = userReq.user.cooperativaId;
    }
    // SUPER_ADMIN puede actualizar cualquier staff

    const existingStaff = await prisma.user.findFirst({
      where: whereClause
    });

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Verificar si la cédula ya existe (si se está actualizando)
    if (cedula && cedula !== existingStaff.cedula) {
      const existingCedula = await prisma.user.findUnique({
        where: { cedula }
      });

      if (existingCedula) {
        return res.status(400).json({
          success: false,
          message: 'La cédula ya está registrada'
        });
      }
    }

    // Actualizar el staff
    const updateData: any = {
      firstName,
      lastName,
      phone,
      cedula,
      role: role as UserRole,
      status,
      // Campos específicos para empleados/choferes
      licenseNumber,
      licenseType,
      licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : undefined,
      salary: salary !== undefined ? parseFloat(salary) : undefined,
      hireDate: hireDate ? new Date(hireDate) : undefined,
      emergencyContact,
      emergencyPhone,
      address
    };

    // Si se proporciona nueva contraseña, hashearla
    if (password && password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Solo SUPER_ADMIN puede cambiar la cooperativaId
    if (userReq.user.role === 'SUPER_ADMIN' && cooperativaId !== undefined) {
      updateData.cooperativaId = cooperativaId;
    }

    const updatedStaff = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        cedula: true,
        role: true,
        status: true,
        cooperativaId: true,
        licenseNumber: true,
        licenseType: true,
        licenseExpiryDate: true,
        salary: true,
        hireDate: true,
        emergencyContact: true,
        emergencyPhone: true,
        address: true,
        updatedAt: true
      }
    });

    return res.json({
      success: true,
      data: updatedStaff,
      message: 'Staff member updated successfully'
    });

  } catch (error) {
    console.error('Error updating staff:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const deleteStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userReq = req as any;

    // Verificar permisos
    if (!userReq.user || !['SUPER_ADMIN', 'ADMIN'].includes(userReq.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar staff'
      });
    }

    // Verificar que el staff existe y aplicar control de acceso
    let whereClause: any = { id };
    if (userReq.user.role === 'ADMIN') {
      if (!userReq.user.cooperativaId) {
        return res.status(400).json({
          success: false,
          message: 'Admin debe estar asociado a una cooperativa'
        });
      }
      whereClause.cooperativaId = userReq.user.cooperativaId;
    }
    // SUPER_ADMIN puede eliminar cualquier staff

    const existingStaff = await prisma.user.findFirst({
      where: whereClause
    });

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // En lugar de eliminar, marcar como inactivo
    await prisma.user.update({
      where: { id },
      data: {
        status: 'INACTIVE'
      }
    });

    return res.json({
      success: true,
      message: 'Staff member deactivated successfully'
    });

  } catch (error) {
    console.error('Error deleting staff:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Buscar usuarios por cedula o email (para autocompletar en formularios)
export const searchUsers = async (req: any, res: Response) => {
  try {
    const { cedula, email, limit } = req.query;

    // Requiere autenticación (middleware garantiza req.user)
    // ADMIN puede ver solo su cooperativa
    const where: any = { status: 'ACTIVE' };

    if (cedula) {
      where.cedula = { contains: cedula };
    }

    if (email) {
      where.email = { contains: email };
    }

    if (req.user?.role === 'ADMIN') {
      if (!req.user.cooperativaId) {
        return res.status(400).json({ success: false, message: 'Admin debe estar asociado a una cooperativa' });
      }
      where.cooperativaId = req.user.cooperativaId;
    }

    const take = Math.min(parseInt(limit as string) || 10, 50);

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        cedula: true,
        phone: true
      },
      take,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });

    return res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};