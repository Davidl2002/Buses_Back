import { Router } from 'express';
import {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute
} from '../controllers/route.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/routes:
 *   post:
 *     tags: [Rutas]
 *     summary: Crear ruta
 *     description: Crea una nueva ruta con paradas intermedias
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cooperativaId
 *               - name
 *               - origin
 *               - destination
 *               - distance
 *               - estimatedDuration
 *               - basePrice
 *             properties:
 *               cooperativaId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               origin:
 *                 type: string
 *               destination:
 *                 type: string
 *               distance:
 *                 type: number
 *               estimatedDuration:
 *                 type: number
 *               basePrice:
 *                 type: number
 *               stops:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Ruta creada
 */
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), createRoute);

/**
 * @swagger
 * /api/routes:
 *   get:
 *     tags: [Rutas]
 *     summary: Listar rutas
 *     description: Obtiene todas las rutas de la cooperativa
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de rutas
 */
router.get('/', getRoutes);

/**
 * @swagger
 * /api/routes/{id}:
 *   get:
 *     tags: [Rutas]
 *     summary: Obtener ruta por ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Datos de la ruta
 */
router.get('/:id', getRouteById);

/**
 * @swagger
 * /api/routes/{id}:
 *   put:
 *     tags: [Rutas]
 *     summary: Actualizar ruta
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               origin:
 *                 type: string
 *               destination:
 *                 type: string
 *               distance:
 *                 type: number
 *               estimatedDuration:
 *                 type: number
 *               basePrice:
 *                 type: number
 *               stops:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Ruta actualizada
 *   delete:
 *     tags: [Rutas]
 *     summary: Eliminar ruta
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ruta eliminada
 */
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateRoute);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), deleteRoute);

export default router;
