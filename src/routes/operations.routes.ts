import { Router, RequestHandler } from 'express';
import {
  validateQR,
  getPassengerManifest,
  createTripExpense,
  getTripExpenses,
  getTripProfitReport,
  getCooperativaProfitReport
} from '../controllers/operations.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/operations/validate-qr:
 *   post:
 *     tags: [Operaciones]
 *     summary: Validar código QR del ticket
 *     description: Valida un ticket escaneando su código QR (Choferes y personal)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrCode
 *             properties:
 *               qrCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket válido
 *       400:
 *         description: Ticket inválido o ya usado
 */
router.post('/validate-qr', authorize('CHOFER', 'OFICINISTA', 'ADMIN', 'SUPER_ADMIN'), validateQR);

/**
 * @swagger
 * /api/operations/manifest/{tripId}:
 *   get:
 *     tags: [Operaciones]
 *     summary: Obtener manifiesto de pasajeros
 *     description: Lista todos los pasajeros de un viaje
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Manifiesto de pasajeros
 */
router.get('/manifest/:tripId', authorize('CHOFER', 'OFICINISTA', 'ADMIN', 'SUPER_ADMIN'), getPassengerManifest);

/**
 * @swagger
 * /api/operations/expenses:
 *   post:
 *     tags: [Operaciones]
 *     summary: Registrar gasto del viaje
 *     description: Crea un nuevo gasto asociado a un viaje
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - tripId
 *               - description
 *               - amount
 *             properties:
 *               tripId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               receipt:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Gasto registrado
 */
router.post('/expenses', authorize('CHOFER', 'ADMIN', 'SUPER_ADMIN'), (upload.single('receipt') as unknown) as RequestHandler, createTripExpense);

/**
 * @swagger
 * /api/operations/reports/trip/{tripId}:
 *   get:
 *     tags: [Operaciones]
 *     summary: Reporte de ganancias de un viaje
 *     description: Obtiene el reporte de ingresos y gastos de un viaje específico
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reporte de ganancias
 */
router.get('/reports/trip/:tripId', authorize('ADMIN', 'SUPER_ADMIN'), getTripProfitReport);

/**
 * @swagger
 * /api/operations/reports/cooperativa:
 *   get:
 *     tags: [Operaciones]
 *     summary: Reporte de ganancias de la cooperativa
 *     description: Obtiene el reporte consolidado de ingresos y gastos
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Reporte consolidado
 */
router.get('/reports/cooperativa', authorize('ADMIN', 'SUPER_ADMIN'), getCooperativaProfitReport);

router.get('/expenses/:tripId', authorize('CHOFER', 'ADMIN', 'SUPER_ADMIN'), getTripExpenses);

export default router;
