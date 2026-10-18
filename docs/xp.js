/* Lu et Retenu A/B tests (read by cro.js, which must load after this file).
 * 'ler-prix': standard price 149 € (p149) or 199 € (p199), alternating by calendar day in Paris (no storage).
 *   ?prix=p199 forces a variant.
 * 'rd-hero': POOLED-READING-01 (2026-10-19): hero a = current, b = first screen shows a real excerpt of the deliverable.
 *   Same id on the 7 reading sites, pooled analysis in vread-revenue-lab. ?hero=b forces b. Home page only; the excerpt
 *   is shown by CSS on <html data-xp-rd-hero="b">. */
window.OCTAVE_XP = [{
  id: 'ler-prix',
  variants: ['p149', 'p199'],
  mode: 'day',
  tz: 'Europe/Paris',
  param: 'prix',
  swap: { p199: [['[data-prix-std]', 'text', '199 €']] },
}, {
  id: 'rd-hero',
  variants: ['a', 'b'],
  mode: 'tab',
  param: 'hero',
  pages: '^/lu-et-retenu/(index\\.html)?$',
}];
