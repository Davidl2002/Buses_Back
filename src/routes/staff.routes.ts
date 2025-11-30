import { Router } from 'express';
import {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff
} from '../controllers/staff.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { handleValidationErrors } from '../middlewares/validation.middleware';
import {
  validateCreateStaff,
  validateUpdateStaff,
  validateStaffId,
  validateStaffQuery
} from '../validators/staff.validator';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     Staff:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         cedula:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, OFICINISTA, CHOFER]
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         cooperativaId:
 *           type: string
 *         licenseNumber:
 *           type: string
 *         licenseType:
 *           type: string
 *           enum: [A, B, C, D, E, F, G]
 *         licenseExpiryDate:
 *           type: string
 *           format: date
 *         salary:
 *           type: number
 *         hireDate:
 *           type: string
 *           format: date
 *         emergencyContact:
 *           type: string
 *         emergencyPhone:
 *           type: string
 *         address:
 *           type: string
 *         cooperativa:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             nombre:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateStaffRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - role
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         cedula:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, OFICINISTA, CHOFER]
 *         licenseNumber:
 *           type: string
 *         licenseType:
 *           type: string
 *           enum: [A, B, C, D, E, F, G]
 *         licenseExpiryDate:
 *           type: string
 *           format: date
 *         salary:
 *           type: number
 *         hireDate:
 *           type: string
 *           format: date
 *         emergencyContact:
 *           type: string
 *         emergencyPhone:
 *           type: string
 *         address:
 *           type: string
 *     UpdateStaffRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         cedula:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, OFICINISTA, CHOFER]
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         licenseNumber:
 *           type: string
 *         licenseType:
 *           type: string
 *           enum: [A, B, C, D, E, F, G]
 *         licenseExpiryDate:
 *           type: string
 *           format: date
 *         salary:
 *           type: number
 *         hireDate:
 *           type: string
 *           format: date
 *         emergencyContact:
 *           type: string
 *         emergencyPhone:
 *           type: string
 *         address:
 *           type: string
 */

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: Get all staff members
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, OFICINISTA, CHOFER, DRIVER]
 *         description: Filter by role (DRIVER maps to CHOFER)
 *     responses:
 *       200:
 *         description: List of staff members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Staff'
 *                 total:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', validateStaffQuery, handleValidationErrors, getStaff);

/**
 * @swagger
 * /api/staff/{id}:
 *   get:
 *     summary: Get staff member by ID
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff member ID
 *     responses:
 *       200:
 *         description: Staff member details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *       404:
 *         description: Staff member not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:id', validateStaffId, handleValidationErrors, getStaffById);

/**
 * @swagger
 * /api/staff:
 *   post:
 *     summary: Create new staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStaffRequest'
 *     responses:
 *       201:
 *         description: Staff member created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - Email or cedula already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', validateCreateStaff, handleValidationErrors, createStaff);

/**
 * @swagger
 * /api/staff/{id}:
 *   put:
 *     summary: Update staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStaffRequest'
 *     responses:
 *       200:
 *         description: Staff member updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - Cedula already exists
 *       404:
 *         description: Staff member not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/:id', validateUpdateStaff, handleValidationErrors, updateStaff);

/**
 * @swagger
 * /api/staff/{id}:
 *   delete:
 *     summary: Deactivate staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff member ID
 *     responses:
 *       200:
 *         description: Staff member deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Staff member not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', validateStaffId, handleValidationErrors, deleteStaff);

export default router;