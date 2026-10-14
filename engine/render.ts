// Step 3 of the offline fulfilment: checked draft -> Markdown -> DOCX (the Kit Qualiopi converter, md2docx.mjs)
// -> PDF (LibreOffice headless, isolated profile) + register (XLSX, CSV) + quiz-tool files (CSV, Moodle GIFT) -> one ZIP.
// The customer hands the questionnaire out and keeps every answer: nothing here is about a named person.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// @ts-expect-error plain ESM module without types
import { markdownToDocx } from "./md2docx.mjs";
import { readDraft, type CheckReport, type CheckedItem } from "./check";
import { docId, readOrder, type Order } from "./extract";
import { type Draft } from "./lib/gen/schema";
import { xlsx } from "./xlsx";

const LETTERS = ["a", "b", "c", "d"];
const PUBLISHER = "READ FRANCE SAS";
export const BRAND = "Lu et Retenu";
export const NO_LEGAL = "Ce questionnaire ne vaut pas validation juridique de votre règlement ni de vos documents : nous n’en avons pas contrôlé la légalité.";
export const SIGN_VS_READ = "Une signature prouve la remise ; quelques questions montrent la lecture.";
const REGISTER_ROWS = 30;

/** Deterministic shuffle of the options (seed = order + item id), so the right answer is not always « a ». */
export function shuffledChoices(item: CheckedItem, seed: string): string[] {
  const choices = [...(item.choices ?? [])];
  let h = createHash("sha256").update(`${seed}:${item.id}`).digest();
  for (let i = choices.length - 1; i > 0; i--) {
    if (i >= h.length) h = createHash("sha256").update(h).digest();
    const j = h[i]! % (i + 1);
    [choices[i], choices[j]] = [choices[j]!, choices[i]!];
  }
  return choices;
}

/** French typography: no-break space before « ? : ; ! % » and inside guillemets. */
export const nbsp = (md: string) => md.replace(/ ([?:;!%»])/g, " $1").replace(/« /g, "« ").replace(/(\d) (€|h\b)/g, "$1 $2");
const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\[/g, "(").replace(/\]/g, ")");
const today = () => new Date().toISOString().slice(0, 10).split("-").reverse().join("/");

function expected(i: CheckedItem, seed: string): string {
  if (i.type === "mcq") {
    const ch = shuffledChoices(i, seed);
    return `${LETTERS[ch.indexOf(i.answer)]}) ${i.answer}`;
  }
  const alts = i.answer.split("|");
  return alts.length > 1 ? `${alts[0]} (accepté aussi : ${alts.slice(1).join(", ")})` : alts[0]!;
}

const sectionName = (d: Draft, i: CheckedItem) => d.documents.find((x) => x.doc === i.doc)!.sections[i.section - 1]!;
const docTitle = (d: Draft, n: number) => d.documents.find((x) => x.doc === n)!.title;
const where = (i: CheckedItem) => (i.source ? `${i.source.file.split("/").pop()}, ${i.source.place}` : "?");

function questionnaireMd(order: Order, d: Draft, r: CheckReport): string {
  const out = [
    `# Questionnaire de lecture : ${esc(d.title)}`,
    `**Pour :** ${esc(d.audience)} · **Documents :** ${d.documents.map((x) => `${docId(x.doc)} ${esc(x.title)}`).join(" ; ")} · **Version :** ${order.order_id}, ${today()}`,
    `> Lisez d’abord les documents remis. Répondez ensuite sans les avoir sous les yeux, en ${d.minutes} minutes environ. Ce questionnaire ne sert pas à vous noter : une réponse fausse montre seulement un passage à revoir ensemble. Cochez une seule case par question ; écrivez un seul mot quand c’est demandé.`,
    `| | |\n|---|---|\n| Nom, prénom | [ ] |\n| Fonction ou session | [ ] |\n| Documents reçus le | [JJ/MM/AAAA] |\n| Questionnaire rempli le | [JJ/MM/AAAA] |`,
  ];
  let n = 0;
  for (const doc of d.documents) {
    out.push(`## ${docId(doc.doc)} ${esc(doc.title)}`);
    for (const it of r.items.filter((i) => i.doc === doc.doc)) {
      n++;
      if (it.type === "mcq") out.push(`**${n}.** ${esc(it.question)}\n\n${shuffledChoices(it, order.order_id).map((c, k) => `☐ ${LETTERS[k]}) ${esc(c)}`).join("  \n")}`);
      else out.push(`**${n}.** ${esc(it.question)}\n\nRéponse (un mot) : ………………………………`);
    }
  }
  out.push(`*Réservé à l’organisme : bonnes réponses [ ] sur ${r.items.length} · sections revues avec la personne : [ ]*`);
  return out.join("\n\n") + "\n";
}

