import fs from 'fs';
import pdfParse from 'pdf-parse';

export interface PagePreview {
  page: number;
  preview: string;
}

export interface PdfExtractResult {
  totalPages: number;
  totalChars: number;
  fullText: string;             // full extracted text, held in memory
  pagesPreviews: PagePreview[]; // first 300 chars per page
}

/**
 * Reads a PDF from disk and extracts its full text using pdf-parse.
 *
 * pdf-parse returns the entire text in one string and the total page count.
 * We split on the form-feed character (\f) that pdfjs inserts between pages
 * to reconstruct per-page text for the preview.
 */
export async function extractPdfText(filePath: string): Promise<PdfExtractResult> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  const fullText = data.text;
  const totalPages = data.numpages;

  // pdf-parse separates pages with \f (form feed) in the combined text
  const rawPages = fullText.split('\f');

  // Pad or trim to match actual page count reported by the library
  const pageTexts: string[] = Array.from({ length: totalPages }, (_, i) =>
    (rawPages[i] ?? '').trim()
  );

  const pagesPreviews: PagePreview[] = pageTexts.map((text, i) => ({
    page: i + 1,
    preview: text.slice(0, 300).trim(),
  }));

  return {
    totalPages,
    totalChars: fullText.length,
    fullText,
    pagesPreviews,
  };
}
