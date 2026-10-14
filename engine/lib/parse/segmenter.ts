// Vendored from VREAD-corp/acquiz@cdba4c0 src/lib/parse/segmenter.ts (Octave/Vin-CC for READ FRANCE SAS; origin vread-workflow-def, same authors). Unmodified.
/**
 * Segmentation, adapted from vread-workflow-def `lib/epub/segmenter.ts`.
 *
 * A novel is cut every 10,000 words; a training support is much shorter and
 * structured, so here:
 * 1. the text is split on the support's own headings (Module / Chapitre /
 *    Partie / Séquence / Section N, markdown `#`, "2.3 Titre" lines; plain
 *    "2. …" lines are NOT headings: in real supports they are list items);
 * 2. consecutive small sections are packed together up to `segmentWordCount`
 *    (default 2,000 words, per MVP_SPEC §1.1);
 * 3. a section longer than that is cut by word count (the original algorithm).
 */
export type Segment = { index: number; heading: string | null; wordCount: number; text: string };

export const DEFAULT_SEGMENT_WORDS = 2000;

const HEADING_RE =
  /^(?:#{1,3}\s+\S.*|(?:[Mm]odule|MODULE|[Cc]hapitre|CHAPITRE|[Pp]artie|PARTIE|[Ss]équence|[Ss]ection|[Uu]nité|[Ll]eçon)\s+[0-9IVX]+\b.{0,100}|\d{1,2}\.\d{1,2}\.?\s+[A-ZÀ-Ý][^.!?]{2,90})$/;

export const isHeadingLine = (line: string) => {
  const trimmed = line.trim();
  return trimmed.length > 0 && trimmed.length <= 110 && HEADING_RE.test(trimmed);
};

const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

type Section = { heading: string | null; lines: string[] };

export const splitSections = (text: string): Section[] => {
  const sections: Section[] = [{ heading: null, lines: [] }];
  for (const line of text.split("\n")) {
    if (isHeadingLine(line)) {
      sections.push({ heading: line.trim().replace(/^#+\s*/, ""), lines: [line.trim()] });
    } else {
      sections.at(-1)!.lines.push(line);
    }
  }
  return sections.filter((s) => countWords(s.lines.join(" ")) > 0);
};

const chunkWords = (text: string, size: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += size) chunks.push(words.slice(i, i + size).join(" "));
  return chunks;
};

export const segmentCourse = (
  text: string,
  options: { segmentWordCount?: number } = {}
): Segment[] => {
  const size = options.segmentWordCount ?? DEFAULT_SEGMENT_WORDS;
  const out: { heading: string | null; text: string }[] = [];
  let current: { headings: string[]; parts: string[]; words: number } | null = null;

  // A packed segment is labelled with its first and last section headings.
  const flush = () => {
    if (current && current.words > 0) {
      const h = current.headings;
      const heading = h.length === 0 ? null : h.length === 1 ? h[0] : `${h[0]} … ${h[h.length - 1]}`;
      out.push({ heading, text: current.parts.join("\n").trim() });
    }
    current = null;
  };

  for (const section of splitSections(text)) {
    const body = section.lines.join("\n").trim();
    const words = countWords(body);
    if (words > size) {
      flush();
      chunkWords(body, size).forEach((chunk, i) =>
        out.push({ heading: section.heading ? `${section.heading}${i ? ` (suite ${i})` : ""}` : null, text: chunk })
      );
      continue;
    }
    if (current && current.words + words > size) flush();
    if (!current) current = { headings: [], parts: [], words: 0 };
    if (section.heading) current.headings.push(section.heading);
    current.parts.push(body);
    current.words += words;
  }
  flush();

  return out.map((s, index) => ({ index, heading: s.heading, wordCount: countWords(s.text), text: s.text }));
};
