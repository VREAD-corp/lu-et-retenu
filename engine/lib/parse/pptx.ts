// PPTX → text, one block per slide (« Diapositive N »), speaker notes included. New in Acquimètre (Octave for
// READ FRANCE SAS): acquiz only read PDF and DOCX. A .pptx is a ZIP of XML parts; the text runs are <a:t> elements.
import JSZip from "jszip";

import { normalizeExtractedText } from "./pdf";

const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, "&");

/** Paragraph texts of a DrawingML part: <a:p> … <a:t>text</a:t> … </a:p>. */
export const drawingParagraphs = (xml: string): string[] =>
  (xml.match(/<a:p\b[\s\S]*?<\/a:p>/g) ?? [])
    .map((p) => (p.match(/<a:t>([\s\S]*?)<\/a:t>/g) ?? []).map((t) => decode(t.replace(/<\/?a:t>/g, ""))).join(""))
    .map((t) => t.trim())
    .filter(Boolean);

export type PptxText = { text: string; slides: { n: number; text: string }[] };

export const parsePptxBuffer = async (buffer: Uint8Array): Promise<PptxText> => {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .map((f) => /^ppt\/slides\/slide(\d+)\.xml$/.exec(f))
    .filter((m): m is RegExpExecArray => !!m)
    .sort((a, b) => Number(a[1]) - Number(b[1]));
  if (!slideFiles.length) throw new Error("PPTX sans diapositive lisible.");
  const slides: { n: number; text: string }[] = [];
  for (const [i, m] of slideFiles.entries()) {
    const body = drawingParagraphs(await zip.file(m[0])!.async("string"));
    const notesFile = zip.file(`ppt/notesSlides/notesSlide${m[1]}.xml`);
    const notes = notesFile ? drawingParagraphs(await notesFile.async("string")).filter((t) => !/^\d+$/.test(t)) : [];
    slides.push({ n: i + 1, text: normalizeExtractedText([...body, ...(notes.length ? ["Notes : " + notes.join(" ")] : [])].join("\n")) });
  }
  return { text: normalizeExtractedText(slides.map((s) => `Diapositive ${s.n}\n${s.text}`).join("\n\n")), slides };
};
