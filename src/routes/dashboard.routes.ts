import { Router } from 'express';
import {
  getGlobalMetrics,
  getCooperativaMetrics,
  getFinancialReport,
  getBalanceByBus,
  getPendingPaymentVerifications,
  updatePaymentStatus
} from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// ============================================
// SUPER ADMIN - Métricas Globales
// ============================================

/**
 * @swagger
 * /api/dashboard/global:
 *   get:
 *     tags: [Dashboard]
 *     summary: Obtener métricas globales
 *     description: Obtiene métricas globales de toda la plataforma (Solo SUPER_ADMIN)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas globales
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
 *                     totalCooperativas:
 *                       type: number
 *                     totalBuses:
 *                       type: number
 *                     totalTickets:
 *                       type: number
 *                     totalRevenue:
 *                       type: number
 */
router.get(
  '/global',
  authenticate,
  authorize('SUPER_ADMIN'),
  getGlobalMetrics
);

// ============================================
// ADMIN - Dashboard de Cooperativa
// ============================================

/**
 * @swagger
 * /api/dashboard/cooperativa:
 *   get:
 *     tags: [Dashboard]
 *     summary: Obtener métricas de cooperativa
 *     description: Obtiene métricas y dashboard de la cooperativa del usuario
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas de la cooperativa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get(
  '/cooperativa',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  getCooperativaMetrics
);

/**
 * @swagger
 * /api/dashboard/financial-report:
 *   get:
 *     tags: [Dashboard]
 *     summary: Obtener reporte financiero
 *     description: Obtiene reporte financiero detallado de la cooperativa
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
 *         description: Reporte financiero
 */
router.get(
  '/financial-report',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  getFinancialReport
);

/**
 * @swagger
 * /api/dashboard/balance-by-bus:
 *   get:
 *     tags: [Dashboard]
 *     summary: Obtener balance por bus
 *     description: Obtiene balance de ingresos/gastos por bus
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Balance por bus
 */
router.get(
  '/balance-by-bus',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  getBalanceByBus
);

/**
 * @swagger
 * /api/dashboard/pending-payments:
 *   get:
 *     tags: [Dashboard]
 *     summary: Obtener pagos pendientes
 *     description: Obtiene tickets con pagos pendientes de verificación
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pagos pendientes
 */
router.get(
  '/pending-payments',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  getPendingPaymentVerifications
);

/**
 * @swagger
 * /api/dashboard/payment/{ticketId}:
 *   put:
 *     tags: [Dashboard]
 *     summary: Aprobar o rechazar pago
 *     description: Permite aprobar o rechazar un pago pendiente
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: Pago actualizado
 */
router.put(
  '/payment/:ticketId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  updatePaymentStatus
);

export default router;
