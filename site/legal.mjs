// Legal pages of Lu et Retenu. The CGV adapt Acquimètre's service terms (cgv-pro-eval-2026-10-13) to a questionnaire
// written from the buyer's onboarding documents: no legal advice, no staff data, delivered within 5 working days.
import { CONTACT, ETALAB, SAMPLE_SOURCES, SELLER, SITE, TERMS_DATE, TERMS_VERSION } from './content.mjs';

const eur = (cents) => `${String(cents / 100).replace('.', ',')} €`;

export function cgvBody({ std, std2, acq, open }) {
  return `<!--
  CGV B2B (prestation de services) rédigées par Octave (assistant IA de READ FRANCE SAS) le 14 octobre 2026, à partir des CGV
  d'Acquimètre (version du 13 octobre 2026). CE N'EST PAS UN CONSEIL JURIDIQUE : texte à faire relire par un avocat ou un juriste.
-->
<section class="wrap legal">
<h1>Conditions générales de vente aux professionnels</h1>
<p class="small muted">Lu et Retenu, questionnaires de lecture de documents d’accueil – version du ${TERMS_DATE} (référence ${TERMS_VERSION}).</p>
${open ? '' : '<div class="callout" role="note"><p><strong>Les ventes ne sont pas encore ouvertes.</strong> Ces conditions s’appliqueront aux commandes passées après leur ouverture.</p></div>'}
<h2>1. Prestataire</h2>
<p>${SELLER.name}, ${SELLER.form} au capital de ${SELLER.capital}, dont le siège social est situé ${SELLER.address}, immatriculée sous le numéro SIREN ${SELLER.siren} (${SELLER.rcs}), bénéficiant de la franchise en base de TVA (TVA non applicable, art. 293 B du CGI), représentée par ${SELLER.president}, président (ci-après « le Prestataire »). Lu et Retenu est un nom commercial du Prestataire.</p>
<p>Contact : <a href="mailto:${CONTACT}">${CONTACT}</a>. Voir aussi les <a href="mentions-legales.html">mentions légales</a>.</p>
<h2>2. Champ d’application et acceptation</h2>
<p>Les présentes conditions générales de vente (« CGV ») s’appliquent exclusivement à la prestation « Lu et Retenu » commandée en ligne par un <strong>professionnel</strong> (ci-après « le Client ») : une entreprise, une association ou un organisme immatriculé en France, identifié par son numéro SIREN, qui commande pour les besoins de son activité professionnelle. Les ventes aux consommateurs ne sont pas proposées.</p>
<p>La personne qui passe commande déclare agir au nom et pour le compte de l’entité indiquée et avoir le pouvoir de l’engager. Avant de payer, le Client accepte expressément les présentes CGV en cochant la case prévue ; la version acceptée est conservée avec la commande. Les CGV prévalent sur toute condition d’achat du Client, sauf accord écrit contraire du Prestataire.</p>
<h2>3. Prestation</h2>
<p>À partir de 1 à 3 documents transmis par le Client (règlement intérieur, livret d’accueil, consignes ou procédures internes ; 60 pages au total au plus), le Prestataire rédige : un questionnaire de lecture de 8 à 20 questions, à choix unique ou à réponse en un mot, comprenant au moins une question par section des documents ; un corrigé indiquant pour chaque question le passage cité et sa page ; un modèle d’attestation de lecture et de compréhension ; un registre de suivi (XLSX et CSV) ; les questions aux formats CSV et GIFT ; un modèle de note d’information. Les livrables sont réunis dans une archive ZIP. Au-delà de 60 pages, le Prestataire propose par écrit, avant de commencer, de limiter la prestation ou de la scinder en deux commandes.</p>
<p>Les questions sont rédigées par un assistant d’intelligence artificielle du Prestataire (Octave) à partir des seuls documents du Client, puis soumises à des contrôles automatiques décrits sur le site. <strong>Le Client relit et valide le questionnaire avant tout usage.</strong> Il administre lui-même le questionnaire auprès des personnes concernées, en conserve les réponses et reste seul responsable de leur information, de la consultation éventuelle de ses instances représentatives, de l’usage des résultats et de toute décision prise à leur suite. Le Prestataire ne reçoit ni ne traite aucune réponse.</p>
<p><strong>La prestation ne comprend aucun conseil juridique.</strong> Le Prestataire ne vérifie pas la licéité ni la conformité des documents du Client, ni la procédure de leur adoption. Le questionnaire et l’attestation ne valent pas validation juridique des documents et ne remplacent aucune formalité prévue par la loi. La prestation ne comprend pas non plus l’hébergement de questionnaires en ligne ni la passation des questionnaires.</p>
<h2>4. Prix</h2>
<p>Le prix est de <strong>${eur(std)} ou ${eur(std2)} net de taxe</strong> par commande de 1 à 3 documents, selon le prix affiché le jour de la commande (test de prix), ou de <strong>${eur(acq)} net de taxe</strong> pour les entités ayant déjà commandé la prestation Acquimètre du Prestataire (TVA non applicable, art. 293 B du CGI). Le prix applicable est celui affiché sur la page de commande au moment de la validation ; il figure sur la facture.</p>
<p>Le tarif réservé aux clients d’Acquimètre est accordé sur indication de la référence de la commande Acquimètre ou sur déclaration du Client. Si le Prestataire constate que l’entité n’a pas commandé Acquimètre, il peut facturer la différence avec le tarif standard le plus bas (90 €), payable à 30 jours.</p>
<h2>5. Commande et paiement</h2>
<p>Le Client renseigne sur la page « Commander » : le tarif, le nombre de documents, son adresse électronique, la raison sociale et le SIREN, son adresse de facturation, l’attestation relative aux documents (article 7), puis ses données de carte. Il valide en cliquant sur le bouton de paiement.</p>
<p>Le paiement s’effectue <strong>par carte bancaire, au comptant, via le prestataire de paiement Stripe</strong> (Stripe Payments Europe, Ltd.). Les données de carte sont saisies dans un module sécurisé de Stripe ; le Prestataire n’y a jamais accès. Le contrat est formé à la confirmation du paiement par Stripe. La facture acquittée et un lien personnel d’envoi des documents sont adressés au Client par courrier électronique.</p>
<h2>6. Exécution et délai</h2>
<p>Le Client dépose ses documents (PDF, DOCX ou PPTX ; 15 Mo par fichier) au moyen du lien personnel, puis confirme que son envoi est complet. <strong>Le Prestataire livre l’archive par courrier électronique dans un délai de 5 jours ouvrés</strong> (hors samedis, dimanches et jours fériés en France) à compter de cette confirmation. Un ajout de fichier après confirmation fait repartir le délai à la nouvelle confirmation.</p>
<p>Si un fichier est illisible (document scanné sans texte, fichier protégé), le Prestataire en informe le Client dans les 2 jours ouvrés ; le délai est suspendu jusqu’à l’envoi d’un fichier exploitable. Si le Client n’a déposé aucun document dans les 60 jours suivant le paiement, il peut demander le remboursement intégral ; au-delà de 6 mois sans dépôt, la commande est close et le prix reste acquis.</p>
<p><strong>Retard :</strong> si l’archive n’est pas livrée 10 jours ouvrés après la confirmation de l’envoi complet, le Client peut obtenir sur simple demande le remboursement intégral du prix ; il conserve alors les livrables éventuellement reçus ensuite.</p>
<h2>7. Engagements du Client sur les documents</h2>
<p>Le Client garantit qu’il peut transmettre les documents au Prestataire pour qu’ils soient traités, et que ces documents ne contiennent pas de données personnelles de salariés, de stagiaires ou d’autres personnes, à l’exception des noms et coordonnées professionnels de contacts que le document doit mentionner (référent, service de santé au travail). Il garantit le Prestataire contre toute réclamation d’un tiers à ce titre et s’engage à ne pas transmettre de contenu illicite.</p>
<h2>8. Absence de droit de rétractation</h2>
<p>La vente étant conclue entre professionnels, pour les besoins de l’activité du Client, le droit de rétractation prévu par le code de la consommation ne s’applique pas. La commande est ferme dès la confirmation du paiement, sous réserve des articles 6 et 10.</p>
<h2>9. Droits sur les livrables</h2>
<p>Les documents restent la propriété du Client ou de leurs titulaires. À la livraison, le Prestataire cède au Client, pour le monde et pour la durée des droits, le droit de reproduire, modifier et utiliser les livrables pour son usage interne, y compris en les remettant à ses salariés, stagiaires et intervenants, sur tout support. Sont exclues la revente ou la mise à disposition des livrables comme produit à des tiers. Les modèles, méthodes et outils du Prestataire restent sa propriété.</p>
<h2>10. Conformité et remplacement</h2>
<p>Si une question est inexacte au regard des documents, ambiguë ou mal formulée, le Client la signale dans les 30 jours suivant la livraison : le Prestataire la remplace sans frais dans les 5 jours ouvrés. Si l’archive est illisible ou incomplète, le Prestataire la renvoie sans frais.</p>
<h2>11. Confidentialité</h2>
<p>Le Prestataire traite les documents du Client comme confidentiels. Il ne les utilise que pour exécuter la commande, ne les communique à aucun tiers en dehors de ses prestataires techniques (article 13), ne s’en sert pas pour d’autres clients ni pour entraîner un modèle d’intelligence artificielle. Les documents et l’archive livrée sont supprimés 90 jours après la livraison.</p>
<h2>12. Responsabilité</h2>
<p>Le Prestataire est tenu d’une obligation de moyens. Sa responsabilité ne peut être engagée qu’en cas de faute prouvée et pour les seuls dommages directs ; elle est en tout état de cause <strong>limitée au prix payé</strong> pour la commande concernée. Le Prestataire n’est pas responsable des dommages indirects, ni du contenu des documents du Client, ni de l’usage que le Client fait du questionnaire, des réponses et des attestations, ni des décisions prises à leur suite. Ces limitations ne s’appliquent pas en cas de faute lourde ou dolosive.</p>
<h2>13. Facturation, données personnelles et prestataires</h2>
<p>Une facture conforme à l’article 242 nonies A de l’annexe II du code général des impôts est émise au paiement. Toute somme non payée à son échéance (notamment au titre de l’article 4) entraîne de plein droit des <strong>pénalités de retard au taux égal à trois fois le taux d’intérêt légal</strong> et une <strong>indemnité forfaitaire pour frais de recouvrement de 40 €</strong> (articles L441-10 et D441-5 du code de commerce).</p>
<p>Le Prestataire, responsable de traitement, traite les données de commande (adresse électronique, raison sociale, SIREN, adresse de facturation, données de commande et de paiement, à l’exclusion des données de carte traitées par Stripe) pour exécuter la commande, établir la facture et tenir sa comptabilité (bases légales : contrat et obligations légales ; conservation : factures 10 ans, autres données 5 ans). Si, malgré l’article 7, des données personnelles figurent dans les documents, le Prestataire les traite pour le compte du Client, uniquement pour exécuter la prestation, sous la confidentialité de l’article 11, et les supprime avec les documents.</p>
<p>Prestataires techniques : Stripe (paiement) ; Google (réception et stockage des documents dans un dossier privé, courriers électroniques, registre des commandes : Apps Script, Drive, Gmail, Sheets). Ces prestataires peuvent traiter des données hors de l’Union européenne dans le cadre des garanties prévues par le RGPD. Toute personne concernée exerce ses droits auprès du Prestataire et peut saisir la <a href="https://www.cnil.fr/fr/plaintes">CNIL</a>. Voir la <a href="confidentialite.html">politique de confidentialité</a>.</p>
<h2>14. Droit applicable et juridiction</h2>
<p>Les présentes CGV sont soumises au <strong>droit français</strong>. Les parties recherchent d’abord une solution amiable. À défaut, tout litige relève de la <strong>compétence exclusive des tribunaux de Paris</strong>, y compris en cas de pluralité de défendeurs ou d’appel en garantie.</p>
<h2>15. Dispositions diverses</h2>
<p>Le Prestataire peut modifier les présentes CGV ; la version applicable est celle acceptée par le Client lors de sa commande. Si une clause est déclarée nulle, les autres demeurent applicables. Le fait de ne pas se prévaloir d’une clause ne vaut pas renonciation à s’en prévaloir ultérieurement.</p>
<p class="small muted">Version du ${TERMS_DATE}, référence ${TERMS_VERSION}. Adresse permanente : ${SITE}cgv-pro.html</p>
</section>`;
}

