import { Router } from 'express';
import { embedQuestion } from '../controllers/chatController';

const router = Router();

// POST /api/chat/embed
// Body: { "question": "..." }
router.post('/embed', embedQuestion);

export default router;
