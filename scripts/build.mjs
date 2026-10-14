#!/usr/bin/env node
// Static build of the Lu et Retenu site: site/ -> docs/ (GitHub Pages, served at https://outils.vread.fr/lu-et-retenu/).
// The buy UI (commander, commande, envoyer pages and the checkout scripts) exists only when sales.config.json has
// SALES_OPEN true. SALES_CONFIG and SALES_ALLOW_TEST=1 let the e2e tests build against a sandbox endpoint (pk_test_).
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { BRAND, CONTACT, ENDORSE, SAMPLE_SOURCES, SITE, SITE_BASE, SITE_ORIGIN, TERMS_DATE, TERMS_VERSION, UPDATED, commandeBody, commanderBody, envoyerBody, homeBody } from '../site/content.mjs';
import { cgvBody, mentionsBody, privacyBody } from '../site/legal.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(process.env.SITE_OUT || join(ROOT, 'docs'));
const ENDPOINT_RE = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/;

export function loadSalesConfig() {
  const file = process.env.SALES_CONFIG || join(ROOT, 'sales.config.json');
  const c = JSON.parse(readFileSync(file, 'utf8'));
  const fail = (m) => { throw new Error(`${file}: ${m}`); };
  if (typeof c.SALES_OPEN !== 'boolean') fail('SALES_OPEN must be true or false');
  if (c.VAT !== 'franchise293B') fail("VAT must be 'franchise293B' (prices are net)");
  const want = { 'lu-et-retenu-149': 14900, 'lu-et-retenu-199': 19900, 'lu-et-retenu-acquimetre-59': 5900 };
  if (!c.products || JSON.stringify(c.products) !== JSON.stringify(want)) fail(`products must be ${JSON.stringify(want)} (Config.js of octave-checkout is the authority)`);
  if (c.product !== 'lu-et-retenu-149' || c.amount !== c.products['lu-et-retenu-149']) fail('product/amount must be the default offer lu-et-retenu-149');
  if (c.termsVersion !== TERMS_VERSION) fail(`termsVersion must be ${TERMS_VERSION}`);
  if (c.SALES_OPEN) {
    const test = process.env.SALES_ALLOW_TEST === '1';
    if (!ENDPOINT_RE.test(c.endpoint ?? '') && !(test && /^https?:\/\/[^\s"'<>]+\/exec$/.test(c.endpoint ?? ''))) fail('SALES_OPEN=true needs the Apps Script /exec endpoint');
    if (!/^pk_live_[A-Za-z0-9]+$/.test(c.publishableKey ?? '') && !(test && /^pk_test_[A-Za-z0-9]+$/.test(c.publishableKey ?? ''))) fail('SALES_OPEN=true needs a live publishable key');
  }
  return c;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** French typography in TEXT nodes only (never inside tags, scripts or styles): no-break space before ? : ; ! » and after «. */
export function frType(html) {
  return html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>)/g).map((part, i) => {
    if (i % 2 === 1) return part;
    return part.replace(/ ([?:;!»])/g, ' $1').replace(/« /g, '« ');
  }).join('');
}

const SALES = loadSalesConfig();
const OPEN = SALES.SALES_OPEN === true;
const CRO_API = OPEN || ENDPOINT_RE.test(SALES.endpoint ?? '') ? SALES.endpoint : 'https://script.google.com/macros/s/AKfycbzD1IRL8QALluKGZxgGiORFP6-DkC_qFJYR9aOxZiimxa06nbCqpzUI-9iLblp6V2VY/exec';
const CRO_CTA = "a[href*='commander'],#pay-button,#upload-done";
const origin = (u) => { try { return new URL(u).origin; } catch { return ''; } };
const extraOrigin = (() => { const o = origin(SALES.endpoint); return o && o !== 'https://script.google.com' ? ` ${o}` : ''; })();
const CHECKOUT_CSP = `default-src 'self'; script-src 'self' https://js.stripe.com https://*.js.stripe.com; frame-src https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com https://link.com https://*.link.com; connect-src 'self' https://script.google.com https://script.googleusercontent.com${extraOrigin} https://api.stripe.com https://link.com https://*.link.com; img-src 'self' data: https://*.stripe.com https://*.link.com; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`;
const PLAIN_CSP = `default-src 'self'; script-src 'self'; connect-src 'self' https://script.google.com https://script.googleusercontent.com${extraOrigin}; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'`;

// The sample deliverable (built by `npm run sample`) and its two source documents are published under /exemple/.
const SAMPLE_DIR = join(ROOT, 'samples/modeles-officiels');
const manifest = JSON.parse(readFileSync(join(SAMPLE_DIR, 'output/manifest.json'), 'utf8'));
const sampleOut = join(SAMPLE_DIR, 'output', manifest.zip.replace(/\.zip$/, ''));
const zipBytes = statSync(join(SAMPLE_DIR, 'output', manifest.zip)).size;
const check = JSON.parse(readFileSync(join(SAMPLE_DIR, 'work/check.json'), 'utf8'));
if (!check.ok) throw new Error('sample: gates not passed');
const sample = { zip: manifest.zip, zipKb: Math.round(zipBytes / 1024), files: manifest.files.length, questions: check.counts.items, sections: check.counts.sections };
const P = SALES.products;
const prices = { std: P['lu-et-retenu-149'], std2: P['lu-et-retenu-199'], acq: P['lu-et-retenu-acquimetre-59'], open: OPEN, sample };

function layout({ path, title, description, body, jsonld = [], noindex = false, head = '', tail = '' }) {
  const url = SITE + path;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta name="theme-color" content="#7a3e1d">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="styles.css">
${head}<script src="xp.js"></script>
<script src="cro.js" data-site="lu-et-retenu" data-api="${CRO_API}" data-hosts="outils.vread.fr" data-cta="${CRO_CTA}"></script>
<script src="mesure.js" defer></script>
<script src="cro-goals.js" defer></script>
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>
<body>
<a class="skip" href="#main">Aller au contenu</a>
<header class="top"><div class="wrap">
  <a class="brand" href="./"><img src="favicon.svg" width="28" height="28" alt="">${BRAND}<span class="endorse">${ENDORSE}</span></a>
  <nav class="main" aria-label="Navigation principale"><a href="./#exemple">Exemple</a><a href="./#prix">Prix</a><a href="./#questions">Questions</a>${OPEN ? '<a href="commander.html">Commander</a>' : ''}</nav>
</div></header>
<main id="main">
${frType(body)}
</main>
<footer class="foot"><div class="wrap">
  <p><strong>${BRAND}, ${ENDORSE}</strong> : questionnaires de lecture tirés de vos documents d’accueil, une activité de READ FRANCE, l’éditeur de Vread. READ FRANCE SAS (SIREN 988 741 773), 11 rue Rouvet, 75019 Paris. Contact : <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
  <p class="foot-links"><a href="mentions-legales.html">Mentions légales</a><a href="cgv-pro.html">CGV professionnels</a><a href="confidentialite.html">Confidentialité</a><a href="https://outils.vread.fr/acquimetre/">Acquimètre</a></p>
  <p class="small">Ce service ne donne pas de conseil juridique. Les textes de loi cités sont ceux du Code du travail numérique (code.travail.gouv.fr), consultés le 14 octobre 2026.</p>
</div></footer>
${tail}</body>
</html>
`;
}

const seller = { '@type': 'Organization', name: 'READ FRANCE SAS' };
const serviceLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Lu et Retenu : questionnaire de lecture de vos documents d’accueil',
  serviceType: 'Rédaction de questionnaires de lecture et d’attestations à partir des documents internes du client',
  description: 'À partir de 1 à 3 documents (règlement intérieur, livret d’accueil, consignes de sécurité ; 60 pages au plus) : questionnaire de 8 à 20 questions avec passages cités, corrigé, attestation de lecture à signer, registre et fichiers pour outil de quiz. Livraison par e-mail sous 5 jours ouvrés. Sans conseil juridique.',
  url: SITE,
  areaServed: { '@type': 'Country', name: 'France' },
  audience: { '@type': 'BusinessAudience', name: 'Organismes de formation, établissements médico-sociaux et employeurs' },
  provider: { '@type': 'Organization', name: 'READ FRANCE SAS', url: 'https://outils.vread.fr/', email: CONTACT, address: { '@type': 'PostalAddress', streetAddress: '11 rue Rouvet', postalCode: '75019', addressLocality: 'Paris', addressCountry: 'FR' } },
  offers: [
    { '@type': 'AggregateOffer', name: 'Tarif standard, 1 à 3 documents (prix en test)', lowPrice: (prices.std / 100).toFixed(2), highPrice: (prices.std2 / 100).toFixed(2), offerCount: 2, priceCurrency: 'EUR', availability: OPEN ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder', url: SITE + (OPEN ? 'commander.html' : ''), eligibleCustomerType: 'https://schema.org/Business', seller },
    { '@type': 'Offer', name: 'Tarif clients d’Acquimètre, 1 à 3 documents', price: (prices.acq / 100).toFixed(2), priceCurrency: 'EUR', availability: OPEN ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder', url: SITE + (OPEN ? 'commander.html?offre=acquimetre' : ''), eligibleCustomerType: 'https://schema.org/Business', seller },
  ],
};
const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    ['Quels documents pouvez-vous traiter ?', 'Tout document remis à l’arrivée d’une personne : règlement intérieur des stagiaires ou du personnel, livret d’accueil, consignes de sécurité, procédure incendie, charte informatique, avec un texte sélectionnable (pas une photo).'],
    ['Le questionnaire valide-t-il notre règlement intérieur ?', 'Non. Ce questionnaire ne vaut pas validation juridique de votre règlement : nous n’en contrôlons pas la légalité. Une signature prouve la remise ; quelques questions montrent la lecture.'],
    ['Recevez-vous les réponses des salariés ou des stagiaires ?', 'Non. Vous remettez le questionnaire vous-même, sur papier ou dans votre outil, et vous gardez les réponses.'],
    ['Et si la livraison dépasse 5 jours ouvrés ?', 'Si l’archive n’est pas livrée 10 jours ouvrés après votre envoi complet, vous pouvez demander le remboursement intégral (article 6 des CGV).'],
  ].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
};

const T = `${BRAND}, ${ENDORSE}`;
const PAGES = [
  { path: '', file: 'index.html', title: 'Lu et Retenu : questionnaire de lecture de votre règlement intérieur et de votre livret d’accueil', description: `De 1 à 3 documents d’accueil, nous tirons un questionnaire de 8 à 20 questions avec passages cités, corrigé et attestation de lecture à signer. ${prices.std / 100} € net, livraison sous 5 jours ouvrés. Exemple complet téléchargeable.`, body: homeBody(prices), jsonld: [serviceLd, faqLd] },
  { path: 'cgv-pro.html', file: 'cgv-pro.html', title: `Conditions générales de vente aux professionnels – ${T}`, description: `CGV B2B de la prestation Lu et Retenu, version du ${TERMS_DATE}, référence ${TERMS_VERSION}.`, body: cgvBody(prices) },
  { path: 'mentions-legales.html', file: 'mentions-legales.html', title: `Mentions légales – ${T}`, description: 'Éditeur, hébergement et licences du site Lu et Retenu (READ FRANCE SAS).', body: mentionsBody() },
  { path: 'confidentialite.html', file: 'confidentialite.html', title: `Confidentialité – ${T}`, description: 'Données de commande, documents envoyés (supprimés 90 jours après la livraison), aucune réponse reçue, mesure d’audience sans cookie.', body: privacyBody(prices) },
  { path: '404.html', file: '404.html', title: `Page introuvable – ${T}`, description: 'Page introuvable.', body: '<section class="wrap"><h1>Page introuvable</h1><p><a href="./">Retour à l’accueil de Lu et Retenu</a></p></section>', noindex: true },
];
if (OPEN) {
  PAGES.push(
    { path: 'commander.html', file: 'commander.html', title: `Commander – ${T} (vente aux professionnels)`, description: `Commande d’un questionnaire de lecture : ${prices.std / 100} € net, ou ${prices.acq / 100} € pour les clients d’Acquimètre. Paiement par carte avec Stripe.`, body: commanderBody(prices), noindex: true, head: `<meta http-equiv="Content-Security-Policy" content="${CHECKOUT_CSP}">\n`, tail: '<script src="checkout/checkout-config.js"></script>\n<script src="checkout/commander-xp.js"></script>\n<script src="https://js.stripe.com/v3/"></script>\n<script src="checkout/commander-extra.js"></script>\n<script src="checkout/pay.js"></script>\n' },
    { path: 'commande.html', file: 'commande.html', title: `Votre commande – ${T}`, description: 'Confirmation du paiement et lien d’envoi des documents.', body: commandeBody(), noindex: true, head: `<meta http-equiv="Content-Security-Policy" content="${PLAIN_CSP}">\n<meta name="referrer" content="no-referrer">\n`, tail: '<script src="checkout/checkout-config.js"></script>\n<script src="checkout/eval-order.js"></script>\n<script src="checkout/order.js"></script>\n' },
    { path: 'envoyer.html', file: 'envoyer.html', title: `Envoyer vos documents – ${T}`, description: 'Dépôt sécurisé des documents d’une commande Lu et Retenu.', body: envoyerBody(), noindex: true, head: `<meta http-equiv="Content-Security-Policy" content="${PLAIN_CSP}">\n<meta name="referrer" content="no-referrer">\n`, tail: '<script src="checkout/checkout-config.js"></script>\n<script src="checkout/upload.js"></script>\n' },
  );
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'exemple'), { recursive: true });
const write = (rel, content) => { mkdirSync(dirname(join(OUT, rel)), { recursive: true }); writeFileSync(join(OUT, rel), content); };
for (const p of PAGES) write(p.file, layout(p));
for (const f of ['styles.css', 'favicon.svg', 'mesure.js', 'cro.js', 'cro-goals.js', 'xp.js', 'apercu-questionnaire.png']) copyFileSync(join(ROOT, 'site/assets', f), join(OUT, f));
if (OPEN) {
  for (const f of ['pay.js', 'order.js']) { mkdirSync(join(OUT, 'checkout'), { recursive: true }); copyFileSync(join(ROOT, 'site/checkout', f), join(OUT, 'checkout', f)); }
  for (const f of ['commander-extra.js', 'commander-xp.js', 'eval-order.js', 'upload.js']) copyFileSync(join(ROOT, 'site/assets', f), join(OUT, 'checkout', f));
  const offers = Object.fromEntries(Object.entries(P).map(([id, amount]) => [id, { amount, termsVersion: TERMS_VERSION }]));
  write('checkout/checkout-config.js', `// Generated by scripts/build.mjs from sales.config.json. Public by design.\nwindow.OCTAVE_PAY = ${JSON.stringify({ endpoint: SALES.endpoint, publishableKey: SALES.publishableKey, product: 'lu-et-retenu-149', offers, currency: 'eur', termsVersion: TERMS_VERSION, termsUrl: `${SITE}cgv-pro.html`, orderPage: 'commande.html', payLabel: 'Payer {prix} et recevoir le lien d’envoi', laterText: 'Si vous fermez cette page, votre commande est tout de même enregistrée dans les 10 minutes : la facture et le lien d’envoi de vos documents arrivent par e-mail.', quotesEnabled: false })};\n`);
}
// Sample: the full ZIP, the main PDFs and the two source documents (etalab-2.0).
copyFileSync(join(SAMPLE_DIR, 'output', manifest.zip), join(OUT, 'exemple', manifest.zip));
for (const f of ['1-questionnaire-de-lecture.pdf', '2-corrige-et-passages-cites.pdf', '3-attestation-lecture-comprehension.pdf']) copyFileSync(join(sampleOut, f), join(OUT, 'exemple', f));
for (const s of SAMPLE_SOURCES) copyFileSync(join(SAMPLE_DIR, 'input', s.file === 'modele-affichage-harcelement-sexuel' ? 'D01' : 'D02', `${s.file}.pdf`), join(OUT, 'exemple', `${s.file}.pdf`));
write('exemple/LICENCE.txt', `Documents sources de cet exemple : ministère du Travail, Code du travail numérique (https://code.travail.gouv.fr),\n${SAMPLE_SOURCES.map((s) => `- « ${s.title} » (mis à jour le ${s.updated}) : ${s.url}`).join('\n')}\ntéléchargés le 14/10/2026, réutilisés sous Licence Ouverte etalab 2.0 (https://www.etalab.gouv.fr/licence-ouverte-open-licence/),\nreproduits sans modification et convertis de DOCX en PDF.\nQuestionnaire, corrigé, attestation, registre et autres fichiers de l'exemple : READ FRANCE SAS (Lu et Retenu), 14/10/2026.\n`);
const indexable = PAGES.filter((p) => !p.noindex);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((p) => `<url><loc>${SITE}${p.path}</loc><lastmod>${UPDATED}</lastmod></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
write('.nojekyll', '');
if (!existsSync(join(OUT, 'index.html'))) throw new Error('no index');
console.log(`built ${PAGES.length} pages into ${OUT} (SALES_OPEN=${OPEN}) for ${SITE_ORIGIN}${SITE_BASE}`);