export function mentionsBody() {
  return `<section class="wrap legal">
<h1>Mentions légales</h1>
<h2>Éditeur</h2>
<p>${SELLER.name}, ${SELLER.form} au capital de ${SELLER.capital}, ${SELLER.address}. SIREN ${SELLER.siren}, ${SELLER.rcs}. TVA non applicable, art. 293 B du CGI. Directeur de la publication : ${SELLER.president}, président. Contact : <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
<p>Lu et Retenu est un nom commercial de ${SELLER.name}, l’éditeur de l’application Vread. Les textes du site sont rédigés par Octave, l’assistant IA de ${SELLER.name}, et publiés sous la responsabilité de l’éditeur.</p>
<h2>Hébergement</h2>
<p>GitHub Pages, GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis. Le service de commande et d’envoi des fichiers fonctionne sur Google Apps Script (Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, États-Unis) ; les paiements passent par Stripe Payments Europe, Ltd. (Dublin, Irlande).</p>
<h2>Exemple publié</h2>
<p>L’exemple repose sur deux modèles du Code du travail numérique (ministère du Travail) : ${SAMPLE_SOURCES.map((s) => `« <a href="${s.url}">${s.title}</a> »`).join(' et ')}, réutilisés sous <a href="${ETALAB}">Licence Ouverte etalab 2.0</a>, reproduits sans modification et convertis en PDF le 14 octobre 2026. Les questions, le corrigé, l’attestation et les autres fichiers de l’exemple sont de ${SELLER.name}. Ce site n’est ni édité ni validé par le ministère du Travail.</p>
<h2>Propriété</h2>
<p>Le code du site est publié sous licence MIT. Les textes, sauf les modèles ci-dessus : tous droits réservés.</p>
</section>`;
}