function keyMd(order: Order, d: Draft, r: CheckReport): string {
  const ordered = d.documents.flatMap((doc) => r.items.filter((i) => i.doc === doc.doc));
  return [
    `# Corrigé et passages cités : ${esc(d.title)}`,
    `**Réservé à la personne qui corrige** · commande ${order.order_id}, ${today()}`,
    `> Chaque question vient d’un passage de vos documents, cité mot pour mot avec sa page. Contrôles passés par chaque question : passage retrouvé dans le document ; pour les réponses en un mot, mot présent dans le passage et absent de l’énoncé ; une seule bonne option ; pas de doublon. Relisez et validez avant la première utilisation. ${NO_LEGAL}`,
    `## Correction\n\nUn point par bonne réponse, ${ordered.length} au total. Repère indicatif : ${d.threshold} % (${Math.ceil((d.threshold / 100) * ordered.length)} bonnes réponses sur ${ordered.length}). En dessous, ou pour toute question fausse, relisez la section concernée avec la personne et notez-la sur l’attestation. Le résultat ne sert pas à sanctionner et aucune décision n’est prise automatiquement à partir de lui.`,
    `| N° | Document, section | Réponse attendue | Source |\n|---|---|---|---|\n${ordered.map((i, k) => `| ${k + 1} | ${docId(i.doc)} §${i.section} ${esc(sectionName(d, i))} | ${esc(expected(i, order.order_id))} | ${esc(where(i))} |`).join("\n")}`,
    "## Passages cités et points à revoir",
    ordered.map((i, k) => `**${k + 1}.** « ${esc(i.source_quote)} » (${esc(where(i))})${i.explanation ? `\n\nSi la réponse est fausse : ${esc(i.explanation)}` : ""}`).join("\n\n"),
  ].join("\n\n") + "\n";
}

function attestationMd(order: Order, d: Draft, r: CheckReport): string {
  return [
    "# Attestation de lecture et de compréhension",
    `*${esc(d.title)} – modèle à remplir, une par personne – ${order.order_id}*`,
    "Je soussigné(e) [Nom, prénom], [fonction, ou stagiaire de la session …], déclare avoir reçu le [JJ/MM/AAAA] les documents suivants :",
    d.documents.map((x) => `- ${docId(x.doc)} ${esc(x.title)}`).join("\n"),
    `Je les ai lus. Le [JJ/MM/AAAA], j’ai répondu au questionnaire de lecture qui les accompagne : [ ] bonnes réponses sur ${r.items.length}.`,
    "Les points suivants ont été revus avec moi par [nom et fonction du référent] le [JJ/MM/AAAA] : [sections, ou « aucun »].",
    "Fait à [ville], le [JJ/MM/AAAA], en deux exemplaires.",
    "| La personne | Pour l’organisme (nom, fonction, cachet) |\n|---|---|\n| Signature : | Signature : |\n| | |",
    `> Cette attestation constate la remise des documents, leur lecture et un échange sur leur contenu. ${SIGN_VS_READ} Elle ne vaut ni validation juridique des documents, ni engagement autre que ceux prévus par la loi et par ces documents eux-mêmes. ${NO_LEGAL}`,
  ].join("\n\n") + "\n";
}

function noticeMd(d: Draft): string {
  return [
    "# Modèle de note d’information",
    `*À adapter et à remettre avec les documents (${esc(d.audience)}). Modèle sans valeur de conseil juridique.*`,
    "**Objet : questionnaire de lecture de nos documents d’accueil**",
    `À votre arrivée, nous vous remettons : ${d.documents.map((x) => esc(x.title)).join(", ")}. Pour vérifier que les points essentiels sont clairs, nous vous proposons un court questionnaire (${d.minutes} minutes environ).`,
    "- Il sert à repérer les passages à expliquer, pas à vous évaluer. Aucune sanction ni décision n’en découle.\n- Vos réponses sont conservées par [organisme] dans votre dossier [de stagiaire / du personnel] pendant [durée], avec l’attestation de lecture que nous signons ensemble. Elles ne sont transmises à personne d’autre.\n- Vous pouvez demander à les consulter ou à les faire corriger auprès de [contact].",
    "*Pour l’organisme : dans une entreprise d’au moins 50 salariés, renseignez-vous sur l’information ou la consultation du comité social et économique (articles L2312-38 et L1222-4 du code du travail) avant la mise en place ; nous ne donnons pas d’avis sur ce point.*",
  ].join("\n\n") + "\n";
}

