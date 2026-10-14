/* Order page: applies the 'ler-prix' variant to the standard radio BEFORE pay.js reads the products (cro.js has
 * already set window.octaveCro; its own text swap only runs at DOMContentLoaded, after pay.js). */
(function () {
  'use strict';
  var v = window.octaveCro && window.octaveCro.v ? window.octaveCro.v('ler-prix') : 'p149';
  if (v !== 'p199') return;
  var r = document.querySelector('input[name="product"][value="lu-et-retenu-149"]');
  if (!r) return;
  r.value = 'lu-et-retenu-199';
  var lbl = document.querySelector('[data-price-for="lu-et-retenu-149"]');
  if (lbl) { lbl.setAttribute('data-price-for', 'lu-et-retenu-199'); lbl.textContent = '199 € net (TVA non applicable, art. 293 B du CGI)'; }
  var pp = document.getElementById('product-price');
  if (pp && r.checked) pp.textContent = '199 € net (TVA non applicable, art. 293 B du CGI)';
  var btn = document.getElementById('pay-button');
  if (btn && r.checked) btn.textContent = 'Payer 199 € et recevoir le lien d’envoi';
})();
