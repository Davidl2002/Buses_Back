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

// GET público para usar en comboboxs
router.get('/', getCities);
router.get('/:id', getCityById);

// Rutas protegidas
router.post('/', authenticate, createCity);
router.put('/:id', authenticate, updateCity);
router.delete('/:id', authenticate, deleteCity);

export default router;