function readmeMd(order: Order, d: Draft, r: CheckReport, names: Record<string, string>): string {
  return [
    `# Lisez-moi : votre questionnaire ${BRAND}`,
    `*Commande ${order.order_id} – ${esc(order.company)} – ${r.items.length} questions sur ${d.documents.length} document(s).*`,
    "## Contenu de l’archive",
    [
      `- **${names.questionnaire}** (DOCX à modifier, PDF à imprimer) : le questionnaire à remettre en main propre avec les documents.`,
      `- **${names.key}** : le corrigé, avec pour chaque question le passage de vos documents et sa page.`,
      `- **${names.attestation}** : l’attestation de lecture et de compréhension, à signer par la personne et par l’organisme.`,
      `- **${names.register}** (XLSX et CSV) : le registre de suivi, une ligne par personne.`,
      "- **questions-outil-quiz.csv** et **questions-moodle.gift.txt** : les mêmes questions pour Google Forms, Moodle ou un autre outil de quiz (CSV : séparateur point-virgule, UTF-8).",
      `- **${names.notice}** : un modèle de note d’information pour les personnes concernées.`,
    ].join("\n"),
    "## Utilisation",
    "1. Relisez les questions et le corrigé. Modifiez librement les DOCX : ils sont à vous.\n2. Remettez les documents, puis le questionnaire. Corrigez avec le corrigé, revoyez ensemble les sections où la réponse est fausse.\n3. Faites signer l’attestation, rangez-la avec le questionnaire rempli, et notez la ligne dans le registre.\n4. Une question vous paraît fausse ou mal posée ? Répondez à l’e-mail de livraison dans les 30 jours : nous la remplaçons sans frais.",
    "## À savoir",
    `${SIGN_VS_READ} ${NO_LEGAL} Les questions ont été rédigées par Octave, l’assistant IA de ${PUBLISHER}, à partir de vos seuls documents, puis contrôlées par programme. ${PUBLISHER} ne reçoit aucune réponse de vos salariés ou stagiaires : le questionnaire se passe chez vous. Vos documents et cette archive sont supprimés de nos systèmes 90 jours après la livraison.`,
  ].join("\n\n") + "\n";
}

const csvLine = (r: unknown[]) => r.map((s) => `"${String(s ?? "").replace(/"/g, '""')}"`).join(";");

function quizCsv(order: Order, d: Draft, r: CheckReport): string {
  const head = ["numero", "document", "section", "type", "question", "choix_a", "choix_b", "choix_c", "choix_d", "bonne_reponse", "source", "passage_cite"];
  const rows = d.documents.flatMap((doc) => r.items.filter((i) => i.doc === doc.doc)).map((i, k) => {
    const ch = i.type === "mcq" ? shuffledChoices(i, order.order_id) : [];
    return [k + 1, docTitle(d, i.doc), sectionName(d, i), i.type === "mcq" ? "choix unique" : "réponse courte (un mot)", i.question, ch[0], ch[1], ch[2], ch[3], i.type === "mcq" ? i.answer : i.answer.replace(/\|/g, " ou "), where(i), i.source_quote];
  });
  return "﻿" + [head, ...rows].map(csvLine).join("\r\n") + "\r\n";
}

