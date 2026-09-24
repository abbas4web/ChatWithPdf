import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import documentsRouter from './routes/documents';
import chatRouter from './routes/chat';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/chat', chatRouter);

app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
});

export default app;
