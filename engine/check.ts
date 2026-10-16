// Step 2 of the offline fulfilment: work/draft.json (written offline by Octave, no LLM at runtime) is checked against
// the customer's own documents with the gates of @read-france/reading-engine (quote found, answer present,
// duplicates, and since 2026-10-16 the cold-answer gate and the form rules, see qa.ts). Nothing is repaired
// silently: any failure stops the build.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { answerAppearsInText, buildWordSet, findDuplicate, quoteInText, type ItemSet } from "@read-france/reading-engine";

import { COLD_ANSWERS, COLD_PROMPTS, JUDGE_PROMPTS, JUDGE_VERDICTS, engineProblems, stampFiles, toItemSet, writeColdPrompts, writeJudgePrompts, type QaItem } from "./qa";
import { DraftSchema, itemProblems, type Draft, type Question } from "./lib/gen/schema";
import { docId, type DocExtract } from "./extract";

export const MIN_ITEMS = 8;
export const MAX_ITEMS = 20;

export type CheckedItem = Question & {
  id: string;
  source: { file: string; place: string } | null;
  gates: { schema: boolean; quoteFound: boolean; answerPresent: boolean | null; duplicateOf: string | null; cold: string };
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

const loadExtracts = (dir: string, draft: Draft) => {
  const extracts = new Map<number, DocExtract>();
  for (const d of draft.documents) extracts.set(d.doc, JSON.parse(readFileSync(join(dir, "work", docId(d.doc), "extract.json"), "utf8")));
  return extracts;
};

/** One reading-engine item set per document: the cold-answer prompt names the document, never quotes it. */
const qaSets = (draft: Draft, extracts: Map<number, DocExtract>): ItemSet[] =>
  draft.documents.map((d) => {
    const ex = extracts.get(d.doc);
    const items: QaItem[] = [];
    draft.items.forEach((q, i) => {
      if (q.doc !== d.doc) return;
      const loc = ex ? locateQuote(q.source_quote, ex) : null;
      items.push({ id: `Q${i + 1}`, type: q.type, question: q.question, answer: q.answer, choices: q.choices, placeText: loc?.text ?? "", quote: q.source_quote });
    });
    return toItemSet(`lu-et-retenu/${docId(d.doc)}`, d.title, items, "document");
  });

/** Writes work/cold.prompts.jsonl, to be answered offline (without the documents) into work/cold.answers.jsonl. */
export function coldPrompts(dir: string): { file: string; count: number } {
  const draft = readDraft(dir);
  const file = join(dir, "work", COLD_PROMPTS);
  return { file, count: writeColdPrompts(file, qaSets(draft, loadExtracts(dir, draft)), join(dir, "work", COLD_ANSWERS)) };
}

/** One-off: fingerprints cold answers and verdicts written before fingerprints existed. */
export function stampCold(dir: string) {
  const draft = readDraft(dir);
  stampFiles(qaSets(draft, loadExtracts(dir, draft)), join(dir, "work", COLD_ANSWERS), join(dir, "work", JUDGE_VERDICTS));
}

/** After the cold answers: work/cold.judge-prompts.jsonl (MC answers vs key), to judge offline into work/cold.judge.jsonl. */
export function judgePrompts(dir: string): { file: string; count: number } {
  const draft = readDraft(dir);
  const file = join(dir, "work", JUDGE_PROMPTS);
  return { file, count: writeJudgePrompts(file, qaSets(draft, loadExtracts(dir, draft)), join(dir, "work", COLD_ANSWERS)) };
}

export function checkOrder(dir: string): CheckReport {
  const draft = readDraft(dir);
  const extracts = loadExtracts(dir, draft);
  const fromEngine = engineProblems(qaSets(draft, extracts), join(dir, "work", COLD_ANSWERS), join(dir, "work", JUDGE_VERDICTS));
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
    const engine = fromEngine.get(id) ?? [];
    p.push(...engine);
    const cold = engine.some((x) => x.startsWith("porte cold-answer")) ? "pending" : engine.some((x) => x.startsWith("répondable")) ? "leak" : "pass";
    items.push({ ...q, id, source: loc ? { file: loc.file, place: loc.place } : null, gates: { schema: true, quoteFound: !!loc, answerPresent, duplicateOf, cold }, problems: p });
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
