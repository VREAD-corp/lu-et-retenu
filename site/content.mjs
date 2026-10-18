// Lu et Retenu public site: page bodies (French). Legal facts were read on code.travail.gouv.fr on 14 October 2026
// (analysis V4-53 §1); the sample is real (samples/modeles-officiels, two official models under licence etalab-2.0).
export const BRAND = 'Lu et Retenu';
export const ENDORSE = 'par READ FRANCE';
export const SITE_ORIGIN = 'https://outils.vread.fr';
export const SITE_BASE = '/lu-et-retenu/';
export const SITE = SITE_ORIGIN + SITE_BASE;
export const CONTACT = 'octave@vread.fr';
export const TERMS_VERSION = 'cgv-pro-lu-et-retenu-2026-10-14';
export const TERMS_DATE = '14 octobre 2026';
export const UPDATED = '2026-10-14';
export const SELLER = {
  name: 'READ FRANCE SAS',
  form: 'société par actions simplifiée (SAS)',
  capital: '1 000 €',
  address: '11 rue Rouvet, 75019 Paris, France',
  siren: '988 741 773',
  rcs: 'RCS Paris 988 741 773',
  president: 'Tanguy Warsmann',
};
export const ACQUIMETRE_URL = 'https://outils.vread.fr/acquimetre/';
export const CTN = 'https://code.travail.gouv.fr';
export const LAW = {
  of_ri: `${CTN}/code-du-travail/l6352-3`,
  of_remise: `${CTN}/code-du-travail/l6353-8`,
  ri_50: `${CTN}/code-du-travail/l1311-2`,
  ri_effet: `${CTN}/code-du-travail/l1321-4`,
  fiche_ri: `${CTN}/fiche-ministere-travail/le-reglement-interieur`,
  securite: `${CTN}/code-du-travail/l4141-2`,
  cse: `${CTN}/code-du-travail/l2312-38`,
  info_salarie: `${CTN}/code-du-travail/l1222-4`,
};
export const SAMPLE_SOURCES = [
  { title: 'Modèle – Affichage obligatoire relatif au harcèlement sexuel', url: `${CTN}/modeles-de-courriers/affichage-obligatoire-relatif-au-harcelement-sexuel`, updated: '01/08/2022', file: 'modele-affichage-harcelement-sexuel' },
  { title: 'Modèle – Informations principales relatives à la relation de travail délivrées au salarié', url: `${CTN}/modeles-de-courriers/informations-principales-relatives-a-la-relation-de-travail-delivrees-au-salarie`, updated: '09/07/2024', file: 'modele-informations-principales-relation-de-travail' },
];
export const ETALAB = 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/';

export const ABOUT_URL = 'https://outils.vread.fr/a-propos/';

const eur = (cents) => `${String(cents / 100).replace('.', ',')} €`;
const ext = (href, text) => `<a href="${href}" rel="noopener">${text}</a>`;

// Refund and replacement terms, quoted from the CGV (articles 6, 8 and 10); shown next to the buy buttons.
export const GUARANTEE = '<p class="guarantee small"><strong>Si nous sommes en retard :</strong> archive non livrée 10 jours ouvrés après votre envoi complet, remboursement intégral sur simple demande (CGV, article 6). <strong>Si une question est fausse ou ambiguë :</strong> signalez-la dans les 30 jours, nous la remplaçons sans frais (article 10). Vente entre professionnels : pas de droit de rétractation (article 8).</p>';

