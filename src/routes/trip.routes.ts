import { Router } from 'express';
import {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  updateTripStatus,
  assignPersonnel,
  searchTrips,
  getOriginCities,
  getDestinationCities,
  getAvailableDates,
  getTripSeats,
  getPublicTripById,
  getRouteSheet
} from '../controllers/trip.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/trips/search:
 *   get:
 *     tags: [Viajes]
 *     summary: Buscar viajes disponibles (público)
 *     description: Busca viajes por origen, destino y fecha. No requiere autenticación.
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *         description: Ciudad de origen
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *         description: Ciudad de destino
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha del viaje (YYYY-MM-DD)
 *       - in: query
 *         name: passengers
 *         schema:
 *           type: number
 *           default: 1
 *         description: Número de pasajeros
 *     responses:
 *       200:
 *         description: Lista de viajes disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trip'
 */
router.get('/search', searchTrips);

// Nuevas rutas públicas para el frontend
router.get('/cities/origins', getOriginCities);
router.get('/cities/destinations', getDestinationCities);
router.get('/dates/available', getAvailableDates);
router.get('/:id/seats', getTripSeats); // Layout de asientos (público)
router.get('/public/:id', getPublicTripById); // Detalle público de viaje

// Rutas protegidas
router.use(authenticate);

router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), createTrip);

// Hoja de ruta por grupo y fecha
router.get('/route-sheet', authorize('ADMIN', 'SUPER_ADMIN'), getRouteSheet);

router.get('/', getTrips);
router.get('/:id', getTripById);
router.patch('/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateTrip);
router.patch('/:id/status', authorize('ADMIN', 'CHOFER', 'SUPER_ADMIN'), updateTripStatus);
router.patch('/:id/personnel', authorize('ADMIN', 'SUPER_ADMIN'), assignPersonnel);

export default router;
