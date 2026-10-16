// Reading-engine QA on a draft (since 2026-10-16): the historical gates of @read-france/reading-engine that the
// acquiz copy never ran here. The cold-answer gate (an agent that has NOT seen the documents answers each question
// from the title alone; its answers come back in a file, no model is called), the closed-question rule, and for
// one-word answers the form rules of Vread's checkpoints. Quote location, answer presence and duplicates stay in
// check.ts (same functions, now imported from the engine).
import { existsSync, writeFileSync } from "node:fs";

import { buildColdPrompt, buildJudgePrompt, judgeHash, loadRecords, needsOptions, questionHash, runQa, type ColdRecord, type Item, type ItemSet, type JudgeRecord } from "@read-france/reading-engine";

export const COLD_PROMPTS = "cold.prompts.jsonl";
export const COLD_ANSWERS = "cold.answers.jsonl";
/** Judge step: MC items are asked WITHOUT their options (historical gate), so their cold answer is judged vs the key. */
export const JUDGE_PROMPTS = "cold.judge-prompts.jsonl";
export const JUDGE_VERDICTS = "cold.judge.jsonl";

export type QaItem = {
  id: string;
  type: "word" | "mcq";
  question: string;
  answer: string;
  choices?: string[] | null;
  /** Text of the place (page, slide, document) where the quote was found. */
  placeText: string;
  quote: string;
  /** Measures prior knowledge by design (entry test): skipped by the cold-answer gate. */
  coldExempt?: boolean;
};

const LETTERS = "ABCD";

export const toItemSet = (set: string, title: string, items: QaItem[], kind: ItemSet["kind"] = "document"): ItemSet => ({
  set,
  kind,
  title,
  author: null,
  language: "fr",
  units: items.map((i) => ({ id: i.id, text: i.placeText || " " })),
  items: items.map((i): Item => {
    const base = { id: i.id, unit: i.id, question: i.question, evidence: [i.quote], coldExempt: i.coldExempt };
    if (i.type === "mcq") {
      const choices = i.choices ?? [];
      const k = choices.findIndex((c) => c.trim().toLowerCase() === i.answer.trim().toLowerCase());
      return { ...base, type: "mc", options: choices, answer: LETTERS[k] ?? "?" };
    }
    const [first, ...alts] = i.answer.split("|").map((a) => a.trim());
    return { ...base, type: "word", answer: first!, accept: alts };
  }),
});

/**
 * The cold-answer prompts of the sets (title + question [+ options], never the documents nor the key), each with
 * the question's fingerprint (qhash) that the answerer copies back. With an answers file, only the items without a
 * current answer (none yet, or the question was rewritten since) are written.
 */
export const writeColdPrompts = (file: string, sets: ItemSet[], answersFile?: string) => {
  const have = answersFile && existsSync(answersFile) ? loadRecords<ColdRecord>(answersFile) : new Map<string, ColdRecord>();
  const rows = sets.flatMap((s) =>
    s.items
      .filter((i) => !i.coldExempt && have.get(i.id)?.qhash !== questionHash(i))
      .map((i) => ({ ...buildColdPrompt(i, { title: s.title, author: s.author, language: s.language, kind: s.kind }), qhash: questionHash(i) })),
  );
  writeFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  return rows.length;
};

// Checks this service takes from the engine report (the others are run by check.ts with its own messages).
const TAKEN = (id: string) => id === "cold_answer" || id.startsWith("form:") || id === "mc_key_in_stem";

/** Judge prompts for the cold answers of MC items (key = text of the right option); word items need no judge. */
export const writeJudgePrompts = (file: string, sets: ItemSet[], answersFile: string) => {
  const cold = loadRecords<ColdRecord>(answersFile);
  const rows = sets.flatMap((s) =>
    s.items
      .filter((i) => i.type === "mc" && !i.coldExempt && !needsOptions(i.question) && cold.get(i.id)?.qhash === questionHash(i))
      .map((i) => {
        const key = i.options![LETTERS.indexOf(i.answer)] ?? i.answer;
        const c = String(cold.get(i.id)!.answer ?? "").trim();
        return { ...buildJudgePrompt({ id: i.id, question: i.question, key, cold: c, language: s.language }), jhash: judgeHash({ question: i.question, key, cold: c }) };
      }),
  );
  writeFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  return rows.length;
};

/** One-off: fingerprints answers and verdicts written before fingerprints existed (they answer the current items). */
export const stampFiles = (sets: ItemSet[], answersFile: string, judgeFile: string) => {
  const items = new Map(sets.flatMap((s) => s.items.map((i) => [i.id, i] as const)));
  const cold = loadRecords<ColdRecord>(answersFile);
  const c2 = [...cold.values()].map((r) => (items.has(r.id) && !r.qhash ? { ...r, qhash: questionHash(items.get(r.id)!) } : r));
  writeFileSync(answersFile, c2.map((r) => JSON.stringify(r)).join("\n") + "\n");
  if (existsSync(judgeFile)) {
    const j2 = [...loadRecords<JudgeRecord>(judgeFile).values()].map((r) => {
      const i = items.get(r.id);
      const c = cold.get(r.id);
      if (!i || !c || r.jhash) return r;
      const key = i.type === "mc" ? i.options![LETTERS.indexOf(i.answer)] ?? i.answer : i.answer;
      return { ...r, jhash: judgeHash({ question: i.question, key, cold: String(c.answer ?? "").trim() }) };
    });
    writeFileSync(judgeFile, j2.map((r) => JSON.stringify(r)).join("\n") + "\n");
  }
};

/** Problems per item id (French, for check.json), from the engine's report. */
export const engineProblems = (sets: ItemSet[], answersFile: string, judgeFile?: string): Map<string, string[]> => {
  const cold = existsSync(answersFile) ? loadRecords<ColdRecord>(answersFile) : undefined;
  const judge = judgeFile && existsSync(judgeFile) ? loadRecords<JudgeRecord>(judgeFile) : undefined;
  const out = new Map<string, string[]>();
  for (const s of sets) {
    for (const it of runQa(s, { cold, judge }).items) {
      const p: string[] = [];
      for (const c of it.checks) {
        if (c.ok || c.severity !== "block" || !TAKEN(c.id)) continue;
        if (c.id === "cold_answer") {
          p.push(
            it.cold === "pending"
              ? `porte cold-answer non passée (${COLD_ANSWERS} ou ${JUDGE_VERDICTS} manquant ou incomplet)`
              : `répondable sans lire le document (porte cold-answer : « ${it.coldAnswer} »)`,
          );
        } else if (c.id === "form:question_yes_no") p.push("question fermée (oui/non)");
        else if (c.id === "mc_key_in_stem") p.push("la question contient la bonne réponse");
        else p.push(`forme : ${c.message}`);
      }
      out.set(it.id, p);
    }
  }
  return out;
};