/** FAQ of the home page: the same array feeds the visible questions and the FAQPage JSON-LD (1:1). */
export const FAQ = [
  { id: 'q-documents', q: 'Quels documents pouvez-vous traiter ?', a: 'Tout document que vous remettez à l’arrivée d’une personne : règlement intérieur des stagiaires ou du personnel, livret d’accueil (stagiaire, salarié, intérimaire), consignes de sécurité, procédure incendie, charte informatique. Le texte doit être sélectionnable : un PDF issu de Word ou un DOCX, pas une photo.' },
  { id: 'q-juridique', q: 'Le questionnaire valide-t-il notre règlement intérieur ?', a: 'Non. Ce questionnaire ne vaut pas validation juridique de votre règlement : nous n’en contrôlons pas la légalité. Une signature prouve la remise ; quelques questions montrent la lecture.' },
  { id: 'q-reponses', q: 'Recevez-vous les réponses des salariés ou des stagiaires ?', a: 'Non. Vous remettez le questionnaire vous-même, sur papier ou dans votre outil, et vous gardez les réponses.' },
  { id: 'q-of', q: 'Nous sommes un organisme de formation : à quoi cela sert-il ?', a: 'Vous remettez déjà le règlement intérieur avant l’inscription définitive (article L6353-8). Le questionnaire, rempli le premier jour, montre que le stagiaire l’a lu, et la feuille d’attestation se range dans son dossier avec le reste. Nous ne disons pas qu’un auditeur l’exige.' },
  { id: 'q-cse', q: 'Faut-il prévenir les salariés ou le CSE ?', a: `Prévenez les personnes concernées : l’archive contient un modèle de note d’information. Dans une entreprise d’au moins 50 salariés, le CSE est informé et consulté sur les moyens permettant un contrôle de l’activité des salariés (<a href="${LAW.cse}" rel="noopener">article L2312-38</a>), et aucune information personnelle ne peut être collectée par un dispositif non porté d’abord à la connaissance du salarié (<a href="${LAW.info_salarie}" rel="noopener">article L1222-4</a>). Un questionnaire de lecture entre-t-il dans ce cadre ? Nous ne tranchons pas : c’est une question à poser à votre conseil.` },
  { id: 'q-medico', q: 'Nous sommes un EHPAD ou un service d’aide à domicile, avec beaucoup d’arrivées dans l’année.', a: `Le même questionnaire sert à chaque arrivée, intérim compris. Il peut porter sur votre livret d’accueil et sur vos consignes de sécurité, que l’employeur explique à chaque embauche dans le cadre de la formation à la sécurité (<a href="${LAW.securite}" rel="noopener">article L4141-2</a>).` },
  { id: 'q-modifier', q: 'Pouvons-nous modifier les questions et les réutiliser ?', a: 'Oui. Les DOCX, le registre et les fichiers pour votre outil vous appartiennent pour votre usage interne, pour la durée des droits, à remettre à tous vos salariés, stagiaires et intervenants : modifiez, retirez, ajoutez (CGV, article 9). Seule la revente à des tiers est exclue. Si vous changez de règlement, une nouvelle commande reprend la nouvelle version.' },
  { id: 'q-facture', q: 'Faites-vous un devis ? Peut-on payer par virement ?', a: `Le paiement se fait par carte bancaire uniquement, au comptant (CGV, article 5) : pas de virement ni de bon de commande pour l’instant. La facture acquittée, à votre raison sociale et à votre SIREN, arrive par e-mail dès le paiement. Si votre service achats demande un devis avant de payer, écrivez à <a href="mailto:${CONTACT}">${CONTACT}</a>.` },
  { id: 'q-delai', q: 'Et si la livraison dépasse 5 jours ouvrés ?', a: 'Si l’archive n’est pas livrée 10 jours ouvrés après votre envoi complet, vous pouvez demander le remboursement intégral (article 6 des CGV).' },
];

/** Variant b of the pooled test POOLED-READING-01 (cro.js id rd-hero): a verbatim excerpt of the free sample in the
 * hero (question 2 of the questionnaire, p. 1, and its line of the answer key, p. 2), in place of the page-1
 * thumbnail of variant a (right column on desktop, right after the buttons on mobile). Hidden unless
 * <html data-xp-rd-hero="b"> (styles.css). */
