// Vendored from VREAD-corp/qualiopi-kit-content@53ebacc scripts/md2docx.mjs (the Kit Qualiopi build tooling, Octave for READ FRANCE SAS).
// One change: the document description is a parameter (it was fixed to the kit's name).
// Convertisseur Markdown (sous-ensemble GFM) → DOCX, sans pandoc.
// Gère : titres, paragraphes (retours à la ligne conservés), listes (ordonnées ou non, imbriquées),
// tableaux, citations (encadré), règles horizontales, gras, italique, code inline, liens.
// Les zones « [À compléter…] » et « [ … ] » sont surlignées pour être repérées facilement.
import { marked } from 'marked';
import {
  AlignmentType, BorderStyle, Document, ExternalHyperlink, Footer, Header, HeadingLevel, HeightRule, LevelFormat,
  Packer, PageNumber, PageOrientation, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';

const FONT = 'Calibri';
const ACCENT = '1F4E79';
const HEADING = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4 };

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// Découpe un texte brut en runs, en surlignant les zones à compléter et en gérant les retours à la ligne.
function textRuns(text, style) {
  const out = [];
  const lines = decode(text).split('\n');
  lines.forEach((line, li) => {
    const parts = line.split(/(\[[^\]]*\])/g).filter((p) => p !== '');
    parts.forEach((p, pi) => {
      const fill = /^\[[^\]]*\]$/.test(p) && !/^\[[xX ]\]$/.test(p);
      out.push(new TextRun({ text: p, ...style, ...(fill ? { highlight: 'yellow' } : {}), break: li > 0 && pi === 0 ? 1 : undefined }));
    });
    if (parts.length === 0 && li > 0) out.push(new TextRun({ text: '', break: 1 }));
  });
  return out;
}

function inline(tokens, style = {}) {
  const runs = [];
  for (const t of tokens ?? []) {
    switch (t.type) {
      case 'strong': runs.push(...inline(t.tokens, { ...style, bold: true })); break;
      case 'em': runs.push(...inline(t.tokens, { ...style, italics: true })); break;
      case 'codespan': runs.push(...textRuns(t.text, { ...style, highlight: 'yellow' })); break;
      case 'br': runs.push(new TextRun({ text: '', break: 1 })); break;
      case 'link':
        runs.push(new ExternalHyperlink({ link: t.href, children: inline(t.tokens, { ...style, color: '0563C1', underline: {} }) }));
        break;
      case 'text':
      case 'escape':
        if (t.tokens && t.tokens.length) runs.push(...inline(t.tokens, style));
        else runs.push(...textRuns(t.text, style));
        break;
      case 'html': runs.push(...textRuns(t.text.replace(/<[^>]+>/g, ''), style)); break;
      default: if (t.text) runs.push(...textRuns(t.text, style));
    }
  }
  return runs;
}

class Ctx {
  constructor() { this.listInstance = 0; }
}

function blocks(tokens, ctx, opts = {}) {
  const out = [];
  for (const t of tokens) {
    switch (t.type) {
      case 'heading':
        out.push(new Paragraph({ heading: HEADING[Math.min(t.depth, 4)], children: inline(t.tokens), spacing: { before: t.depth === 1 ? 0 : 240, after: 120 } }));
        break;
      case 'paragraph':
        out.push(new Paragraph({ children: inline(t.tokens, opts.style), spacing: { after: 120 }, ...(opts.para ?? {}) }));
        break;
      case 'list':
        out.push(...list(t, ctx, 0));
        break;
      case 'table':
        out.push(table(t, opts.landscape));
        out.push(new Paragraph({ text: '', spacing: { after: 60 } }));
        break;
      case 'blockquote':
        out.push(...blocks(t.tokens, ctx, {
          style: { color: '1F3A5F' },
          para: {
            shading: { type: ShadingType.CLEAR, fill: 'EAF1F8', color: 'auto' },
            border: { left: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 8 } },
            indent: { left: 200, right: 200 },
          },
        }));
        break;
      case 'hr':
        out.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'BFBFBF', space: 1 } }, text: '' }));
        break;
      case 'code':
        out.push(new Paragraph({ children: textRuns(t.text, { font: 'Consolas' }) }));
        break;
      case 'space':
      case 'html':
        break;
      default:
        if (t.text) out.push(new Paragraph({ children: textRuns(t.text) }));
    }
  }
  return out;
}

