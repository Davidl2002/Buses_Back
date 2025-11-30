import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { searchUsers } from '../controllers/staff.controller';

const router = Router();

// Buscar usuarios por cédula o email (ej: /api/users?cedula=123...)
router.get('/', authenticate, searchUsers);

export default router;
