// Engine tests: acquiz static gates on Lu et Retenu drafts, coverage of every section, deterministic option order,
// the public sample (every question passes every gate) and the XLSX register.
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

import JSZip from "jszip";

import { checkOrder } from "../engine/check";
import { itemProblems } from "../engine/lib/gen/schema";
import { nbsp, shuffledChoices } from "../engine/render";
import { xlsx } from "../engine/xlsx";

const ROOT = resolve(import.meta.dirname, "..");
const SAMPLE = join(ROOT, "samples/modeles-officiels");

function copySample() {
  const dir = mkdtempSync(join(tmpdir(), "ler-check-"));
  for (const d of ["D01", "D02"]) { mkdirSync(join(dir, "work", d), { recursive: true }); cpSync(join(SAMPLE, "work", d, "extract.json"), join(dir, "work", d, "extract.json")); }
  return { dir, draft: JSON.parse(readFileSync(join(SAMPLE, "work/draft.json"), "utf8")) };
}

test("the public sample: 16 questions on 2 official models, every section covered, every quote found on its page", () => {
  const r = checkOrder(SAMPLE);
  assert.equal(r.ok, true, r.problems.join("; "));
  assert.deepEqual(r.counts, { items: 16, documents: 2, sections: 13 });
  assert.ok(r.items.every((i) => i.gates.quoteFound && i.source && /^p\. \d+/.test(i.source.place)));
  assert.ok(r.items.filter((i) => i.type === "word").every((i) => i.gates.answerPresent === true));
  assert.deepEqual(r.items.find((i) => i.answer === "douze")!.source, { file: "D02/modele-informations-principales-relation-de-travail.pdf", place: "p. 3" });
});

test("gates catch a made-up quote, a quote from the other document, an answer absent from the passage, a duplicate and an uncovered section", () => {
  const { dir, draft } = copySample();
  draft.items[0].source_quote = "Le règlement prévoit une pause café de vingt minutes chaque matin";
  draft.items[8].source_quote = draft.items[3].source_quote; // D02 question citing D01's text
  draft.items[2].answer = "légère";
  draft.items[5] = { ...draft.items[4] };
  draft.items = draft.items.filter((q: { doc: number; section: number }) => !(q.doc === 2 && q.section === 8));
  writeFileSync(join(dir, "work/draft.json"), JSON.stringify(draft));
  const r = checkOrder(dir);
  assert.equal(r.ok, false);
  const has = (re: RegExp) => assert.ok(r.problems.some((p) => re.test(p)), `${re} in\n${r.problems.join("\n")}`);
  has(/^Q1 : .*citation introuvable/);
  has(/^Q9 : .*citation introuvable/);
  has(/^Q3 : .*réponse absente du passage cité/);
  has(/^Q6 : .*doublon de Q5/);
  has(/D02 section 8 « Protection sociale \(XIV\) » sans question/);
});

test("size rule: fewer than 8 questions is refused by the schema", () => {
  const { dir, draft } = copySample();
  draft.items = draft.items.slice(0, 7);
  writeFileSync(join(dir, "work/draft.json"), JSON.stringify(draft));
  assert.throws(() => checkOrder(dir), /items/);
});

test("item rules (acquiz itemProblems): one-word answers, answer not in the question, exactly one right option", () => {
  const base = { doc: 1, section: 1, source_quote: "une citation du document assez longue" };
  assert.deepEqual(itemProblems({ ...base, type: "word", question: "Quel adjectif qualifie la pression visée par le texte ?", answer: "grave" }, { sectionCount: 2 }), []);
  assert.ok(itemProblems({ ...base, type: "word", question: "La pression grave est-elle visée ici ?", answer: "grave" }, { sectionCount: 2 }).includes("réponse contenue dans la question"));
  assert.ok(itemProblems({ ...base, type: "word", question: "Quelle juridiction le texte cite-t-il ?", answer: "conseil de prud'hommes" }, { sectionCount: 2 }).includes("réponse en plusieurs mots"));
  assert.ok(itemProblems({ ...base, type: "mcq", question: "Quelle peine le texte prévoit-il ?", answer: "deux ans", choices: ["un an", "trois ans", "cinq ans"] }, { sectionCount: 2 }).some((p) => /exactement une fois/.test(p)));
  assert.ok(itemProblems({ ...base, section: 3, type: "word", question: "Quel adjectif qualifie la pression visée par le texte ?", answer: "grave" }, { sectionCount: 2 }).some((p) => /hors plage/.test(p)));
});

test("rendering helpers: deterministic option order per order id, French no-break spaces", () => {
  const item = { id: "Q1", doc: 1, section: 1, type: "mcq" as const, question: "Question de test assez longue ?", answer: "a", choices: ["a", "b", "c", "d"], source_quote: "xxxxxxxx", source: null, gates: { schema: true, quoteFound: true, answerPresent: null, duplicateOf: null }, problems: [] };
  assert.deepEqual(shuffledChoices(item, "ok_1"), shuffledChoices(item, "ok_1"));
  assert.equal(nbsp("Prix : 149 € ?"), "Prix : 149 € ?");
});

test("XLSX register opens as a zip with a sheet, inline strings and a frozen header", async () => {
  const buf = await xlsx("Registre", [["Nom", "Score"], ["A & B", 3]], [20, 10]);
  const z = await JSZip.loadAsync(buf);
  const sheet = await z.file("xl/worksheets/sheet1.xml")!.async("string");
  assert.match(sheet, /<t xml:space="preserve">A &amp; B<\/t>/);
  assert.match(sheet, /<v>3<\/v>/);
  assert.match(sheet, /state="frozen"/);
  assert.ok(z.file("[Content_Types].xml"));
});
