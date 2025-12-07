import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { searchUsers } from '../controllers/staff.controller';

const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Usuarios]
 *     summary: Buscar usuarios
 *     description: Busca usuarios por cédula o email
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cedula
 *         schema:
 *           type: string
 *         description: Cédula del usuario a buscar
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Email del usuario a buscar
 *     responses:
 *       200:
 *         description: Usuarios encontrados
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
 *                     $ref: '#/components/schemas/User'
 */
router.get('/', authenticate, searchUsers);

export default router;