function heroExcerpt() {
  const choices = ['a) Seul le premier auteur peut être concerné', 'b) Il faut que la victime ait porté plainte avant', 'c) Il n’y a rien à signaler puisque chacun n’a parlé qu’une fois', 'd) L’infraction peut être constituée, même sans concertation entre eux'];
  return `<figure class="hero-excerpt" data-hero-excerpt>
        <div class="ex-paper">
          <p class="ex-doc">D01 Affichage obligatoire : lutte contre le harcèlement sexuel</p>
          <p class="ex-q">2. Plusieurs collègues font chacun une seule remarque de ce type à la même personne, en sachant que d’autres l’ont déjà faite. Que dit l’affichage ?</p>
          <ul class="ex-choices">${choices.map((c) => `<li><span class="ex-box" aria-hidden="true"></span>${c}</li>`).join('')}</ul>
          <p class="ex-key"><strong>Corrigé :</strong> d). « par plusieurs personnes qui, même en l'absence de concertation, savent que ces propos ou comportements caractérisent une répétition » (modele-affichage-harcelement-sexuel.pdf, p. 1). Si la réponse est fausse : Relire le 2° du I : la répétition peut venir de plusieurs personnes.</p>
        </div>
        <figcaption class="small muted">Extrait réel de l’exemple : question 2 du questionnaire (p. 1) et sa ligne du corrigé (p. 2). <a href="exemple/1-questionnaire-de-lecture.pdf" data-mesure="sample_click" data-cta>Ouvrir le questionnaire complet (PDF)</a></figcaption>
      </figure>`;
}

