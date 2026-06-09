/**
 * Digital-PDF text-layer extraction (no API, no vision, no native deps).
 *
 * DISCOM-portal PDFs are typically born-digital and carry a real text layer —
 * we read it locally with pdf-parse (pure JS) and hand the text to a cheap text
 * model, skipping vision entirely. Scanned/photographed PDFs have no usable text
 * layer; `hasUsableText` returns false for those so the caller falls back to the
 * vision path.
 */

import pdfParse from "pdf-parse/lib/pdf-parse.js";

/** Extract the embedded text layer; returns "" on encrypted/corrupt/imageful PDFs. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const { text } = await pdfParse(buffer);
    return (text ?? "").trim();
  } catch {
    return "";
  }
}

/**
 * Heuristic: does this look like a real text layer (vs. a scan that yielded a
 * few stray glyphs)? Bills are number-dense, so we require a reasonable amount
 * of text AND the presence of digits.
 */
export function hasUsableText(text: string): boolean {
  const nonSpace = text.replace(/\s/g, "");
  return nonSpace.length >= 120 && /\d/.test(text);
}
