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

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: Listar tickets
 *     description: Obtiene todos los tickets (ADMIN, SUPER_ADMIN, OFICINISTA)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tickets
 */
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OFICINISTA'), getTickets);

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

/**
 * @swagger
 * /api/tickets/reserve-seat:
 *   post:
 *     tags: [Tickets]
 *     summary: Reservar asiento temporalmente
 *     description: Reserva un asiento por tiempo limitado antes del pago
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
 *     responses:
 *       200:
 *         description: Asiento reservado temporalmente
 */
router.post('/reserve-seat', reserveSeat);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     tags: [Tickets]
 *     summary: Obtener ticket por ID
 *     description: Obtiene detalles de un ticket específico
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
 *         description: Detalles del ticket
 */
router.get('/:id', authenticate, getTicketById);
/**
 * @swagger
 * /api/tickets/{id}/pdf:
 *   get:
 *     tags: [Tickets]
 *     summary: Descargar PDF del ticket
 *     description: Genera y descarga el PDF del ticket. Requiere autenticación.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del ticket
 *     responses:
 *       200:
 *         description: PDF del ticket
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 */
// Descargar PDF del ticket
router.get('/:id/pdf', authenticate, downloadTicketPdf);

/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   patch:
 *     tags: [Tickets]
 *     summary: Cancelar ticket
 *     description: Cancela un ticket y libera el asiento
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
 *         description: Ticket cancelado exitosamente
 */
router.patch('/:id/cancel', authenticate, cancelTicket);

/**
 * @swagger
 * /api/tickets/payment/paypal/initiate:
 *   post:
 *     tags: [Tickets]
 *     summary: Iniciar pago con PayPal
 *     description: Inicia el proceso de pago de un ticket con PayPal
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketId
 *             properties:
 *               ticketId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: URL de aprobación de PayPal
 */
router.post('/payment/paypal/initiate', authenticate, initiatePayPalPayment);

/**
 * @swagger
 * /api/tickets/payment/paypal/execute:
 *   post:
 *     tags: [Tickets]
 *     summary: Completar pago con PayPal
 *     description: Ejecuta y completa el pago con PayPal
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - payerId
 *             properties:
 *               paymentId:
 *                 type: string
 *               payerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pago completado exitosamente
 */
router.post('/payment/paypal/execute', authenticate, executePayPalPayment);

/**
 * @swagger
 * /api/tickets/payment/upload-proof:
 *   post:
 *     tags: [Tickets]
 *     summary: Subir comprobante de pago
 *     description: Permite subir un comprobante de pago para verificación manual
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - ticketId
 *               - paymentProof
 *             properties:
 *               ticketId:
 *                 type: string
 *                 format: uuid
 *               paymentProof:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Comprobante subido exitosamente
 */
router.post('/payment/upload-proof', authenticate, upload.single('paymentProof'), uploadPaymentProof);

export default router;
