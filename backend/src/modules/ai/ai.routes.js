import { Router } from 'express';
import { AiController } from './ai.controller.js';
import { optionalAuthenticate } from '../../middleware/auth.js';

const router = Router();

// In-Classroom AI Tutor is available for all enrolled / previewing students
router.post('/tutor', optionalAuthenticate, AiController.askTutor);

export const aiRoutes = router;
