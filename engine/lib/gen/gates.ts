// Adapted from VREAD-corp/acquiz@cdba4c0 src/lib/gen/gates.ts (Octave/Vin-CC for READ FRANCE SAS).
// Kept: the STATIC gates (quote found, answer present, duplicates), same functions (the accent range is written as \\u escapes here).
// Removed: the LLM cold-answer gate (runColdGate) and its provider imports: Acquimètre has no LLM at runtime.
import { answerAppearsInText, buildWordSet } from "../ai/answer-presence";

/** Lowercase, no accents, typographic quotes unified, punctuation → single spaces. */
export const normalizeForMatch = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’‘ʼ´`]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Is the cited passage really in the segment? Exact match after normalisation,
 * or — to survive PDF line-break hyphenation — its first 6 words in sequence
 * plus ≥ 90% of its words present.
 */
export const quoteInText = (quote: string | null | undefined, text: string): boolean => {
  if (!quote) return false;
  const q = normalizeForMatch(quote);
  const t = normalizeForMatch(text);
  if (!q || q.split(" ").length < 3) return false;
  if (t.includes(q)) return true;
  const words = q.split(" ");
  const head = words.slice(0, 6).join(" ");
  if (!t.includes(head)) return false;
  const set = new Set(t.split(" "));
  return words.filter((w) => set.has(w)).length / words.length >= 0.9;
};

/** Token-set similarity (Jaccard) between two prompts. */
export const similarity = (a: string, b: string) => {
  const A = new Set(normalizeForMatch(a).split(" ").filter((w) => w.length > 2));
  const B = new Set(normalizeForMatch(b).split(" ").filter((w) => w.length > 2));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter += 1;
  return inter / (A.size + B.size - inter);
};

export const DUPLICATE_THRESHOLD = 0.7;

export const findDuplicate = (prompt: string, earlier: { id: string; prompt: string }[]): string | null =>
  earlier.find((e) => similarity(prompt, e.prompt) >= DUPLICATE_THRESHOLD)?.id ?? null;

export type StaticGates = { quoteFound: boolean; answerPresent: boolean | null; duplicateOf: string | null };

/** Static gates (no LLM call): quote, answer presence, duplicates. */
export const staticGates = (args: {
  type: "word" | "mcq";
  prompt: string;
  answer: string;
  sourceQuote: string | null;
  segmentText: string;
  earlier: { id: string; prompt: string }[];
}): StaticGates => ({
  quoteFound: quoteInText(args.sourceQuote, args.segmentText),
  answerPresent:
    args.type === "word"
      ? args.answer.split("|").some((alt) => answerAppearsInText(alt, buildWordSet(args.segmentText)))
      : null,
  duplicateOf: findDuplicate(args.prompt, args.earlier),
});
