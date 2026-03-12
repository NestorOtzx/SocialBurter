import { Router } from 'express';
import { login } from '../controllers/authController';

const router = Router();

/**
 * POST /auth/login
 * Login with username and password
 * Body: { username: string, password: string }
 * Response: { token: string, user: { username: string, role: 'monitor' | 'admin' } }
 */
router.post('/login', login);

export default router;