/** Home page. */
export function homeBody(p) {
  const { std, std2, acq, sample, open } = p;
  const cta = open
    ? `<a class="btn btn-primary" href="commander.html" data-cta>Commander : <span data-prix-std>${eur(std)}</span> net</a>`
    : `<a class="btn btn-primary" href="mailto:${CONTACT}?subject=Lu%20et%20Retenu">Écrire pour réserver</a>`;
  return `
<section class="hero" id="haut" data-section="hero">
  <div class="wrap hero-grid">
    <div>
      <p class="kicker">Règlement intérieur, livret d’accueil, consignes de sécurité</p>
      <h1>Un questionnaire de lecture tiré de vos propres documents d’accueil</h1>
      <p class="lead">Vous nous envoyez jusqu’à 3 documents (60 pages en tout). Sous 5 jours ouvrés, vous recevez un questionnaire de 8 à 20 questions, avec le corrigé et une attestation de lecture à faire signer.</p>
      <div class="ctas">${cta}<a class="btn btn-ghost" href="#exemple" data-mesure="sample_click" data-cta>Voir l’exemple gratuit</a></div>
      <p>Une question par section, chacune reliée au passage dont elle vient. Vous remettez le questionnaire vous-même, sur papier ou dans votre outil : nous ne voyons aucune réponse.</p>
      <p class="small muted">Vente aux organismes immatriculés en France (SIREN). TVA non applicable, art. 293 B du CGI. Déjà client d’<a href="${ACQUIMETRE_URL}">Acquimètre</a> : ${eur(acq)}.</p>
    </div>
    <figure class="apercu"><a href="exemple/1-questionnaire-de-lecture.pdf" data-mesure="sample_click" data-cta><img src="apercu-questionnaire.png" width="420" height="594" alt="Page 1 du questionnaire de l’exemple : en-tête à remplir, puis les premières questions sur l’affichage obligatoire relatif au harcèlement sexuel"></a><figcaption class="small muted">Page 1 du questionnaire de l’exemple, tel que livré.</figcaption></figure>
    ${heroExcerpt()}
  </div>
</section>

<section class="enbref" id="en-bref" data-section="en-bref" aria-label="En bref">
  <div class="wrap"><dl class="facts">
    <div><dt>Vous envoyez</dt><dd>1 à 3 documents, 60 pages en tout, en PDF, DOCX ou PPTX avec du texte sélectionnable (pas une photo), sans noms de salariés ni de stagiaires</dd></div>
    <div><dt>Vous recevez</dt><dd>Une archive ZIP par e-mail : questionnaire, corrigé et attestation en DOCX et PDF, registre XLSX et CSV, fichiers pour Google Forms et Moodle</dd></div>
    <div><dt>Délai</dt><dd>5 jours ouvrés après votre clic sur « J’ai tout envoyé ». Au-delà de 10 jours ouvrés, remboursement intégral sur simple demande</dd></div>
    <div><dt>Prix</dt><dd><span data-prix-std>${eur(std)}</span> net par commande, TVA non applicable (art. 293 B du CGI), facture acquittée immédiate. ${eur(acq)} pour les clients d’Acquimètre</dd></div>
  </dl></div>
</section>

<section class="block" id="signature" data-section="signature">
  <div class="wrap">
    <h2>Une signature prouve la remise ; quelques questions montrent la lecture</h2>
    <p>Un organisme de formation établit un règlement intérieur pour ses stagiaires (${ext(LAW.of_ri, 'article L6352-3')}) et le met à leur disposition avant l’inscription définitive (${ext(LAW.of_remise, 'article L6353-8')}). Une entreprise d’au moins 50 salariés en a un aussi (${ext(LAW.ri_50, 'article L1311-2')}) ; la fiche du ministère précise qu’il « doit être communiqué par tout moyen » (${ext(LAW.fiche_ri, 'fiche « Le règlement intérieur »')}). Le texte n’exige pas la signature du salarié, et il n’exige pas de questionnaire non plus.</p>
    <p>Ce que la feuille « lu et approuvé » ne dit pas, c’est quelle règle a été comprise de travers. Le questionnaire le montre section par section : si trois nouveaux arrivants se trompent sur le délai pour prévenir d’une absence, c’est ce paragraphe qu’il faut réexpliquer, ou réécrire.</p>
    <div class="fact"><p><strong>Ce que nous ne faisons pas :</strong> vérifier que votre règlement est conforme à la loi. Chaque livrable porte la mention « ce questionnaire ne vaut pas validation juridique de votre règlement ». Pour cela, voyez votre avocat, votre organisation professionnelle ou les services du ministère du Travail en région.</p></div>
  </div>
</section>

<section class="block" id="contenu" data-section="contenu">
  <div class="wrap">
    <h2>Ce que contient l’archive livrée</h2>
    <div class="tablewrap"><table class="t">
      <thead><tr><th scope="col">Fichier</th><th scope="col">À quoi il sert</th></tr></thead>
      <tbody>
        <tr><td>Questionnaire de lecture (DOCX et PDF)</td><td>8 à 20 questions à choix unique ou à réponse en un mot, rangées par document et par section, avec un en-tête nom, fonction, dates. À remettre en main propre avec les documents.</td></tr>
        <tr><td>Corrigé et passages cités</td><td>La bonne réponse, la page et le passage exact de votre document pour chaque question, et ce qu’il faut revoir quand la réponse est fausse.</td></tr>
        <tr><td>Attestation de lecture et de compréhension</td><td>Une par personne, signée par elle et par vous : « a reçu le…, a lu, a répondu juste à X questions sur Y, points revus ensemble : … ».</td></tr>
        <tr><td>Registre (XLSX et CSV)</td><td>Une ligne par personne : dates de remise et de questionnaire, score, sections revues, date de signature.</td></tr>
        <tr><td>Questions pour votre outil</td><td>Un CSV pour Google Forms ou tout outil de quiz, et un fichier GIFT qui s’importe tel quel dans Moodle.</td></tr>
        <tr><td>Modèle de note d’information</td><td>Le texte à remettre aux personnes concernées : à quoi sert le questionnaire, qui garde les réponses, combien de temps.</td></tr>
      </tbody>
    </table></div>
  </div>
</section>

<section class="block" id="exemple" data-section="exemple">
  <div class="wrap">
    <h2>L’exemple, sur deux modèles officiels du ministère du Travail</h2>
    <p>Pour vous montrer le résultat sans publier le document d’un client, nous avons traité deux modèles que le Code du travail numérique met à disposition : l’affichage obligatoire sur le harcèlement sexuel et le document unique d’informations remis au salarié à l’embauche. ${sample.questions} questions pour 2 documents et ${sample.sections} sections. Tous les contrôles automatiques sont passés.</p>
    <ul class="dl">
      <li><a href="exemple/${sample.zip}" data-mesure="sample_download" data-cta>Archive complète (ZIP, ${sample.zipKb} Ko)</a> <span class="muted small">${sample.files} fichiers : DOCX, PDF, XLSX, CSV, GIFT</span></li>
      <li><a href="exemple/1-questionnaire-de-lecture.pdf" data-mesure="sample_download" data-cta>Questionnaire de lecture (PDF)</a></li>
      <li><a href="exemple/2-corrige-et-passages-cites.pdf" data-mesure="sample_download" data-cta>Corrigé et passages cités (PDF)</a></li>
      <li><a href="exemple/3-attestation-lecture-comprehension.pdf" data-mesure="sample_download" data-cta>Attestation de lecture et de compréhension (PDF)</a></li>
      ${SAMPLE_SOURCES.map((s) => `<li><a href="exemple/${s.file}.pdf">Document source : ${s.title.replace('Modèle – ', '')} (PDF)</a></li>`).join('\n      ')}
    </ul>
    <p class="small muted">Sources : ministère du Travail, Code du travail numérique, ${SAMPLE_SOURCES.map((s) => `« ${ext(s.url, s.title)} » (mis à jour le ${s.updated})`).join(' et ')}, téléchargés le 14/10/2026, réutilisés sous ${ext(ETALAB, 'Licence Ouverte etalab 2.0')}. Les modèles sont reproduits sans modification, convertis en PDF ; les questions, le corrigé et l’attestation sont de READ FRANCE. Les champs « XX » des modèles ne donnent pas lieu à des questions : sur votre document rempli, nous interrogeons aussi vos propres règles (horaires, délais, contacts).</p>
  </div>
</section>

<section class="block" id="deroulement" data-section="deroulement">
  <div class="wrap">
    <h2>Comment se passe une commande</h2>
    <ol class="steps">
      <li><strong>Vous payez en ligne</strong> par carte. La facture acquittée arrive par e-mail avec un lien d’envoi personnel.</li>
      <li><strong>Vous déposez vos documents</strong> sur ce lien : 1 à 3 documents, PDF, DOCX ou PPTX, 15 Mo par fichier. Retirez les noms de salariés ou de stagiaires s’il y en a.</li>
      <li><strong>Nous rédigeons</strong> une question par section au moins. Le délai de 5 jours ouvrés part du clic sur « J’ai tout envoyé ».</li>
      <li><strong>Vous recevez l’archive</strong>, relisez, modifiez si besoin. Une question fausse ou mal posée est remplacée sans frais si vous la signalez dans les 30 jours.</li>
    </ol>
  </div>
</section>

<section class="block" id="prix" data-section="prix">
  <div class="wrap">
    <h2>Prix</h2>
    <div class="grid2">
      <div class="card"><p class="price"><span data-prix-std>${eur(std)}</span> <span class="small muted">net</span></p><p>1 à 3 documents, 60 pages en tout, en une commande. Paiement unique, pas d’abonnement. Pour un nouveau document l’an prochain, vous recommandez.</p>${open ? '<p><a class="btn btn-primary btn-sm" href="commander.html" data-cta>Commander</a></p>' : ''}</div>
      <div class="card"><p class="price">${eur(acq)} <span class="small muted">net</span></p><p>Même prestation pour les organismes qui ont déjà commandé <a href="${ACQUIMETRE_URL}">Acquimètre</a> (évaluations Qualiopi indicateurs 8 et 11) : indiquez la référence de cette commande, ou déclarez-la.</p>${open ? '<p><a class="btn btn-ghost btn-sm" href="commander.html?offre=acquimetre" data-cta>Commander au tarif Acquimètre</a></p>' : ''}</div>
    </div>
    ${GUARANTEE}
    <p class="small muted">TVA non applicable, art. 293 B du CGI : le prix affiché est le prix payé. Le prix standard est en test : selon le jour, la page affiche ${eur(std)} ou ${eur(std2)}, et vous payez le prix affiché sur la page de commande. Vente aux professionnels uniquement (SIREN demandé). <a href="cgv-pro.html">CGV professionnels</a>.</p>
  </div>
</section>

<section class="block" id="limites" data-section="limites">
  <div class="wrap">
    <h2>Les limites du service</h2>
    <ul>
      <li>Nous ne donnons pas d’avis juridique : ni sur le contenu de votre règlement, ni sur les sanctions, ni sur la procédure devant le CSE.</li>
      <li>Nous ne faisons pas passer le questionnaire et nous ne recevons pas les réponses. Pas de compte salarié, pas de plateforme : votre organisme garde tout.</li>
      <li>Le résultat ne doit pas servir à sanctionner. Une réponse fausse désigne une section à revoir avec la personne, et aucune décision n’est prise automatiquement.</li>
      <li>Nous ne lisons pas les documents scannés sans texte. Si un fichier est illisible, nous vous l’écrivons dans les 2 jours ouvrés, avant de commencer.</li>
    </ul>
    <p>Les questions sont rédigées par Octave, l’assistant IA de READ FRANCE SAS, à partir de vos seuls documents, puis contrôlées par programme : chaque passage cité doit se retrouver mot pour mot dans le document, une réponse en un mot doit figurer dans ce passage et pas dans l’énoncé, une question à choix n’a qu’une bonne réponse, deux questions ne se répètent pas. Vous relisez avant usage. <a href="${ABOUT_URL}">Qui fait ce site, et comment</a>.</p>
  </div>
</section>

<section class="block" id="confidentialite" data-section="donnees">
  <div class="wrap">
    <h2>Vos documents</h2>
    <p>Ils sont rangés dans un dossier privé par commande, que seul le compte de READ FRANCE SAS qui traite les commandes peut ouvrir. Ils servent à rédiger votre questionnaire et à rien d’autre : pas de réutilisation pour un autre client, pas d’entraînement d’un modèle d’IA. Ils sont supprimés 90 jours après la livraison, avec l’archive ; la facture est conservée 10 ans. En commandant, vous attestez avoir le droit de nous les transmettre.</p>
  </div>
</section>

<section class="block" id="questions" data-section="faq">
  <div class="wrap">
    <h2>Questions fréquentes</h2>
    ${FAQ.map((f) => `<details id="${f.id}"><summary>${f.q}</summary><p>${f.a}</p></details>`).join('\n    ')}
  </div>
</section>

<section class="block" id="commander-bas" data-section="commander">
  <div class="wrap">
    <h2>Commander</h2>
    <p>${open ? `Paiement par carte, facture immédiate, lien d’envoi de vos documents par e-mail. <a class="btn btn-primary btn-sm" href="commander.html" data-cta>Commander pour <span data-prix-std>${eur(std)}</span></a>` : `Les commandes ouvrent bientôt. Écrivez à <a href="mailto:${CONTACT}">${CONTACT}</a> pour réserver.`}</p>
    ${open ? GUARANTEE : ''}
    <p class="small muted">Une question avant de commander ? Écrivez à <a href="mailto:${CONTACT}">${CONTACT}</a> : réponse sous 1 jour ouvré.</p>
  </div>
</section>`;
}

