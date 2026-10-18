/* Objectifs de conversion pour cro.js : tout lien vers l'exemple gratuit (data-mesure sample_click ou sample_download,
 * POOLED-READING-02) -> 'sample', et le fichier de l'exemple lui-même (sample_download) -> 'download' aussi
 * ('sample' est la mesure secondaire du test mutualisé POOLED-READING-01, même nom sur les 7 sites de lecture) ;
 * envoi du formulaire de commande (#octave-pay) -> 'checkout' ; envoi des supports terminé (bouton « J'ai tout envoyé »)
 * -> 'intake'. Aucune donnée saisie n'est lue. */
(function (d) {
  'use strict';
  function goal(name) { if (window.octaveCro) window.octaveCro.goal(name); }
  d.addEventListener('click', function (e) {
    var t = e.target && e.target.closest;
    var m = t && e.target.closest('[data-mesure^="sample_"], [data-mesure="free_download"]');
    if (m) { goal('sample'); if (m.getAttribute('data-mesure') !== 'sample_click') goal('download'); }
    if (t && e.target.closest('#upload-done')) goal('intake');
  }, true);
  d.addEventListener('submit', function (e) { if (e.target && e.target.id === 'octave-pay') goal('checkout'); }, true);
})(document);
