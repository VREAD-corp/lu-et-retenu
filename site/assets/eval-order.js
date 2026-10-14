/* Page « Votre commande » de Lu et Retenu : une fois le paiement confirmé par order.js, affiche le bouton vers la page
 * d'envoi des supports. Lit l'identifiant et le secret du paiement AVANT order.js (qui les retire de l'adresse),
 * puis rappelle l'action `fulfil` (idempotente : aucun second e-mail, aucune seconde facture) pour obtenir le lien. */
(function () {
  'use strict';
  var cfg = window.OCTAVE_PAY || {};
  var q = new URLSearchParams(window.location.search);
  var pi = q.get('payment_intent');
  var secret = q.get('payment_intent_client_secret');
  if (!pi || !secret) return;
  var status = document.getElementById('order-status');
  var box = document.getElementById('upload-next');
  var link = document.getElementById('upload-link');
  var tries = 0;
  function ask() {
    fetch(cfg.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'fulfil', payment_intent: pi, client_secret: secret }), redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok && typeof j.upload_url === 'string' && /\/envoyer\.html\?commande=ok_[0-9a-f]{24}&cle=[0-9a-f]{40}$/.test(j.upload_url)) {
          // Relative link: the same page of this site, whatever the host serving it.
          link.href = 'envoyer.html' + j.upload_url.slice(j.upload_url.indexOf('?'));
          box.hidden = false;
        }
      })
      .catch(function () { if (++tries < 3) setTimeout(ask, 3000); });
  }
  var obs = new MutationObserver(function () {
    if (status.getAttribute('data-fulfilled') === '1') { obs.disconnect(); ask(); }
  });
  obs.observe(status, { attributes: true });
})();
