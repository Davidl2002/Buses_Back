import { Router } from 'express';
import {
  createFrequency,
  getFrequencies,
  getFrequencyById,
  updateFrequency,
  deleteFrequency,
  generateTrips
} from '../controllers/frequency.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/frequencies:
 *   post:
 *     tags: [Frecuencias]
 *     summary: Crear frecuencia
 *     description: Crea una nueva frecuencia de viajes
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
 *               - routeId
 *               - busGroupId
 *               - departureTime
 *               - operatingDays
 *             properties:
 *               cooperativaId:
 *                 type: string
 *                 format: uuid
 *               routeId:
 *                 type: string
 *                 format: uuid
 *               busGroupId:
 *                 type: string
 *                 format: uuid
 *               departureTime:
 *                 type: string
 *                 example: "08:00"
 *               operatingDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY]
 *     responses:
 *       201:
 *         description: Frecuencia creada
 */
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), createFrequency);

/**
 * @swagger
 * /api/frequencies:
 *   get:
 *     tags: [Frecuencias]
 *     summary: Listar frecuencias
 *     description: Obtiene todas las frecuencias
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de frecuencias
 */
router.get('/', getFrequencies);

/**
 * @swagger
 * /api/frequencies/generate-trips:
 *   post:
 *     tags: [Frecuencias]
 *     summary: Generar viajes automáticamente
 *     description: Genera viajes para un rango de fechas basado en las frecuencias configuradas
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               frequencyIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Viajes generados
 */
router.post('/generate-trips', authorize('ADMIN', 'SUPER_ADMIN'), generateTrips);

router.get('/:id', getFrequencyById);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateFrequency);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), deleteFrequency);

export default router;
