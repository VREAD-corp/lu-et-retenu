// Adapted from VREAD-corp/acquiz@cdba4c0 src/lib/gen/schema.ts (Octave/Vin-CC for READ FRANCE SAS).
// The item contract and the item-level rules (itemProblems) are acquiz's; Lu et Retenu attaches each question to a
// SECTION of one of the customer's documents (one question per section, at least) instead of a course objective.
import { z } from "zod";

import { buildWordSet, normalizeAnswerForPresence } from "@read-france/reading-engine";

export const QuestionSchema = z.object({
  doc: z.number().int().min(1).max(3),
  section: z.number().int().min(1),
  type: z.enum(["word", "mcq"]),
  question: z.string().trim().min(10).max(400),
  /** For a 'word' answer, accepted alternatives are written "a|b" (acquiz scoring rule). */
  answer: z.string().trim().min(1).max(200),
  choices: z.array(z.string().trim().min(1).max(200)).min(3).max(4).nullable().optional(),
  source_quote: z.string().trim().min(8).max(600),
  /** What to re-read or explain when the answer is wrong (shown in the key, never to the reader). */
  explanation: z.string().trim().max(400).optional(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const DocumentSchema = z.object({
  doc: z.number().int().min(1).max(3),
  title: z.string().trim().min(3).max(160),
  sections: z.array(z.string().trim().min(3).max(160)).min(1).max(20),
});

export const DraftSchema = z.object({
  title: z.string().trim().min(3).max(160),
  /** Who receives the documents: « nouveaux salariés », « stagiaires »… (printed on the questionnaire). */
  audience: z.string().trim().min(3).max(120),
  /** Indicative mark in %, chosen by the customer; below it, the sections answered wrongly are reviewed together. */
  threshold: z.number().int().min(50).max(100),
  minutes: z.number().int().min(5).max(45),
  documents: z.array(DocumentSchema).min(1).max(3),
  items: z.array(QuestionSchema).min(8).max(20),
});
export type Draft = z.infer<typeof DraftSchema>;

/** Item-level rules the JSON schema cannot express. A failing item stops the build; nothing is repaired silently. */
export const itemProblems = (q: Question, ctx: { sectionCount: number }): string[] => {
  const problems: string[] = [];
  if (q.section > ctx.sectionCount) problems.push(`section ${q.section} hors plage`);
  if (q.type === "word") {
    // Vread rule (integrity.ts): ONE word, no whitespace. Hyphens/apostrophes allowed.
    if (q.answer.split("|").some((a) => /\s/.test(a.trim()))) problems.push("réponse en plusieurs mots");
    // Word-level, not substring: answer "C" must not match the "c" of "classe".
    if (q.answer.split("|").some((a) => buildWordSet(q.question).has(normalizeAnswerForPresence(a)))) problems.push("réponse contenue dans la question");
    if (q.choices && q.choices.length) problems.push("question à réponse libre avec des options");
  } else {
    const choices = q.choices ?? [];
    if (choices.length < 3) problems.push("QCM sans 3 à 4 options");
    const matches = choices.filter((c) => c.trim().toLowerCase() === q.answer.trim().toLowerCase()).length;
    if (matches !== 1) problems.push("la bonne réponse doit figurer exactement une fois parmi les options");
    if (new Set(choices.map((c) => c.trim().toLowerCase())).size !== choices.length) problems.push("options en double");
  }
  return problems;
};
