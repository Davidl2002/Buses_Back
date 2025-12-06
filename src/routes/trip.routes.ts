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
  getRouteSheet,
  getRouteSheetPDF
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
/**
 * @swagger
 * /api/trips/cities/origins:
 *   get:
 *     tags: [Viajes]
 *     summary: Obtener ciudades de origen disponibles
 *     description: Devuelve la lista de ciudades origen que tienen viajes programados en fechas futuras.
 *     responses:
 *       200:
 *         description: Lista de ciudades
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
 *                     type: string
 */
router.get('/cities/origins', getOriginCities);

/**
 * @swagger
 * /api/trips/cities/destinations:
 *   get:
 *     tags: [Viajes]
 *     summary: Obtener ciudades de destino para un origen
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *         description: Ciudad de origen
 *     responses:
 *       200:
 *         description: Lista de destinos
 */
router.get('/cities/destinations', getDestinationCities);

/**
 * @swagger
 * /api/trips/dates/available:
 *   get:
 *     tags: [Viajes]
 *     summary: Obtener fechas disponibles para una ruta
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fechas disponibles (YYYY-MM-DD)
 */
router.get('/dates/available', getAvailableDates);

/**
 * @swagger
 * /api/trips/{id}/seats:
 *   get:
 *     tags: [Viajes]
 *     summary: Obtener mapa de asientos de un viaje
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del viaje
 *     responses:
 *       200:
 *         description: Mapa de asientos y estado
 */
router.get('/:id/seats', getTripSeats); // Layout de asientos (público)

/**
 * @swagger
 * /api/trips/public/{id}:
 *   get:
 *     tags: [Viajes]
 *     summary: Obtener detalle público de un viaje
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalle del viaje (público)
 */
router.get('/public/:id', getPublicTripById); // Detalle público de viaje

// Rutas protegidas
router.use(authenticate);

router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), createTrip);

// Hoja de ruta por grupo y fecha
router.get('/route-sheet', authorize('ADMIN', 'SUPER_ADMIN'), getRouteSheet);
router.get('/route-sheet/pdf', authorize('ADMIN', 'SUPER_ADMIN'), getRouteSheetPDF);

router.get('/', getTrips);
router.get('/:id', getTripById);
router.patch('/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateTrip);
router.patch('/:id/status', authorize('ADMIN', 'CHOFER', 'SUPER_ADMIN'), updateTripStatus);
router.patch('/:id/personnel', authorize('ADMIN', 'SUPER_ADMIN'), assignPersonnel);

export default router;
