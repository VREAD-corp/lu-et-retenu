// Vendored from VREAD-corp/acquiz@cdba4c0 src/lib/ai/answer-presence.ts (Octave/Vin-CC for READ FRANCE SAS; origin vread-workflow-def, same authors). Unmodified.
import { normalizeAnswer } from "./cold-answer";

/**
 * La réponse figure-t-elle dans le texte ?
 *
 * Règle de la génération (`integrity.ts`, prompts v4) : une réponse est UN mot
 * présent mot pour mot dans le segment. Rien ne le vérifiait contre le texte du
 * livre — `assertGenerationIntegrity` ne contrôle que la forme du SQL. C'est ce
 * contrôle qui dit à l'admin qu'une correction proposée par l'IA (ou saisie à la
 * main) s'appuie bien sur le segment, et non sur la mémoire du modèle.
 *
 * Comparaison par MOTS normalisés (`normalizeAnswer` de la porte cold-answer :
 * casse, accents, ponctuation, élisions) et non par sous-chaîne : « rat » ne doit
 * pas être trouvé dans « pirate ». Chaque jeton est pris entier (« aujourd'hui »,
 * « Jean-Baptiste ») ET découpé sur ses apostrophes et traits d'union (« l'épée »
 * → « épée »), pour qu'une élision du texte ne cache pas le mot.
 */

// Apostrophes typographiques ramenées à l'apostrophe droite : `normalizeAnswer`
// ne retire l'élision (« l' », « d' ») que sur cette forme.
const APOSTROPHES = /[’‘ʼ´`]/g;

const tokenForms = (token: string): string[] => {
  const forms = [token];
  const parts = token.split(/['\-‐‑–]/);
  if (parts.length > 1) forms.push(...parts);
  return forms;
};

/**
 * Ensemble des mots normalisés d'un texte. Exposé pour qu'un appelant qui
 * interroge plusieurs fois le même segment (plusieurs contrôles) ne le
 * redécoupe pas à chaque fois.
 */
export const buildWordSet = (text: string): ReadonlySet<string> => {
  const words = new Set<string>();
  for (const raw of text.replace(APOSTROPHES, "'").split(/\s+/)) {
    if (!raw) continue;
    for (const form of tokenForms(raw)) {
      const normalized = normalizeAnswer(form);
      if (normalized) words.add(normalized);
    }
  }
  return words;
};

/** Forme normalisée d'une réponse, ou `""` si elle ne contient aucun caractère comparable. */
export const normalizeAnswerForPresence = (answer: string): string =>
  normalizeAnswer(answer.trim().replace(APOSTROPHES, "'"));

/**
 * Vrai si la réponse (normalisée) est un des mots du texte. Une réponse vide ou
 * réduite à rien après normalisation n'est jamais « présente » : un contrôle
 * bloquant ne doit pas passer sur du vide.
 */
export const answerAppearsInText = (answer: string, text: string | ReadonlySet<string>): boolean => {
  const needle = normalizeAnswerForPresence(answer);
  if (!needle) return false;
  const words = typeof text === "string" ? buildWordSet(text) : text;
  return words.has(needle);
};