/** Order page body (Stripe Payment Element; same field names and ids as octave-checkout gas/web/index.html). */
export function commanderBody(p) {
  const { std, acq } = p;
  return `<section class="wrap" aria-labelledby="commander-h">
<h1 id="commander-h">Commander un questionnaire Lu et Retenu</h1>
<p>Questionnaire de lecture, corrigé, attestation et registre, rédigés à partir de 1 à 3 de vos documents (60 pages en tout). Vente réservée aux professionnels (SIREN obligatoire). Après le paiement, vous recevez la facture et le lien d’envoi de vos documents ; la livraison a lieu sous 5 jours ouvrés après votre envoi complet.</p>
<div class="recap card" data-section="recap">
  <a class="recap-img" href="exemple/1-questionnaire-de-lecture.pdf" target="_blank" rel="noopener" data-mesure="sample_download"><img src="apercu-questionnaire.png" width="120" height="170" alt="Page 1 du questionnaire de l’exemple" loading="lazy"></a>
  <div>
    <p><strong>Ce que vous recevez par e-mail</strong>, en une archive ZIP : questionnaire de lecture et corrigé avec passages cités (DOCX et PDF), attestation de lecture à faire signer, registre (XLSX et CSV), questions pour Google Forms ou Moodle, modèle de note d’information. <a href="exemple/1-questionnaire-de-lecture.pdf" target="_blank" rel="noopener" data-mesure="sample_download">Voir le questionnaire de l’exemple (PDF)</a>.</p>
    <p class="small muted"><strong>Ce que vous envoyez ensuite</strong> : 1 à 3 documents en PDF, DOCX ou PPTX, avec du texte sélectionnable et sans noms de salariés ni de stagiaires. Les questions sont rédigées par Octave, l’assistant IA de READ FRANCE, contrôlées par programme, puis relues par vous. <a href="${ABOUT_URL}">Qui fait ce site, et comment</a>.</p>
  </div>
</div>
<form id="octave-pay" class="checkout-form card" data-section="paiement" novalidate>
  <fieldset class="field-group"><legend>Tarif</legend>
    <label class="offer-choice"><input type="radio" name="product" value="lu-et-retenu-149" checked><span><strong>Tarif standard</strong> : <span data-price-for="lu-et-retenu-149">${eur(std)} net (TVA non applicable, art. 293 B du CGI)</span></span></label>
    <label class="offer-choice"><input type="radio" name="product" value="lu-et-retenu-acquimetre-59"><span><strong>Clients d’Acquimètre</strong> : <span data-price-for="lu-et-retenu-acquimetre-59">${eur(acq)} net (TVA non applicable, art. 293 B du CGI)</span></span></label>
    <p class="small muted">Prix retenu : <span id="product-price">${eur(std)} net (TVA non applicable, art. 293 B du CGI)</span></p>
  </fieldset>
  <div id="acq-proof" class="field-group" hidden>
    <label class="field"><span>Référence de votre commande Acquimètre (facultatif, commence par ok_)</span>
      <input type="text" name="acqOrder" data-octave-extra maxlength="40" autocomplete="off" spellcheck="false"></label>
    <label class="check"><input type="checkbox" name="acqDeclared" data-octave-extra="bool"><span>Sans référence : je déclare que l’entreprise ci-dessous a déjà commandé Acquimètre. En cas de déclaration inexacte, la différence de 90 € pourra être facturée (CGV, article 4).</span></label>
  </div>
  <label class="field"><span>Nombre de documents à traiter (1 à 3)</span>
    <input type="number" name="courses" data-octave-extra min="1" max="3" step="1" value="2" required></label>
  <label class="field"><span>E-mail professionnel (facture, lien d’envoi des documents, livraison)</span>
    <input type="email" name="email" autocomplete="email" required maxlength="254"></label>
  <label class="field"><span>Raison sociale</span>
    <input type="text" name="company" autocomplete="organization" required minlength="2" maxlength="200"></label>
  <label class="field"><span>SIREN (9 chiffres)</span>
    <input type="text" name="siren" inputmode="numeric" required pattern="\\s*(\\d\\s*){9}" maxlength="11" aria-describedby="siren-help"></label>
  <p id="siren-help" class="small muted">Le numéro est contrôlé (clé de Luhn) avant tout paiement.</p>
  <fieldset class="field-group"><legend>Adresse de facturation (figure sur la facture)</legend>
    <label class="field"><span>Adresse</span>
      <input type="text" name="addressLine1" autocomplete="address-line1" required minlength="3" maxlength="200"></label>
    <label class="field"><span>Complément d’adresse (facultatif)</span>
      <input type="text" name="addressLine2" autocomplete="address-line2" maxlength="200"></label>
    <label class="field"><span>Code postal</span>
      <input type="text" name="postalCode" autocomplete="postal-code" inputmode="numeric" required pattern="\\s*\\d{5}\\s*" maxlength="7"></label>
    <label class="field"><span>Ville</span>
      <input type="text" name="city" autocomplete="address-level2" required maxlength="100"></label>
    <p class="small muted">Pays : France.</p>
  </fieldset>
  <label class="check"><input type="checkbox" name="rightsAttested" data-octave-extra="bool" required>
    <span>J’atteste que l’entreprise peut nous transmettre ces documents pour qu’ils soient traités, et qu’ils ne contiendront pas de données personnelles de salariés ou de stagiaires (noms, résultats, coordonnées). Je sais que le service ne vérifie pas la conformité juridique des documents.</span></label>
  <label class="check"><input type="checkbox" name="terms" required>
    <span>Je commande au nom et pour le compte de l’entreprise ci-dessus, pour un usage professionnel, et j’accepte les <a id="terms-link" href="cgv-pro.html" target="_blank" rel="noopener">conditions générales de vente aux professionnels</a> (version du ${TERMS_DATE}).</span></label>
  <p id="payment-loading" class="small muted" role="status">Chargement du paiement sécurisé…</p>
  <div id="payment-element"></div>
  <p id="pay-error" class="status err" role="alert" hidden></p>
  <button type="submit" id="pay-button" class="pay-button" disabled>Payer ${eur(std)} et recevoir le lien d’envoi</button>
  ${GUARANTEE}
  <p class="small muted">Paiement sécurisé par carte bancaire avec Stripe : vos données de carte sont saisies dans un cadre Stripe et ne transitent pas par nos serveurs.</p>
  <noscript><p class="status err">Le paiement nécessite JavaScript.</p></noscript>
</form>
<div class="before-pay" data-section="questions-commande">
  <h2>Avant de payer</h2>
  ${FAQ.filter((f) => ['q-facture', 'q-modifier', 'q-documents'].includes(f.id)).map((f) => `<details id="c-${f.id}"><summary>${f.q}</summary><p>${f.a}</p></details>`).join('\n  ')}
</div>
</section>`;
}

