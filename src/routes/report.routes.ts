import { Router } from 'express';
import { getReport, getDailySalesReport } from '../controllers/report.controller';
import { authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/reports:
 *   get:
 *     tags: [Reports]
 *     summary: Obtener reporte de ventas
 *     description: Genera reportes de ventas según filtros (ADMIN, SUPER_ADMIN)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *           enum: [summary, by-route, by-bus, detailed]
 *       - in: query
 *         name: routeId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: busId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: cooperativaId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Solo para SUPER_ADMIN
 *     responses:
 *       200:
 *         description: Reporte generado exitosamente
 */
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), getReport);

/**
 * @swagger
 * /api/reports/daily-sales:
 *   get:
 *     tags: [Reports]
 *     summary: Obtener reporte de ventas diarias
 *     description: Genera reporte de ventas agrupado por día (ADMIN, SUPER_ADMIN)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: cooperativaId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Solo para SUPER_ADMIN
 *     responses:
 *       200:
 *         description: Reporte diario generado exitosamente
 */
router.get('/daily-sales', authorize('ADMIN', 'SUPER_ADMIN'), getDailySalesReport);

export default router;