/** Moodle GIFT: MCQ as {=right ~wrong…}, one-word answers as short answer {=a =b}. */
function gift(order: Order, d: Draft, r: CheckReport): string {
  const g = (s: string) => s.replace(/([~=#{}:\\])/g, "\\$1");
  return d.documents.flatMap((doc) => r.items.filter((i) => i.doc === doc.doc)).map((i, k) => {
    const body = i.type === "mcq" ? shuffledChoices(i, order.order_id).map((c) => `${c === i.answer ? "=" : "~"}${g(c)}`).join(" ") : i.answer.split("|").map((a) => `=${g(a)}`).join(" ");
    return `// ${docId(i.doc)} §${i.section} – source : ${g(where(i))}\n::Q${k + 1}::${g(i.question)} {${body}}\n`;
  }).join("\n");
}

function registerRows(d: Draft, r: CheckReport): string[][] {
  const head = ["Nom, prénom", "Fonction ou session", "Documents remis le", "Questionnaire le", `Bonnes réponses (sur ${r.items.length})`, "Sections revues ensemble", "Attestation signée le", "Observations"];
  return [head, ...Array.from({ length: REGISTER_ROWS }, () => head.map(() => ""))];
}

/** Renders the checked draft of an order and zips the deliverable. */
export async function renderOrder(dir: string, report: CheckReport): Promise<{ zip: string; files: string[]; sha256: string }> {
  if (!report.ok) throw new Error("contrôles non passés");
  const order = readOrder(dir);
  const d = readDraft(dir);
  const outName = order.sample ? "lu-et-retenu-exemple-modeles-officiels" : `lu-et-retenu-${order.order_id}`;
  const out = join(dir, "output", outName);
  rmSync(join(dir, "output"), { recursive: true, force: true });
  const md = join(dir, "output", "_md"), docx = join(dir, "output", "_docx"), pdfDir = join(dir, "output", "_pdf");
  for (const p of [out, md, docx, pdfDir]) mkdirSync(p, { recursive: true });
  const names = { questionnaire: "1-questionnaire-de-lecture", key: "2-corrige-et-passages-cites", attestation: "3-attestation-lecture-comprehension", register: "4-registre", notice: "5-modele-note-information" };
  const docs: { name: string; title: string; md: string; landscape?: boolean; docx: boolean }[] = [
    { name: names.questionnaire, title: `Questionnaire de lecture – ${d.title}`, md: questionnaireMd(order, d, report), docx: true },
    { name: names.key, title: `Corrigé – ${d.title}`, md: keyMd(order, d, report), docx: true },
    { name: names.attestation, title: "Attestation de lecture et de compréhension", md: attestationMd(order, d, report), docx: true },
    { name: names.notice, title: "Modèle de note d’information", md: noticeMd(d), docx: true },
    { name: "00-lisez-moi", title: "Lisez-moi", md: readmeMd(order, d, report, names), docx: false },
  ];
  const footer = `${BRAND} – ${PUBLISHER} – ${order.order_id}`;
  for (const doc of docs) {
    doc.md = nbsp(doc.md);
    writeFileSync(join(md, `${doc.name}.md`), doc.md);
    writeFileSync(join(docx, `${doc.name}.docx`), await markdownToDocx(doc.md, { title: doc.title, footerText: footer, landscape: doc.landscape, description: `${BRAND} – ${PUBLISHER}` }));
  }
  const soffice = ["soffice", "libreoffice"].find((b) => { try { execFileSync("which", [b], { stdio: "ignore" }); return true; } catch { return false; } });
  if (!soffice) throw new Error("LibreOffice (soffice) est requis pour les PDF");
  const profile = join(tmpdir(), `lo-profile-lu-et-retenu-${process.pid}`);
  execFileSync(soffice, [`-env:UserInstallation=file://${profile}`, "--headless", "--norestore", "--convert-to", "pdf", "--outdir", pdfDir, ...docs.map((x) => join(docx, `${x.name}.docx`))], { stdio: "pipe", timeout: 600_000 });
  rmSync(profile, { recursive: true, force: true });
  for (const doc of docs) {
    if (doc.docx) cpSync(join(docx, `${doc.name}.docx`), join(out, `${doc.name}.docx`));
    if (!existsSync(join(pdfDir, `${doc.name}.pdf`))) throw new Error(`PDF manquant : ${doc.name}`);
    cpSync(join(pdfDir, `${doc.name}.pdf`), join(out, `${doc.name}.pdf`));
  }
  const reg = registerRows(d, report);
  writeFileSync(join(out, `${names.register}.xlsx`), await xlsx("Registre", reg, [26, 22, 16, 16, 16, 30, 18, 30]));
  writeFileSync(join(out, `${names.register}.csv`), "﻿" + reg.slice(0, 1).map(csvLine).join("\r\n") + "\r\n");
  writeFileSync(join(out, "questions-outil-quiz.csv"), quizCsv(order, d, report));
  writeFileSync(join(out, "questions-moodle.gift.txt"), gift(order, d, report));
  const zip = join(dir, "output", `${outName}.zip`);
  execFileSync("find", [outName, "-exec", "touch", "-d", "2026-10-14T00:00:00Z", "{}", "+"], { cwd: join(dir, "output") });
  execFileSync("zip", ["-X", "-r", "-q", `${outName}.zip`, outName], { cwd: join(dir, "output") });
  const list = (p: string): string[] => readdirSync(p, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? list(join(p, e.name)).map((x) => `${e.name}/${x}`) : [e.name]));
  const sha256 = createHash("sha256").update(readFileSync(zip)).digest("hex");
  writeFileSync(join(dir, "output", "manifest.json"), JSON.stringify({ order_id: order.order_id, zip: `${outName}.zip`, sha256, files: list(out).sort() }, null, 2) + "\n");
  return { zip, files: list(out).sort(), sha256 };
}
