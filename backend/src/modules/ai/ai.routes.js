import { Router } from 'express';
import { AiController } from './ai.controller.js';
import { optionalAuthenticate } from '../../middleware/auth.js';
import { rateLimit } from '../../middleware/rateLimit.js';

const router = Router();

// In-Classroom AI Tutor is available for all enrolled / previewing students
// Each call is a paid Gemini request: cap per IP.
router.post('/tutor', rateLimit({ name: 'ai-tutor', windowMs: 60 * 1000, max: 20 }), optionalAuthenticate, AiController.askTutor);

export const aiRoutes = router;
