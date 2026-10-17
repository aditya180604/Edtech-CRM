import { Router } from 'express';
import { WebinarsController } from './webinars.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.js';

const router = Router();

// Public Webinar Discovery Routes (with optional user context for registration status)
router.get('/upcoming', optionalAuthenticate, WebinarsController.getUpcoming);
router.get('/', optionalAuthenticate, WebinarsController.getCatalog);

// Live Webinar Classroom & LiveKit Real-Time Routes
router.get('/room/:roomCode', optionalAuthenticate, WebinarsController.getLiveRoom);
router.post('/room/:roomCode/lobby/join', authenticate, WebinarsController.joinWebinarLobby);
router.get('/room/:roomCode/lobby', authenticate, WebinarsController.getWebinarLobbyState);
router.post('/room/:roomCode/admit/:userId', authenticate, WebinarsController.admitWebinarStudent);
router.post('/room/:roomCode/token', authenticate, WebinarsController.getLiveKitToken);
router.post('/room/:roomCode/start', authenticate, WebinarsController.startWebinar);
router.post('/room/:roomCode/end', authenticate, WebinarsController.endWebinar);
router.post('/room/:roomCode/restart', authenticate, WebinarsController.restartWebinar);
router.post('/room/:roomCode/chat', authenticate, WebinarsController.sendChatMessage);
router.post('/room/:roomCode/qa', authenticate, WebinarsController.submitQuestion);
router.post('/room/:roomCode/qa/:qaId/upvote', authenticate, WebinarsController.toggleUpvoteQuestion);
router.post('/room/:roomCode/qa/:qaId/answer', authenticate, WebinarsController.answerQuestion);
router.post('/room/:roomCode/raise-hand', authenticate, WebinarsController.toggleRaiseHand);
router.post('/room/:roomCode/allow-speak', authenticate, WebinarsController.allowStudentSpeak);
router.post('/room/:roomCode/notes', authenticate, WebinarsController.saveUserNotes);
router.post('/room/:roomCode/leave', optionalAuthenticate, WebinarsController.recordAttendanceLeave);
router.post('/room/:roomCode/broadcast-state', optionalAuthenticate, WebinarsController.updateBroadcastState);
router.post('/room/:roomCode/signal', optionalAuthenticate, WebinarsController.sendSignal);
router.get('/room/:roomCode/signal', optionalAuthenticate, WebinarsController.getSignals);
router.post('/room/:roomCode/reopen', optionalAuthenticate, WebinarsController.reopenOrRejoinRoom);

// Details & Student / User Registration Endpoints
router.get('/:id', optionalAuthenticate, WebinarsController.getDetails);
router.post('/:id/register', authenticate, WebinarsController.register);
router.post('/:id/checkout', authenticate, WebinarsController.createCheckoutOrder);
router.post('/:id/verify-payment', authenticate, WebinarsController.verifyPayment);

export const webinarsRoutes = router;
