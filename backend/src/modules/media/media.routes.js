import { Router } from 'express';
import { MediaController } from './media.controller.js';

const router = Router();

// Public course images / syllabus files decoded from inline data URIs
router.get('/courses/:id/:kind', MediaController.getCourseMedia);
router.get('/users/:id/avatar', MediaController.getUserAvatar);

export const mediaRoutes = router;
