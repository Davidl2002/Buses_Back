import { Router } from 'express';
import {
  createBus,
  getBuses,
  getBusById,
  updateBus,
  deleteBus,
  createBusGroup,
  getBusGroups,
  getBusGroupById,
  updateBusGroup,
  deleteBusGroup
} from '../controllers/bus.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/buses:
 *   post:
 *     tags: [Buses]
 *     summary: Crear bus
 *     description: Crea un nuevo bus con su diseño de asientos
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
 *               - placa
 *               - marca
 *               - modelo
 *               - year
 *               - numeroInterno
 *               - totalSeats
 *               - seatLayout
 *             properties:
 *               cooperativaId:
 *                 type: string
 *                 format: uuid
 *               placa:
 *                 type: string
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               year:
 *                 type: number
 *               numeroInterno:
 *                 type: string
 *               totalSeats:
 *                 type: number
 *               seatLayout:
 *                 type: object
 *                 properties:
 *                   rows:
 *                     type: number
 *                   columns:
 *                     type: number
 *                   seats:
 *                     type: array
 *     responses:
 *       201:
 *         description: Bus creado
 */
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), createBus);

/**
 * @swagger
 * /api/buses:
 *   get:
 *     tags: [Buses]
 *     summary: Listar buses
 *     description: Obtiene todos los buses de la cooperativa
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, MAINTENANCE, INACTIVE]
 *       - in: query
 *         name: cooperativaId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de buses
 */
router.get('/', getBuses);

/**
 * @swagger
 * /api/buses/{id}:
 *   get:
 *     tags: [Buses]
 *     summary: Obtener bus por ID
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
 *         description: Datos del bus
 */
// Rutas de grupos de buses (deben definirse antes de la ruta ":id")
router.get('/groups', getBusGroups);
router.get('/allGroups', getBusGroups);
router.post('/groups', authorize('ADMIN', 'SUPER_ADMIN'), createBusGroup);
router.get('/groups/:id', getBusGroupById);
router.put('/groups/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateBusGroup);
router.delete('/groups/:id', authorize('ADMIN', 'SUPER_ADMIN'), deleteBusGroup);

// Rutas para operar sobre buses individuales
router.get('/:id', getBusById);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateBus);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), deleteBus);

export default router;