export function commandeBody() {
  return `<section class="wrap">
<h1>Votre commande</h1>
<p id="order-status" class="status" role="status" aria-live="polite">Confirmation du paiement…</p>
<p id="order-help" class="muted"></p>
<div id="upload-next" class="card" hidden>
  <h2>Étape suivante : vos documents</h2>
  <p>Le même lien vous a été envoyé par e-mail avec la facture. Vous pouvez déposer vos documents maintenant ou plus tard.</p>
  <p><a id="upload-link" class="btn btn-primary" href="envoyer.html">Déposer mes documents</a></p>
</div>
</section>`;
}

export function envoyerBody() {
  const rows = Array.from({ length: 3 }, (_, i) => `  <div class="course-row" data-course="${i + 1}">
    <strong>Document ${i + 1}</strong>
    <label class="field"><span class="small">Intitulé (par exemple « Règlement intérieur des stagiaires »)</span><input type="text" data-course-title="${i + 1}" maxlength="120" autocomplete="off"></label>
    <label class="field"><span class="small">Fichier(s) (PDF, DOCX, PPTX)</span><input type="file" multiple accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"></label>
  </div>`).join('\n');
  return `<section class="wrap" aria-labelledby="envoyer-h">
<h1 id="envoyer-h">Envoyer vos documents</h1>
<p id="upload-loading" class="status" role="status">Chargement de votre commande…</p>
<div id="upload-app" hidden>
  <p>Commande <strong id="upload-order"></strong> pour <strong id="upload-company"></strong>. Jusqu’à 3 documents, 60 pages en tout, 15 Mo par fichier. Retirez les noms de salariés ou de stagiaires s’il y en a.</p>
  <p id="upload-state" class="status" role="status" tabindex="-1" hidden></p>
  <h2>Fichiers reçus</h2>
  <p id="upload-count" class="small muted"></p>
  <ul id="upload-files"></ul>
  <form id="upload-form" class="card" novalidate>
${rows}
    <p id="upload-progress" class="status" role="status" hidden></p>
    <p id="upload-error" class="status err" role="alert" hidden></p>
    <p><button type="submit" id="upload-send" class="pay-button">Envoyer les fichiers choisis</button></p>
  </form>
  <p><button type="button" id="upload-done" class="btn btn-primary" disabled>J’ai tout envoyé</button></p>
  <p class="small muted">Le délai de livraison de 5 jours ouvrés part de ce clic. Un fichier oublié ? Revenez sur ce lien, ajoutez-le, puis cliquez de nouveau : la date est recalculée. Vos documents sont rangés dans un dossier privé et supprimés 90 jours après la livraison.</p>
</div>
</section>`;
}
