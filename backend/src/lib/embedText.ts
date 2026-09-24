import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

const MODEL_ID   = 'Xenova/bge-m3';
const DIMENSIONS = 1024;

// Singleton — model is loaded once and reused for all subsequent calls
let extractor: FeatureExtractionPipeline | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    console.log(`[embedText] Loading model ${MODEL_ID} (first run downloads & caches ~2.3 GB)...`);
    extractor = await pipeline('feature-extraction', MODEL_ID);
    console.log('[embedText] Model ready.');
  }
  return extractor;
}

/**
 * Generates a 1024-dimensional embedding for the given text using BAAI/bge-m3.
 * Returns a plain number[] so it can be stored directly in pgvector.
 */
export async function embedText(text: string): Promise<number[]> {
  const model = await getExtractor();

  // pooling:'cls' uses the [CLS] token representation (standard for bge-m3)
  // normalize:true ensures unit-length vectors (required for cosine similarity)
  const output = await model(text, { pooling: 'cls', normalize: true });

  // output.tolist() → number[][] (one row per input string)
  const vectors = output.tolist() as number[][];
  const embedding = vectors[0];

  if (embedding.length !== DIMENSIONS) {
    throw new Error(
      `Expected ${DIMENSIONS}-dimensional embedding, got ${embedding.length}`
    );
  }

  return embedding;
}
