// Vendored from VREAD-corp/acquiz@cdba4c0 src/lib/parse/pdf.ts (Octave/Vin-CC for READ FRANCE SAS; origin vread-workflow-def, same authors). Unmodified.
/**
 * PDF text extraction, adapted from vread-workflow-def `lib/pdf/parser.ts`.
 * Differences: no ISBN/metadata sniffing (books only), line breaks are KEPT so
 * the segmenter can split on the course's own headings ("Module 2 …").
 */
export type PdfText = { text: string; pages: number; title?: string };

export const normalizeExtractedText = (text: string) =>
  text
    .replace(/ /g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * pdf-parse concatenates adjacent table cells with no separator ("Gilet
 * orangeFerme la marche"), which hides words from the answer-presence gate.
 * A lowercase letter immediately followed by an uppercase one is treated as a
 * cell boundary. (Rare false splits such as "iPhone" are harmless here.)
 */
export const splitGluedCells = (text: string) => text.replace(/([a-zà-ÿ0-9%)])([A-ZÀ-Ý][a-zà-ÿ])/g, "$1 $2");

export const parsePdfBuffer = async (buffer: Uint8Array): Promise<PdfText> => {
  // The package entry point runs a self-test reading a fixture file when it is
  // not `require`d by a parent module; the lib path skips it.
  const mod = await import("pdf-parse/lib/pdf-parse.js");
  const pdfParse = (mod.default ?? mod) as (b: Buffer) => Promise<{
    text: string;
    numpages: number;
    info?: Record<string, unknown>;
  }>;
  const data = await pdfParse(Buffer.from(buffer));
  const title = typeof data.info?.Title === "string" ? data.info.Title.trim() : undefined;
  return { text: normalizeExtractedText(splitGluedCells(data.text)), pages: data.numpages, title: title || undefined };
};
