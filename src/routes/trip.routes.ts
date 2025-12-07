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
 * /api/trips/available-dates:
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
router.get('/available-dates', getAvailableDates);

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

/**
 * @swagger
 * /api/trips:
 *   post:
 *     tags: [Viajes]
 *     summary: Crear viaje
 *     description: Crea un nuevo viaje programado
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - frequencyId
 *               - busId
 *               - date
 *             properties:
 *               frequencyId:
 *                 type: string
 *                 format: uuid
 *               busId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               driverId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Viaje creado
 *   get:
 *     tags: [Viajes]
 *     summary: Listar viajes
 *     description: Obtiene todos los viajes (filtrado por cooperativa)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de viajes
 */
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), createTrip);

/**
 * @swagger
 * /api/trips/route-sheet:
 *   get:
 *     tags: [Viajes]
 *     summary: Obtener hoja de ruta
 *     description: Obtiene la hoja de ruta de viajes por grupo y fecha
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busGroupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Hoja de ruta
 */
router.get('/route-sheet', authorize('ADMIN', 'SUPER_ADMIN'), getRouteSheet);

/**
 * @swagger
 * /api/trips/route-sheet/pdf:
 *   get:
 *     tags: [Viajes]
 *     summary: Descargar hoja de ruta en PDF
 *     description: Genera y descarga la hoja de ruta en formato PDF
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busGroupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: PDF de hoja de ruta
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/route-sheet/pdf', authorize('ADMIN', 'SUPER_ADMIN'), getRouteSheetPDF);

router.get('/', getTrips);

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     tags: [Viajes]
 *     summary: Obtener viaje por ID
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
 *         description: Detalles del viaje
 *   patch:
 *     tags: [Viajes]
 *     summary: Actualizar viaje
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               busId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Viaje actualizado
 */
router.get('/:id', getTripById);
router.patch('/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateTrip);

/**
 * @swagger
 * /api/trips/{id}/status:
 *   patch:
 *     tags: [Viajes]
 *     summary: Actualizar estado del viaje
 *     description: Permite cambiar el estado del viaje (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
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
 *                 enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch('/:id/status', authorize('ADMIN', 'CHOFER', 'SUPER_ADMIN'), updateTripStatus);

/**
 * @swagger
 * /api/trips/{id}/personnel:
 *   patch:
 *     tags: [Viajes]
 *     summary: Asignar personal al viaje
 *     description: Asigna chofer y otros empleados al viaje
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               driverId:
 *                 type: string
 *                 format: uuid
 *               assistantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Personal asignado
 */
router.patch('/:id/personnel', authorize('ADMIN', 'SUPER_ADMIN'), assignPersonnel);

export default router;
