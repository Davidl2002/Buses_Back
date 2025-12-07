import { Router, RequestHandler } from 'express';
import prisma from '../config/database';
import {
  validateQR,
  getPassengerManifest,
  createTripExpense,
  getTripExpenses,
  getMyExpenses,
  updateExpense,
  deleteExpense,
  getExpenseReceipt,
  getTripProfitReport,
  getCooperativaProfitReport
} from '../controllers/operations.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/operations/test-qr:
 *   post:
 *     tags: [Operaciones]
 *     summary: Test QR code (debug)
 *     description: Prueba el QR code sin validaciones de fecha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Información del ticket
 */
router.post('/test-qr', async (req, res) => {
  try {
    let { qrCode } = req.body;
    if (qrCode) qrCode = qrCode.trim();
    
    console.log('🧪 Testing QR:', qrCode);
    
    const ticket = await prisma.ticket.findUnique({
      where: { qrCode },
      include: {
        trip: {
          include: {
            frequency: {
              include: { route: true }
            }
          }
        }
      }
    });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket no encontrado',
        qrCodeReceived: qrCode
      });
    }
    
    // Comparar fechas como strings para evitar problemas de zona horaria
    const getTodayString = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const getDateString = (date: Date) => {
      // Usar getUTCFullYear, getUTCMonth, getUTCDate para obtener la fecha en UTC
      const d = new Date(date);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = getTodayString();
    const tripDateStr = getDateString(ticket.trip.date);
    
    res.json({
      success: true,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        isUsed: ticket.isUsed,
        passenger: ticket.passengerName,
        seatNumber: ticket.seatNumber,
        tripDate: tripDateStr,
        today: todayStr,
        sameDay: tripDateStr === todayStr
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

/**
 * @swagger
 * /api/operations/expenses/{tripId}:
 *   get:
 *     tags: [Operaciones]
 *     summary: Obtener gastos de un viaje específico
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
 *         description: Lista de gastos del viaje
 */
router.get('/expenses/:tripId', authorize('CHOFER', 'ADMIN', 'SUPER_ADMIN'), getTripExpenses);

/**
 * @swagger
 * /api/operations/my-expenses:
 *   get:
 *     tags: [Operaciones]
 *     summary: Obtener todos mis gastos registrados (Chofer)
 *     description: Obtiene todos los gastos que el chofer ha registrado en todos sus viajes
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los gastos del chofer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     expenses:
 *                       type: array
 *                     total:
 *                       type: number
 */
router.get('/my-expenses', authorize('CHOFER', 'ADMIN', 'SUPER_ADMIN'), getMyExpenses);

/**
 * @swagger
 * /api/operations/expenses/{id}:
 *   patch:
 *     tags: [Operaciones]
 *     summary: Editar un gasto
 *     description: Permite al chofer editar un gasto que registró
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [FUEL, TOLL, MAINTENANCE, FOOD, OTHER]
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Gasto actualizado
 *   delete:
 *     tags: [Operaciones]
 *     summary: Eliminar un gasto
 *     description: Permite al chofer eliminar un gasto que registró
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
 *         description: Gasto eliminado
 */
router.patch('/expenses/:id', authorize('CHOFER', 'ADMIN', 'SUPER_ADMIN'), updateExpense);
router.delete('/expenses/:id', authorize('CHOFER', 'ADMIN', 'SUPER_ADMIN'), deleteExpense);

/**
 * @swagger
 * /api/operations/expenses/{id}/receipt:
 *   get:
 *     tags: [Operaciones]
 *     summary: Ver comprobante de un gasto
 *     description: Obtiene la información y URL del comprobante de un gasto
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
 *         description: Información del comprobante
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     receipt:
 *                       type: string
 *                       description: URL del comprobante
 *                     type:
 *                       type: string
 *                     description:
 *                       type: string
 *                     amount:
 *                       type: number
 *       404:
 *         description: Gasto no encontrado o sin comprobante
 */
router.get('/expenses/:id/receipt', authorize('CHOFER', 'OFICINISTA', 'ADMIN', 'SUPER_ADMIN'), getExpenseReceipt);

export default router;
