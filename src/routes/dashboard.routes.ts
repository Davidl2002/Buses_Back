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
 * @route   GET /api/dashboard/global
 * @desc    Obtener métricas globales de toda la plataforma
 * @access  Private - SUPER_ADMIN only
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
 * @route   GET /api/dashboard/cooperativa
 * @desc    Obtener métricas y dashboard de la cooperativa
 * @access  Private - ADMIN only
 */
router.get(
  '/cooperativa',
  authenticate,
  authorize('ADMIN'),
  getCooperativaMetrics
);

/**
 * @route   GET /api/dashboard/financial-report
 * @desc    Obtener reporte financiero detallado
 * @access  Private - ADMIN only
 */
router.get(
  '/financial-report',
  authenticate,
  authorize('ADMIN'),
  getFinancialReport
);

/**
 * @route   GET /api/dashboard/balance-by-bus
 * @desc    Obtener balance de ingresos/gastos por bus
 * @access  Private - ADMIN only
 */
router.get(
  '/balance-by-bus',
  authenticate,
  authorize('ADMIN'),
  getBalanceByBus
);

/**
 * @route   GET /api/dashboard/pending-payments
 * @desc    Obtener tickets con pagos pendientes de verificación
 * @access  Private - ADMIN only
 */
router.get(
  '/pending-payments',
  authenticate,
  authorize('ADMIN'),
  getPendingPaymentVerifications
);

/**
 * @route   PUT /api/dashboard/payment/:ticketId
 * @desc    Aprobar o rechazar un pago pendiente
 * @access  Private - ADMIN only
 */
router.put(
  '/payment/:ticketId',
  authenticate,
  authorize('ADMIN'),
  updatePaymentStatus
);

export default router;
