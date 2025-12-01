import { Router } from 'express';
import {
  reserveSeat,
  createTicket,
  getTickets,
  initiatePayPalPayment,
  executePayPalPayment,
  uploadPaymentProof,
  getSeatMap,
  getMyTickets,
  getTicketById,
  cancelTicket
} from '../controllers/ticket.controller';
import { downloadTicketPdf } from '../controllers/ticket.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

/**
 * @swagger
 * /api/tickets/seat-map/{tripId}:
 *   get:
 *     tags: [Tickets]
 *     summary: Obtener mapa de asientos de un viaje
 *     description: Muestra los asientos disponibles y ocupados de un viaje específico
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del viaje
 *     responses:
 *       200:
 *         description: Mapa de asientos
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
 *                     seatLayout:
 *                       type: object
 *                     occupiedSeats:
 *                       type: array
 *                       items:
 *                         type: number
 */
router.get('/seat-map/:tripId', getSeatMap);

// List tickets (ADMIN, SUPER_ADMIN)
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getTickets);

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     tags: [Tickets]
 *     summary: Crear ticket
 *     description: Crea un nuevo ticket para un viaje
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tripId
 *               - seatNumber
 *             properties:
 *               tripId:
 *                 type: string
 *                 format: uuid
 *               seatNumber:
 *                 type: number
 *               originStopIndex:
 *                 type: number
 *               destinationStopIndex:
 *                 type: number
 *               passengerName:
 *                 type: string
 *               passengerCedula:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket creado
 *       400:
 *         description: Asiento no disponible
 */
// Crear ticket (boletería / cliente)
router.post('/', authenticate, createTicket);
// Ruta legacy/alias que algunos frontends usan
router.post('/create', authenticate, createTicket);

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: Obtener mis tickets
 *     description: Lista todos los tickets del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tickets
 */
router.get('/my-tickets', authenticate, getMyTickets);

router.post('/reserve-seat', reserveSeat);
router.get('/:id', authenticate, getTicketById);
// Descargar PDF del ticket
router.get('/:id/pdf', authenticate, downloadTicketPdf);
router.patch('/:id/cancel', authenticate, cancelTicket);

// Pagos
router.post('/payment/paypal/initiate', authenticate, initiatePayPalPayment);
router.post('/payment/paypal/execute', authenticate, executePayPalPayment);
router.post('/payment/upload-proof', authenticate, upload.single('paymentProof'), uploadPaymentProof);

export default router;
