import { Router } from 'express';
import {
  getRanking,
  getHistorical,
  saveEventRule,
  getEventRule,
} from '../controllers/rankingController';
import { verifyToken } from '../middleware/auth';

const router = Router();

/**
 * GET /ranking?eventYear=2026
 * Get ranking for a given event year (with scoring)
 * Requires auth token
 */
router.get('/', verifyToken, getRanking);

/**
 * GET /ranking/historical?cedula=123456
 * Get historical rankings for a participant across all years
 * Requires auth token
 */
router.get('/historical', verifyToken, getHistorical);

/**
 * GET /ranking/rule?eventYear=2026
 * Get event rule for a given year
 * Requires auth token
 */
router.get('/rule', verifyToken, getEventRule);

/**
 * POST /ranking/rule
 * Save or update event rule for a given year
 * Body: { eventYear: number, diversityWeight: number, volumeWeight: number, tieBreaker: 'diversity' | 'volume' }
 * Requires auth token (admin only recommended, but not enforced here)
 */
router.post('/rule', verifyToken, saveEventRule);

export default router;
