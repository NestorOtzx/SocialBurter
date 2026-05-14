import { Router } from 'express';
import {
  findByCedula,
  upsertParticipant,
  addContributions,
  getContributions,
  listParticipants,
  listContributions,
  deleteParticipant,
  deleteContribution,
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
router.delete('/contributions/:id', verifyToken, deleteContribution);
router.delete('/:cedula', verifyToken, deleteParticipant);

export default router;
