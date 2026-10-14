// Vendored from VREAD-corp/acquiz@cdba4c0 src/lib/ai/cold-answer.ts (Octave/Vin-CC for READ FRANCE SAS; origin vread-workflow-def, same authors). Unmodified.
/**
 * Porte cold-answer : la question prouve-t-elle vraiment la lecture ?
 *
 * PRINCIPE
 * On repose la question au modèle SANS le texte du segment. S'il répond juste,
 * la réponse était déductible du titre, du sens commun ou de la culture
 * générale — la question ne prouve donc rien. `cold_answerable = true` signale
 * une question qui FUIT.
 *
 * POURQUOI UNE SIMPLE ÉGALITÉ SUFFIT
 * `integrity.ts` impose des réponses d'UN SEUL MOT, présent verbatim dans le
 * segment. Comparer deux mots normalisés répond exactement à la question posée ;
 * un modèle-juge coûterait un appel de plus par question pour arbitrer un cas
 * qui ne se présente pas.
 */

/**
 * Normalise pour comparaison : minuscules, accents retirés, ponctuation et
 * articles supprimés. « L'Neva. » et « neva » sont la même réponse — un écart
 * de casse ne doit pas se lire comme une question saine.
 */
export const normalizeAnswer = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^(l|d|n)'/, "")
    .replace(/^(le|la|les|un|une|des|the|a|an)\s+/, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();

/**
 * Le modèle a-t-il retrouvé la réponse sans le texte ?
 *
 * Une réponse vide vaut NON : un modèle qui ne répond pas n'a rien prouvé, et
 * compter son silence comme une fuite condamnerait des questions saines.
 */
export const isColdAnswerable = (expected: string, coldAnswer: string): boolean => {
  const a = normalizeAnswer(expected);
  const b = normalizeAnswer(coldAnswer);
  if (!a || !b) return false;
  return a === b;
};

/**
 * Prompt de la porte, adapté aux supports de formation (Acquiz).
 *
 * On donne le TITRE de la formation — délibérément : c'est ce qu'un stagiaire
 * qui n'a PAS suivi la formation connaît de toute façon. Le seuil mesuré est
 * « répondable sans avoir suivi la formation », pas « répondable sans rien
 * savoir ».
 *
 * Mode LOT : toutes les questions d'un instrument partent dans un seul appel
 * (coût : un appel par instrument au lieu d'un par question). Les QCM sont posés
 * avec leurs options ; le modèle rend la LETTRE choisie.
 */
export type ColdQuestion = {
  n: number;
  question: string;
  /** Options d'un QCM, dans l'ordre affiché (A, B, C…). Absent : réponse libre en un mot. */
  choices?: string[] | null;
};

export const LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

export const buildColdAnswerBatchPrompt = (args: {
  courseTitle?: string | null;
  questions: ColdQuestion[];
}): { system: string; user: string } => ({
  system:
    "Tu réponds à des questions d'évaluation SANS avoir suivi la formation ni lu son support. " +
    "Appuie-toi uniquement sur ta culture générale et le bon sens. " +
    "Pour une question à réponse libre, réponds par UN SEUL MOT. " +
    "Pour un QCM, réponds par la LETTRE de l'option choisie. " +
    "Si tu ne sais vraiment pas, réponds exactement : INCONNU. " +
    'Réponds UNIQUEMENT avec un objet JSON : {"answers":[{"n":1,"answer":"..."}]}.',
  user: [
    args.courseTitle ? `Formation : ${args.courseTitle}` : null,
    "",
    ...args.questions.map((q) =>
      q.choices?.length
        ? `${q.n}. ${q.question}\n${q.choices.map((c, i) => `   ${LETTERS[i]}) ${c}`).join("\n")}`
        : `${q.n}. ${q.question} (un seul mot)`
    ),
  ]
    .filter((line) => line !== null)
    .join("\n"),
});

/** Un QCM fuit si le modèle « à froid » choisit la bonne lettre. */
export const isColdAnswerableChoice = (correctIndex: number, coldAnswer: string): boolean => {
  // Lettre isolée en tête (« B », « b) », « (C) ») — surtout pas la 1re lettre A-F
  // d'un mot : « INCONNU » contient un C.
  const letter = coldAnswer.trim().toUpperCase().match(/^\(?([A-F])(?:[).:\s]|$)/)?.[1];
  if (!letter) return false;
  return LETTERS.indexOf(letter as (typeof LETTERS)[number]) === correctIndex;
};
