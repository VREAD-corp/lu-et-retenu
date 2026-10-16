// Lu et Retenu offline fulfilment. Usage (from the repo root):
//   npx tsx engine/cli.ts extract <orderDir>   documents (input/order.json + input/<folder>/*) -> work/Dxx/extract.{json,txt}
//   npx tsx engine/cli.ts cold    <orderDir>   work/draft.json -> work/cold.prompts.jsonl (cold-answer gate, to answer
//                                              offline WITHOUT the documents into work/cold.answers.jsonl)
//   npx tsx engine/cli.ts judge   <orderDir>   cold answers of MC items -> work/cold.judge-prompts.jsonl (judged
//                                              offline against the key into work/cold.judge.jsonl)
//   npx tsx engine/cli.ts check   <orderDir>   work/draft.json (written offline by Octave) -> gates -> work/check.json
//   npx tsx engine/cli.ts render  <orderDir>   checked draft -> output/<zip> (DOCX, PDF, CSV, XLSX, GIFT)
//   npx tsx engine/cli.ts all     <orderDir>   the three steps
// <orderDir>/input is what octave-checkout gas/scripts/eval-ops.mjs pull writes. No network, no LLM.
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { checkOrder, coldPrompts, judgePrompts, stampCold } from "./check";
import { extractOrder } from "./extract";
import { renderOrder } from "./render";

const [cmd, dirArg] = process.argv.slice(2);
if (!cmd || !dirArg) {
  console.error("usage: cli.ts extract|cold|judge|check|render|all <orderDir>");
  process.exit(2);
}
const dir = resolve(dirArg);

async function main() {
  if (cmd === "extract" || cmd === "all") {
    const ex = await extractOrder(dir);
    console.log(JSON.stringify({ step: "extract", documents: ex.map((d) => ({ doc: d.doc, title: d.title, files: d.files.map((f) => `${f.file} (${f.kind}, ${f.words} mots, ${f.places.length} emplacements)`) })) }));
  }
  if (cmd === "cold") {
    console.log(JSON.stringify({ step: "cold", ...coldPrompts(dir) }));
    return;
  }
  if (cmd === "stamp") {
    stampCold(dir);
    return;
  }
  if (cmd === "judge") {
    console.log(JSON.stringify({ step: "judge", ...judgePrompts(dir) }));
    return;
  }
  if (cmd === "check" || cmd === "render" || cmd === "all") {
    if (!existsSync(join(dir, "work", "draft.json"))) throw new Error("work/draft.json manquant (à rédiger à partir de work/Dxx/extract.txt)");
    const r = checkOrder(dir);
    console.log(JSON.stringify({ step: "check", ok: r.ok, counts: r.counts, problems: r.problems }));
    if (!r.ok) process.exit(1);
    if (cmd !== "check") {
      const z = await renderOrder(dir, r);
      console.log(JSON.stringify({ step: "render", zip: z.zip, sha256: z.sha256, files: z.files.length }));
    }
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
