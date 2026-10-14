// Vendored from VREAD-corp/acquiz@cdba4c0 src/lib/parse/docx.ts (Octave/Vin-CC for READ FRANCE SAS; origin vread-workflow-def, same authors). Unmodified.
import { normalizeExtractedText } from "./pdf";

/** DOCX → plain text (mammoth keeps one paragraph per line, which preserves headings). */
export const parseDocxBuffer = async (buffer: Uint8Array): Promise<{ text: string }> => {
  const mammoth = await import("mammoth");
  const extract = (mammoth.default ?? mammoth).extractRawText;
  const result = await extract({ buffer: Buffer.from(buffer) });
  return { text: normalizeExtractedText(result.value) };
};
