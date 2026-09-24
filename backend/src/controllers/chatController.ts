import { Request, Response } from 'express';
import { embedText } from '../lib/embedText';

export const embedQuestion = async (req: Request, res: Response): Promise<void> => {
  const { question } = req.body as { question?: string };

  if (!question || question.trim().length === 0) {
    res.status(400).json({ status: 'error', message: 'question is required' });
    return;
  }

  const embedding = await embedText(question.trim());

  res.status(200).json({
    status: 'ok',
    question: question.trim(),
    embedding: {
      dimensions: embedding.length,
      first_5_values: embedding.slice(0, 5),
    },
  });
};
