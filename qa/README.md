# QA of the public sample (reading engine)

Since 2026-10-16 `engine/` imports READ FRANCE's reading engine (`@read-france/reading-engine`, VREAD-corp/vread-reading-engine,
pinned to a commit in package.json) instead of the acquiz copy: PDF/DOCX extraction, segmenter, answer presence, quote
location, duplicates, and the historical **cold-answer gate** and form rules of vread-workflow-def (snapshot `a5df9a9`).
Two offline steps join the fulfilment (no model key, no network): `engine/cli.ts cold <orderDir>` (prompts: document
title + question, never the document) and `engine/cli.ts judge <orderDir>` (MC answers vs key); `check` then fails
on any leak or on a missing or stale cold answer.

## Sample « modèles officiels » (16 questions on 2 Code du travail numérique templates)

| | Round 0 (2026-10-14 draft) | Final |
|---|---|---|
| Static gates | 16/16 | 16/16 |
| Form rules (new) | Q3 over 160 characters, Q10 a closed (yes/no) question | 0 |
| Cold-answer gate (memory: document title + question) | **14 of 16** answered right without the document | **16/16 pass** |

Why so many at round 0: the harassment poster copies article 222-33 of the code pénal word for word and the other
template is a list of legal obligations, so any question on their legal content is answered from legal knowledge.
The 14 items were rewritten in 4 rounds onto what is specific to each document (its own headings and order, the
fields the employer fills in, its instructions to the reader); 6 leaked again in round 2 and 1 in round 3. On a
customer's own documents (the paid service) the questions are naturally specific; the gate runs on every order.
Files: `qa/cold/` (round-0 prompts and answers), `samples/modeles-officiels/work/cold.*` (final), `work/check.json`.
