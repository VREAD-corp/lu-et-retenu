# Lu et Retenu, par READ FRANCE

Reading questionnaires, answer keys and signed reading attestations written from a customer's own onboarding
documents (règlement intérieur for trainees or staff, livret d'accueil, safety instructions).
A READ FRANCE SAS service (venture V4-53 of `octave-asset-ventures`), « une activité de READ FRANCE, l'éditeur de Vread ».

- **Site:** https://outils.vread.fr/lu-et-retenu/ (GitHub Pages from `docs/`, built by `npm run build`)
- **Price:** 149 € net (A/B test `ler-prix`: 199 € on alternate days, Paris calendar) for 1 to 3 documents, 60 pages in
  total; 59 € for organisations that already ordered Acquimètre (order reference `ok_…` or a self-declaration).
  TVA non applicable, art. 293 B du CGI. French businesses only (SIREN).
- **Payments, invoices, uploads, alerts:** `VREAD-corp/octave-checkout` (Apps Script web app, products
  `lu-et-retenu-149`, `lu-et-retenu-199`, `lu-et-retenu-acquimetre-59`, kind `service`, `gas/src/Eval.js`).
  Terms: `cgv-pro-lu-et-retenu-2026-10-14` (`cgv-pro.html`).
- **What we never do:** legal advice on the documents (every deliverable says « ce questionnaire ne vaut pas validation
  juridique de votre règlement »), hosting the questionnaire, receiving staff or trainee answers. The customer hands the
  questionnaire out (paper or their own tool) and keeps the answers.

## Order flow

1. The customer pays on `commander.html` (Stripe Payment Element, card only, never a Checkout Session). Extra order
   fields: `courses` (number of documents, 1–3), `rightsAttested`, and for the 59 € product `acqOrder` / `acqDeclared`.
   The invoice (F-YYYY-NNNN) and a personal upload link arrive by e-mail; `commande.html` also shows the link.
2. `envoyer.html?commande=…&cle=…` uploads PDF/DOCX/PPTX files (15 MB each), document 1 to 3 with a title, into a private
   Drive folder per order (the founder's account; never shared). « J'ai tout envoyé » sets the due date
   (5 working days) and alerts Vincent.
3. Octave fulfils offline (no LLM at runtime):

   ```bash
   # in octave-checkout (ops secret in ~/.config/octave/acquimetre-ops.env, mode 600)
   node gas/scripts/eval-ops.mjs list
   node gas/scripts/eval-ops.mjs pull ok_… /path/orders            # writes /path/orders/ok_…/C01/… + order.json
   # in this repo: move them under <orderDir>/input/ (order.json + one folder per document; `course` = document number)
   npx tsx engine/cli.ts extract /path/orders/ok_…                  # work/Dxx/extract.txt to read
   #   write work/draft.json: documents with their sections, then 8–20 items (doc, section, question, answer,
   #   choices for an MCQ, verbatim source_quote, explanation = what to re-read when wrong); one question per section at least
   npx tsx engine/cli.ts cold   /path/orders/ok_…                   # cold-answer prompts (document title + question only)
   #   an agent that has NOT seen the documents answers work/cold.answers.jsonl; then `judge` for the MC answers
   npx tsx engine/cli.ts check  /path/orders/ok_…                   # reading-engine gates; any failure stops
   npx tsx engine/cli.ts render /path/orders/ok_…                   # DOCX + PDF + XLSX + CSV + GIFT -> output/lu-et-retenu-ok_….zip
   node gas/scripts/eval-ops.mjs deliver ok_… /path/orders/ok_…/output/lu-et-retenu-ok_….zip "summary"
   ```

   Above 60 pages in total, `extract` prints a warning: write to the customer before drafting (CGV art. 3).

## Engine (`engine/`)

- Text extraction and the gates come from **READ FRANCE's reading engine** (`@read-france/reading-engine`,
  VREAD-corp/vread-reading-engine, a git dependency pinned to a commit): the in-house parsers, segmenter and QA gates
  of vread-workflow-def (pre-Octave snapshot `a5df9a9`), including the **cold-answer gate** now run on every order
  (`engine/qa.ts`, see [qa/README.md](qa/README.md)). It replaced, on 2026-10-16, the copy vendored from
  `VREAD-corp/acquiz`; item rules (`engine/lib/gen/schema.ts`) and PPTX extraction stay local. Lu et Retenu adds the
  coverage rule (every section of every document has a question) and the 8–20 size rule.
- Deliverable per order: `1-questionnaire-de-lecture` (to hand out), `2-corrige-et-passages-cites` (answer, page and quoted
  passage, what to re-read), `3-attestation-lecture-comprehension` (one per person, signed by the person and the
  organisation), `4-registre.xlsx/.csv`, `questions-outil-quiz.csv` (Google Forms or any quiz tool),
  `questions-moodle.gift.txt` (Moodle import), `5-modele-note-information`, `00-lisez-moi.pdf`.
- Documents go through the Kit Qualiopi chain: Markdown → DOCX (`engine/md2docx.mjs`) → PDF (LibreOffice headless).
  The XLSX is written by `engine/xlsx.ts` on jszip (no other dependency).

## Public sample

`samples/modeles-officiels/`: two official models of the Code du travail numérique (ministère du Travail, licence
etalab 2.0), downloaded on 2026-10-14 and kept unmodified in `source/` (DOCX) and `input/` (PDF conversion):
« Affichage obligatoire relatif au harcèlement sexuel » (updated 01/08/2022) and « Informations principales relatives à
la relation de travail délivrées au salarié » (updated 09/07/2024). 16 questions on 13 sections, 16/16 gates passed.
`npm run sample` rebuilds it; the build publishes the ZIP, three PDFs and the two sources under `docs/exemple/`.

## Tracking

`mesure.js` = the octave-checkout master (v:2, bot/webdriver filtering, `?octave_notrack=1`) with the site id fixed to
`lu-et-retenu`; `cro.js` byte-identical; A/B `ler-prix` (`site/assets/xp.js`, `commander-xp.js` swaps the radio before
pay.js); goals `download`, `sample` (same click, the name shared by the 7 reading sites), `checkout`, `intake` (`cro-goals.js`).
Pooled test **POOLED-READING-01** (`rd-hero`, by tab, home only, `?hero=b`): variant b shows a verbatim excerpt of the
free sample (question 2 and its answer-key line) in place of the page-1 thumbnail; analysed across the 7 reading sites in
`vread-revenue-lab` (`octave-asset-ventures/experiments/POOLED-READING-01.md`). Primary CTAs and sample links carry `data-cta`. The site, the experiment and the goal must be
whitelisted in octave-checkout (`TRACK_SITES_`, `PAID_PAGE_`, `CRO_EXPERIMENTS_`, `CRO_GOALS_`).

## Tests

- `npm test`: build + engine tests (sample 16/16, gates catching a made-up quote, a quote from the wrong document, an
  absent answer, a duplicate and an uncovered section, size rule, XLSX) + site tests (links, JSON-LD, legal limits,
  vendored scripts = octave-checkout master, prices = catalog, open and closed builds).
- `SALES_CONFIG=<file> SALES_ALLOW_TEST=1 SITE_OUT=<dir> node scripts/build.mjs` builds against a sandbox endpoint and a
  `pk_test_` key for the octave-checkout sandbox e2e.
- Writing: `node ../vread-revenue-lab/content/lint-ia.mjs --min 85 docs/`.
