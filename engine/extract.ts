// Step 1 of the offline fulfilment: the customer's documents (input/order.json + input/<folder>/*) -> work/Dxx/extract.{json,txt}.
// order.json is what octave-checkout gas/scripts/eval-ops.mjs pull writes: `course` there is the document number (1 to 3).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { parseFile, type ParsedFile } from "./lib/parse/index";

export const MAX_DOCUMENTS = 3;
export const MAX_PAGES = 60;

export type OrderFile = { course: number; course_title: string; file: string };
export type Order = { order_id: string; company: string; courses: number; sample?: boolean; files: OrderFile[] };
export type DocExtract = {
  doc: number;
  title: string;
  files: { file: string; kind: ParsedFile["kind"]; sha256: string; words: number; pages?: number; places: ParsedFile["places"] }[];
};

export const docId = (n: number) => `D${String(n).padStart(2, "0")}`;

export const readOrder = (dir: string): Order => JSON.parse(readFileSync(join(dir, "input", "order.json"), "utf8"));

export async function extractOrder(dir: string): Promise<DocExtract[]> {
  const order = readOrder(dir);
  const byDoc = new Map<number, OrderFile[]>();
  for (const f of order.files) byDoc.set(f.course, [...(byDoc.get(f.course) ?? []), f]);
  if (byDoc.size > MAX_DOCUMENTS) throw new Error(`${byDoc.size} documents : ${MAX_DOCUMENTS} au maximum par commande`);
  const out: DocExtract[] = [];
  let pages = 0;
  for (const [doc, files] of [...byDoc.entries()].sort((a, b) => a[0] - b[0])) {
    const ex: DocExtract = { doc, title: files[0]!.course_title, files: [] };
    for (const f of files) {
      const p = await parseFile(f.file, readFileSync(join(dir, "input", f.file)));
      pages += p.pages ?? p.places.length;
      ex.files.push({ file: f.file, kind: p.kind, sha256: p.sha256, words: p.wordCount, pages: p.pages, places: p.places });
    }
    const wdir = join(dir, "work", docId(doc));
    mkdirSync(wdir, { recursive: true });
    writeFileSync(join(wdir, "extract.json"), JSON.stringify(ex, null, 1) + "\n");
    writeFileSync(join(wdir, "extract.txt"), ex.files.map((f) => `===== ${f.file} (${f.kind}, ${f.words} mots)\n` + f.places.map((pl) => `--- ${pl.label}\n${pl.text}`).join("\n")).join("\n\n") + "\n");
    out.push(ex);
  }
  // CGV: 60 pages in total. Above that, Octave writes to the customer before starting (no silent truncation).
  if (pages > MAX_PAGES) console.error(`attention : ${pages} pages au total (${MAX_PAGES} prévues par la commande) : écrire au client avant de rédiger`);
  return out;
}
