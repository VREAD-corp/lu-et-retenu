/* Objectifs de conversion pour cro.js : téléchargement de l'exemple (liens data-mesure="free_download") -> 'download' ;
 * envoi du formulaire de commande (#octave-pay) -> 'checkout' ; envoi des supports terminé (bouton « J'ai tout envoyé »)
 * -> 'intake'. Aucune donnée saisie n'est lue. */
(function (d) {
  'use strict';
  function goal(name) { if (window.octaveCro) window.octaveCro.goal(name); }
  d.addEventListener('click', function (e) {
    var t = e.target && e.target.closest;
    if (t && e.target.closest('[data-mesure="free_download"]')) goal('download');
    if (t && e.target.closest('#upload-done')) goal('intake');
  }, true);
  d.addEventListener('submit', function (e) { if (e.target && e.target.id === 'octave-pay') goal('checkout'); }, true);
})(document);
