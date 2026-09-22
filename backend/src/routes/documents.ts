import { Router } from 'express';
import upload from '../middleware/upload';
import { uploadDocument } from '../controllers/documentController';

const router = Router();

// POST /api/documents/upload
// Content-Type: multipart/form-data
// Field: file (PDF only, max 50 MB)
router.post('/upload', upload.single('file'), uploadDocument);

export default router;
