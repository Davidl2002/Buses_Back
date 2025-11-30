import { body, param, query } from 'express-validator';

export const validateCreateStaff = [
  body('email')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Phone must be a valid phone number'),
  
  body('cedula')
    .optional()
    .isLength({ min: 10, max: 13 })
    .withMessage('Cedula must be between 10 and 13 characters'),
  
  body('role')
    .isIn(['ADMIN', 'OFICINISTA', 'CHOFER'])
    .withMessage('Role must be ADMIN, OFICINISTA, or CHOFER'),
  
  // Campos específicos para empleados/choferes (opcionales)
  body('licenseNumber')
    .optional()
    .isLength({ min: 5, max: 20 })
    .withMessage('License number must be between 5 and 20 characters'),
  
  body('licenseType')
    .optional()
    .isIn(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    .withMessage('License type must be A, B, C, D, E, F, or G'),
  
  body('licenseExpiryDate')
    .optional()
    .isISO8601()
    .withMessage('License expiry date must be a valid date'),
  
  body('salary')
    .optional()
    .isNumeric()
    .withMessage('Salary must be a valid number'),
  
  body('hireDate')
    .optional()
    .isISO8601()
    .withMessage('Hire date must be a valid date'),
  
  body('emergencyContact')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Emergency contact must be between 2 and 100 characters'),
  
  body('emergencyPhone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Emergency phone must be a valid phone number'),
  
  body('address')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters')
];

export const validateUpdateStaff = [
  param('id')
    .isUUID()
    .withMessage('Staff ID must be a valid UUID'),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Phone must be a valid phone number'),
  
  body('cedula')
    .optional()
    .isLength({ min: 10, max: 13 })
    .withMessage('Cedula must be between 10 and 13 characters'),
  
  body('role')
    .optional()
    .isIn(['ADMIN', 'OFICINISTA', 'CHOFER'])
    .withMessage('Role must be ADMIN, OFICINISTA, or CHOFER'),
  
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Status must be ACTIVE or INACTIVE'),
  
  // Campos específicos para empleados/choferes (opcionales en actualización)
  body('licenseNumber')
    .optional()
    .isLength({ min: 5, max: 20 })
    .withMessage('License number must be between 5 and 20 characters'),
  
  body('licenseType')
    .optional()
    .isIn(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    .withMessage('License type must be A, B, C, D, E, F, or G'),
  
  body('licenseExpiryDate')
    .optional()
    .isISO8601()
    .withMessage('License expiry date must be a valid date'),
  
  body('salary')
    .optional()
    .isNumeric()
    .withMessage('Salary must be a valid number'),
  
  body('hireDate')
    .optional()
    .isISO8601()
    .withMessage('Hire date must be a valid date'),
  
  body('emergencyContact')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Emergency contact must be between 2 and 100 characters'),
  
  body('emergencyPhone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Emergency phone must be a valid phone number'),
  
  body('address')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters')
];

export const validateStaffId = [
  param('id')
    .isUUID()
    .withMessage('Staff ID must be a valid UUID')
];

export const validateStaffQuery = [
  query('role')
    .optional()
    .isIn(['ADMIN', 'OFICINISTA', 'CHOFER', 'DRIVER'])
    .withMessage('Role must be ADMIN, OFICINISTA, CHOFER, or DRIVER')
];