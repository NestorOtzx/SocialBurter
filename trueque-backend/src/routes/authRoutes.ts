import { Router } from 'express';
import { login, changePassword } from '../controllers/authController';
import { verifyToken } from '../middleware/auth';

const router = Router();

/**
 * POST /auth/login
 * Login with username and password
 * Body: { username: string, password: string }
 * Response: { token: string, user: { username: string, role: 'monitor' | 'admin' } }
 */
router.post('/login', login);

/**
 * POST /auth/change-password
 * Change the authenticated user's password
 * Body: { currentPassword: string, newPassword: string }
 * Response: { message: string }
 */
router.post('/change-password', verifyToken, changePassword);

export default router;
