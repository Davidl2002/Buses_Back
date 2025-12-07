import { Router } from 'express';
import {
  createCooperativa,
  getCooperativas,
  getCooperativaById,
  updateCooperativa,
  deleteCooperativa,
  activateCooperativa
} from '../controllers/cooperativa.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/cooperativas:
 *   post:
 *     tags: [Cooperativas]
 *     summary: Crear cooperativa
 *     description: Crea una nueva cooperativa (Solo SUPER_ADMIN)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - ruc
 *               - email
 *             properties:
 *               nombre:
 *                 type: string
 *               ruc:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cooperativa creada
 */
router.post('/', authorize('SUPER_ADMIN'), createCooperativa);

/**
 * @swagger
 * /api/cooperativas:
 *   get:
 *     tags: [Cooperativas]
 *     summary: Listar cooperativas
 *     description: Obtiene todas las cooperativas
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cooperativas
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
 *                     $ref: '#/components/schemas/Cooperativa'
 */
router.get('/', getCooperativas);

/**
 * @swagger
 * /api/cooperativas/{id}:
 *   get:
 *     tags: [Cooperativas]
 *     summary: Obtener cooperativa por ID
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
 *         description: Datos de la cooperativa
 */
router.get('/:id', getCooperativaById);

router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'OFICINISTA'), updateCooperativa);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteCooperativa);

/**
 * @swagger
 * /api/cooperativas/{id}/activate:
 *   patch:
 *     tags: [Cooperativas]
 *     summary: Activar cooperativa
 *     description: Activa una cooperativa previamente desactivada (Solo SUPER_ADMIN)
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
 *         description: Cooperativa activada exitosamente
 */
router.patch('/:id/activate', authorize('SUPER_ADMIN'), activateCooperativa);

export default router;
