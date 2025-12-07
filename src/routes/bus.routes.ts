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
 * /api/buses/groups:
 *   get:
 *     tags: [Buses]
 *     summary: Listar grupos de buses
 *     description: Obtiene todos los grupos de buses de la cooperativa
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de grupos de buses
 *   post:
 *     tags: [Buses]
 *     summary: Crear grupo de buses
 *     description: Crea un nuevo grupo de buses con características compartidas
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
 *               - busIds
 *             properties:
 *               cooperativaId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               busIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Grupo de buses creado
 */
router.get('/groups', getBusGroups);
router.get('/allGroups', getBusGroups);
router.post('/groups', authorize('ADMIN', 'SUPER_ADMIN'), createBusGroup);

/**
 * @swagger
 * /api/buses/groups/{id}:
 *   get:
 *     tags: [Buses]
 *     summary: Obtener grupo de buses por ID
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
 *         description: Datos del grupo de buses
 *   put:
 *     tags: [Buses]
 *     summary: Actualizar grupo de buses
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
 *               description:
 *                 type: string
 *               busIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Grupo actualizado
 *   delete:
 *     tags: [Buses]
 *     summary: Eliminar grupo de buses
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
 *         description: Grupo eliminado
 */
router.get('/groups/:id', getBusGroupById);
router.put('/groups/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateBusGroup);
router.delete('/groups/:id', authorize('ADMIN', 'SUPER_ADMIN'), deleteBusGroup);

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
 *   put:
 *     tags: [Buses]
 *     summary: Actualizar bus
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
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, MAINTENANCE, INACTIVE]
 *               hasAC:
 *                 type: boolean
 *               hasWifi:
 *                 type: boolean
 *               hasBathroom:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Bus actualizado
 *   delete:
 *     tags: [Buses]
 *     summary: Eliminar bus
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
 *         description: Bus eliminado
 */
router.get('/:id', getBusById);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateBus);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), deleteBus);

export default router;