export function privacyBody({ open, std, std2 } = {}) {
  return `<section class="wrap legal">
<h1>Confidentialité</h1>
<p>Responsable de traitement : ${SELLER.name}, ${SELLER.address}, <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
<h2>Commande</h2>
<p>La page ${open ? '<a href="commander.html">Commander</a>' : 'Commander (ouverte au lancement des ventes)'} collecte l’adresse électronique, la raison sociale, le SIREN et l’adresse de facturation, pour exécuter la commande et établir la facture. Le paiement par carte est traité par Stripe, qui charge son module de paiement (et ses cookies de sécurité anti-fraude) sur cette page uniquement. Durées, destinataires et droits : article 13 des <a href="cgv-pro.html">CGV professionnels</a>.</p>
<h2>Documents envoyés</h2>
<p>Les fichiers déposés sur la page d’envoi sont rangés dans un dossier Google Drive privé du compte de ${SELLER.name}, un dossier par commande, jamais partagé. Ils servent uniquement à rédiger le questionnaire commandé et sont supprimés 90 jours après la livraison, avec l’archive livrée. Ils ne doivent pas contenir de données de salariés ou de stagiaires ; si c’est le cas, elles sont traitées pour le compte du client et supprimées avec les fichiers.</p>
<h2>Réponses au questionnaire</h2>
<p>Nous n’en recevons aucune. Le client remet le questionnaire et l’attestation lui-même et conserve les réponses ; c’est lui qui en est responsable.</p>
<h2>Mesure d’audience, sans cookie</h2>
<p>Le site compte ses visites avec un petit script (mesure.js) qui n’utilise ni cookie ni identifiant. À chaque page vue, il envoie : le nom du site, l’adresse de la page, le domaine du site d’où vous venez, les paramètres de campagne (utm), le type d’appareil (mobile ou ordinateur) et l’heure. Un second script (cro.js) envoie une fois par page des compteurs agrégés : profondeur de lecture, sections vues, ouverture des questions fréquentes, début et envoi des formulaires (le nom du dernier champ touché, jamais sa valeur), erreurs techniques et indicateurs de vitesse. Ces données sont additionnées en compteurs quotidiens ; aucune adresse IP n’est conservée et rien ne permet de vous suivre d’un site à l’autre. Rien n’est envoyé si votre navigateur demande à ne pas être suivi (Do Not Track ou Global Privacy Control). Cette mesure, limitée à nos statistiques, entre dans l’exemption de consentement prévue par la CNIL pour les outils de mesure d’audience. Le transport passe par Google Apps Script (Google LLC).</p>
<p>Test de prix : selon le jour (calendrier de Paris), le tarif standard affiché est ${eur(std)} ou ${eur(std2)}. Le choix dépend de la date seule, rien n’est stocké dans votre navigateur et il n’est rattaché à personne. Le prix payé est celui affiché sur la page de commande.</p>
<h2>Vos droits</h2>
<p>Accès, rectification, effacement, limitation, opposition, portabilité : écrivez à <a href="mailto:${CONTACT}">${CONTACT}</a>. Réclamation possible auprès de la <a href="https://www.cnil.fr/fr/plaintes">CNIL</a>.</p>
</section>`;
}
