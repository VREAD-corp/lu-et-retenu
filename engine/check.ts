// Step 2 of the offline fulfilment: work/draft.json (written offline by Octave, no LLM at runtime) is checked against
// the customer's own documents with acquiz's static gates. Nothing is repaired silently: any failure stops the build.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { answerAppearsInText, buildWordSet } from "./lib/ai/answer-presence";
import { findDuplicate, quoteInText } from "./lib/gen/gates";
import { DraftSchema, itemProblems, type Draft, type Question } from "./lib/gen/schema";
import { docId, type DocExtract } from "./extract";

export const MIN_ITEMS = 8;
export const MAX_ITEMS = 20;

export type CheckedItem = Question & {
  id: string;
  source: { file: string; place: string } | null;
  gates: { schema: boolean; quoteFound: boolean; answerPresent: boolean | null; duplicateOf: string | null };
  problems: string[];
};
export type CheckReport = { ok: boolean; items: CheckedItem[]; problems: string[]; counts: { items: number; documents: number; sections: number } };

/** First file/place (PDF page, slide, document) of THAT document whose text contains the quote. */
export function locateQuote(quote: string, ex: DocExtract): { file: string; place: string; text: string } | null {
  for (const f of ex.files) for (const p of f.places) if (quoteInText(quote, p.text)) return { file: f.file, place: p.label, text: p.text };
  for (const f of ex.files) {
    for (let i = 0; i + 1 < f.places.length; i++) {
      const two = f.places[i]!.text + "\n" + f.places[i + 1]!.text;
      if (quoteInText(quote, two)) return { file: f.file, place: `${f.places[i]!.label}-${f.places[i + 1]!.label.replace(/^p\. /, "")}`, text: two };
    }
  }
  return null;
}

export const readDraft = (dir: string): Draft => {
  const parsed = DraftSchema.safeParse(JSON.parse(readFileSync(join(dir, "work", "draft.json"), "utf8")));
  if (!parsed.success) throw new Error(`draft.json : ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  return parsed.data;
};

export function checkOrder(dir: string): CheckReport {
  const draft = readDraft(dir);
  const extracts = new Map<number, DocExtract>();
  for (const d of draft.documents) extracts.set(d.doc, JSON.parse(readFileSync(join(dir, "work", docId(d.doc), "extract.json"), "utf8")));
  const items: CheckedItem[] = [];
  const earlier: { id: string; prompt: string }[] = [];
  const problems: string[] = [];
  draft.items.forEach((q, i) => {
    const id = `Q${i + 1}`;
    const doc = draft.documents.find((d) => d.doc === q.doc);
    const ex = extracts.get(q.doc);
    const p = doc ? itemProblems(q, { sectionCount: doc.sections.length }) : [`document ${q.doc} absent de la liste`];
    const loc = ex ? locateQuote(q.source_quote, ex) : null;
    if (!loc) p.push("citation introuvable dans le document");
    const answerPresent = q.type === "word" ? !!loc && q.answer.split("|").some((alt) => answerAppearsInText(alt, buildWordSet(loc.text))) : null;
    if (answerPresent === false) p.push("réponse absente du passage cité");
    const duplicateOf = findDuplicate(q.question, earlier);
    if (duplicateOf) p.push(`doublon de ${duplicateOf}`);
    earlier.push({ id, prompt: q.question });
    items.push({ ...q, id, source: loc ? { file: loc.file, place: loc.place } : null, gates: { schema: true, quoteFound: !!loc, answerPresent, duplicateOf }, problems: p });
  });
  for (const it of items) if (it.problems.length) problems.push(`${it.id} : ${it.problems.join(", ")}`);
  // One question per section at least, and the agreed size of the questionnaire.
  for (const d of draft.documents) {
    d.sections.forEach((s, k) => {
      if (!items.some((it) => it.doc === d.doc && it.section === k + 1)) problems.push(`${docId(d.doc)} section ${k + 1} « ${s} » sans question`);
    });
    if (!extracts.has(d.doc)) problems.push(`${docId(d.doc)} : extraction manquante`);
  }
  if (items.length < MIN_ITEMS || items.length > MAX_ITEMS) problems.push(`${items.length} questions : ${MIN_ITEMS} à ${MAX_ITEMS} attendues`);
  const report: CheckReport = { ok: problems.length === 0, items, problems, counts: { items: items.length, documents: draft.documents.length, sections: draft.documents.reduce((s, d) => s + d.sections.length, 0) } };
  writeFileSync(join(dir, "work", "check.json"), JSON.stringify(report, null, 1) + "\n");
  return report;
}
