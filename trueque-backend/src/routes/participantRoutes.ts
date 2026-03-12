import { Router } from 'express';
import {
  findByCedula,
  upsertParticipant,
  addContributions,
  getContributions,
  listParticipants,
  listContributions,
} from '../controllers/participantController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Static routes MUST come before /:id routes
router.get('/by-cedula', verifyToken, findByCedula);
router.get('/contributions', verifyToken, listContributions);
router.get('/', verifyToken, listParticipants);
router.post('/', verifyToken, upsertParticipant);
router.post('/:id/contributions', verifyToken, addContributions);
router.get('/:id/contributions', verifyToken, getContributions);

export default router;
