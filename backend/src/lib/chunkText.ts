export interface TextChunk {
  index: number;   // 0-based chunk number
  text: string;    // chunk content
  charStart: number; // start offset in the original full text
  charEnd: number;   // end offset in the original full text
}

export interface ChunkOptions {
  chunkSize?: number;  // characters per chunk  (default: 500)
  overlap?: number;    // overlapping characters (default: 100)
}

/**
 * Splits a plain-text string into fixed-size overlapping chunks.
 *
 * Algorithm:
 *  - Walk the text in steps of (chunkSize - overlap).
 *  - Each chunk is a slice of `chunkSize` characters starting at the current position.
 *  - Chunks are trimmed so leading/trailing whitespace doesn't eat into the
 *    content budget, but the char offsets reflect the original positions.
 */
export function chunkText(
  text: string,
  { chunkSize = 500, overlap = 100 }: ChunkOptions = {}
): TextChunk[] {
  if (chunkSize <= overlap) {
    throw new Error('chunkSize must be greater than overlap');
  }

  const chunks: TextChunk[] = [];
  const step = chunkSize - overlap;
  let index = 0;

  for (let start = 0; start < text.length; start += step) {
    const end = Math.min(start + chunkSize, text.length);
    const slice = text.slice(start, end);
    const trimmed = slice.trim();

    if (trimmed.length > 0) {
      chunks.push({
        index,
        text: trimmed,
        charStart: start,
        charEnd: end,
      });
      index++;
    }

    // Stop if we've consumed the whole string
    if (end === text.length) break;
  }

  return chunks;
}