function list(t, ctx, level) {
  const out = [];
  const instance = ++ctx.listInstance;
  for (const item of t.items) {
    const [first, ...rest] = item.tokens;
    const runs = first && (first.type === 'text' || first.type === 'paragraph') ? inline(first.tokens ?? [{ type: 'text', text: first.text }]) : [];
    out.push(new Paragraph({
      children: runs,
      ...(t.ordered ? { numbering: { reference: 'ordered', level, instance } } : { bullet: { level } }),
      spacing: { after: 60 },
    }));
    const remaining = first && (first.type === 'text' || first.type === 'paragraph') ? rest : item.tokens;
    for (const sub of remaining) {
      if (sub.type === 'list') out.push(...list(sub, ctx, Math.min(level + 1, 3)));
      else if (sub.type !== 'space') out.push(...blocks([sub], ctx));
    }
  }
  return out;
}

function cell(tokens, header, widthPct) {
  return new TableCell({
    children: [new Paragraph({ children: inline(tokens, header ? { bold: true, color: 'FFFFFF' } : {}) })],
    shading: header ? { type: ShadingType.CLEAR, fill: ACCENT, color: 'auto' } : undefined,
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });
}

// Largeurs de colonnes proportionnelles à la longueur moyenne du contenu (bornée).
function columnWidths(t) {
  const n = t.header.length;
  const weights = t.header.map((h, i) => {
    const lens = [h.text.length, ...t.rows.map((r) => (r[i]?.text ?? '').length)];
    const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
    return Math.min(Math.max(Math.sqrt(avg + 4), 2.2), 14);
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => Math.max(Math.round((w / sum) * 100), Math.floor(30 / n)));
}

// Lignes à signer : plus hautes, pour laisser la place d'une signature manuscrite (émargement, signatures).
const SIGN = /signature|cachet/i;
function table(t) {
  const w = columnWidths(t);
  // Tableau « clé / valeur » écrit avec une ligne d'en-tête vide (| | |) : pas de bandeau d'en-tête vide.
  const emptyHeader = t.header.every((h) => !h.text.trim());
  const rows = emptyHeader ? [] : [new TableRow({ tableHeader: true, children: t.header.map((h, i) => cell(h.tokens, true, w[i])) })];
  const signHeader = t.header.some((h) => SIGN.test(h.text));
  for (const r of t.rows) {
    const tall = r.some((c) => SIGN.test(c.text)) || (signHeader && r.every((c) => !c.text.trim() || /^\d+$/.test(c.text.trim()) || /^\[[^\]]*\]$/.test(c.text.trim())));
    rows.push(new TableRow({ children: r.map((c, i) => cell(c.tokens, false, w[i])), ...(tall ? { height: { value: 620, rule: HeightRule.ATLEAST } } : {}) }));
  }
  return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: w.map((p) => Math.round(p * 98)) });
}

export async function markdownToDocx(markdown, { title, footerText, landscape = false, description = 'Acquimètre — READ FRANCE SAS' } = {}) {
  const tokens = marked.lexer(markdown, { gfm: true });
  const ctx = new Ctx();
  const children = blocks(tokens, ctx, { landscape });
  const doc = new Document({
    creator: 'READ FRANCE SAS',
    title,
    description,
    styles: {
      default: { document: { run: { font: FONT, size: 21 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 34, bold: true, color: ACCENT } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 27, bold: true, color: ACCENT } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: '2E2E2E' } },
        { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 21, bold: true } },
      ],
    },
    numbering: {
      config: [{
        reference: 'ordered',
        levels: [0, 1, 2, 3].map((level) => ({
          level, format: LevelFormat.DECIMAL, text: `%${level + 1}.`, alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 360 * (level + 1), hanging: 260 } } },
        })),
      }],
    },
    sections: [{
      properties: {
        page: {
          size: landscape ? { orientation: PageOrientation.LANDSCAPE, width: 11906, height: 16838 } : { width: 11906, height: 16838 },
          margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
        },
      },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: title ?? '', size: 16, color: '7F7F7F' })] })] }) },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `${footerText ?? ''} — page `, size: 16, color: '7F7F7F' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '7F7F7F' }),
            ],
          })],
        }),
      },
      children,
    }],
  });
  return Packer.toBuffer(doc);
}
