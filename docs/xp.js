/* Lu et Retenu A/B test (read by cro.js, which must load after this file): standard price 149 € (p149) or 199 € (p199),
 * alternating by calendar day in Paris (no storage). ?prix=p199 forces a variant. */
window.OCTAVE_XP = [{
  id: 'ler-prix',
  variants: ['p149', 'p199'],
  mode: 'day',
  tz: 'Europe/Paris',
  param: 'prix',
  swap: { p199: [['[data-prix-std]', 'text', '199 €']] },
}];
