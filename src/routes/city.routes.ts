import { Router } from 'express';
import {
  getCities,
  getCityById,
  createCity,
  updateCity,
  deleteCity
} from '../controllers/city.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/cities:
 *   get:
 *     tags: [Ciudades]
 *     summary: Listar ciudades
 *     description: Obtiene todas las ciudades disponibles (ruta pública)
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       province:
 *                         type: string
 *   post:
 *     tags: [Ciudades]
 *     summary: Crear ciudad
 *     description: Crea una nueva ciudad
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - province
 *             properties:
 *               name:
 *                 type: string
 *               province:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ciudad creada
 */
router.get('/', getCities);

/**
 * @swagger
 * /api/cities/{id}:
 *   get:
 *     tags: [Ciudades]
 *     summary: Obtener ciudad por ID
 *     description: Obtiene una ciudad específica (ruta pública)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Datos de la ciudad
 *   put:
 *     tags: [Ciudades]
 *     summary: Actualizar ciudad
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
 *               name:
 *                 type: string
 *               province:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ciudad actualizada
 *   delete:
 *     tags: [Ciudades]
 *     summary: Eliminar ciudad
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
 *         description: Ciudad eliminada
 */
router.get('/:id', getCityById);
router.post('/', authenticate, createCity);
router.put('/:id', authenticate, updateCity);
router.delete('/:id', authenticate, deleteCity);

export default router;
