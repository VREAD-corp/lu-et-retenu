// Adapted from VREAD-corp/acquiz@cdba4c0 src/lib/parse/index.ts (Octave/Vin-CC for READ FRANCE SAS).
// Changes: PPTX support (pptx.ts), and every file keeps its "places" (PDF pages, PPTX slides, DOCX = whole
// document) so that each question can cite where its source passage is (« p. 4 », « diapositive 7 »).
import { createHash } from "node:crypto";

import { parseDocxBuffer } from "./docx";
import { normalizeExtractedText, parsePdfBuffer, splitGluedCells } from "./pdf";
import { parsePptxBuffer } from "./pptx";
import { segmentCourse, type Segment } from "./segmenter";

export type Place = { label: string; text: string };
export type ParsedFile = {
  kind: "pdf" | "docx" | "pptx" | "text";
  text: string;
  sha256: string;
  wordCount: number;
  pages?: number;
  titleHint?: string;
  places: Place[];
  segments: Segment[];
};

export const MAX_WORDS = 60_000; // ≈ 200 pages: acquiz MVP_SPEC limit.

export const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");

export const detectKind = (filename: string, bytes: Uint8Array): ParsedFile["kind"] => {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf"; // %PDF
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && /\.docx$/i.test(filename)) return "docx"; // ZIP + .docx
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && /\.pptx$/i.test(filename)) return "pptx"; // ZIP + .pptx
  if (/\.(txt|md)$/i.test(filename)) return "text";
  throw new Error(`Format non pris en charge (${filename}) : PDF, DOCX, PPTX ou texte.`);
};

/** One text per PDF page (pdf-parse page callback), with the same cleaning as the whole text. */
const pdfPages = async (buffer: Uint8Array): Promise<string[]> => {
  const mod = await import("pdf-parse/lib/pdf-parse.js");
  const pdfParse = (mod.default ?? mod) as (b: Buffer, o: Record<string, unknown>) => Promise<unknown>;
  const pages: string[] = [];
  await pdfParse(Buffer.from(buffer), {
    pagerender: async (page: { pageIndex: number; getTextContent: (o: Record<string, boolean>) => Promise<{ items: { str: string; transform: number[] }[] }> }) => {
      const tc = await page.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false });
      let lastY: number | undefined;
      let text = "";
      for (const item of tc.items) {
        text += lastY === undefined || lastY === item.transform[5] ? item.str : "\n" + item.str;
        lastY = item.transform[5];
      }
      pages[page.pageIndex] = normalizeExtractedText(splitGluedCells(text));
      return text;
    },
  });
  return pages.map((p) => p ?? "");
};

/** Customer-uploaded documents ONLY: no fetch, search or download path here. */
export const parseFile = async (filename: string, bytes: Uint8Array, options: { segmentWordCount?: number } = {}): Promise<ParsedFile> => {
  const kind = detectKind(filename, bytes);
  let text: string;
  let pages: number | undefined;
  let titleHint: string | undefined;
  let places: Place[];
  if (kind === "pdf") {
    ({ text, pages, title: titleHint } = await parsePdfBuffer(bytes));
    places = (await pdfPages(bytes)).map((t, i) => ({ label: `p. ${i + 1}`, text: t }));
  } else if (kind === "docx") {
    ({ text } = await parseDocxBuffer(bytes));
    places = [{ label: "document", text }];
  } else if (kind === "pptx") {
    const r = await parsePptxBuffer(bytes);
    text = r.text;
    places = r.slides.map((s) => ({ label: `diapositive ${s.n}`, text: s.text }));
  } else {
    text = normalizeExtractedText(new TextDecoder().decode(bytes));
    places = [{ label: "document", text }];
  }
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 30) throw new Error(`${filename} : trop peu de texte exploitable (PDF scanné ?).`);
  if (wordCount > MAX_WORDS) throw new Error(`${filename} : document trop long (${wordCount} mots, maximum ${MAX_WORDS}).`);
  return { kind, text, sha256: sha256(bytes), wordCount, pages, titleHint, places, segments: segmentCourse(text, options) };
};
