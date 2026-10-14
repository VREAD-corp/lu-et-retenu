/* Page Commander de Lu et Retenu : affiche le bloc « client d'Acquimètre » quand le tarif à 59 € est choisi
 * (?offre=acquimetre le présélectionne) et exige la référence de commande OU la déclaration avant tout paiement
 * (le serveur revérifie). Une référence saisie doit avoir la forme ok_ + 24 caractères hexadécimaux. */
(function () {
  'use strict';
  var form = document.getElementById('octave-pay');
  if (!form) return;
  var radios = Array.prototype.slice.call(form.querySelectorAll('input[name="product"]'));
  var box = document.getElementById('acq-proof');
  var ref = form.elements.acqOrder;
  var decl = form.elements.acqDeclared;
  if (/[?&]offre=acquimetre(&|$)/.test(window.location.search)) {
    radios.forEach(function (r) { r.checked = r.value === 'lu-et-retenu-acquimetre-59'; });
  }
  function acq() { return radios.some(function (r) { return r.checked && r.value === 'lu-et-retenu-acquimetre-59'; }); }
  function sync() { box.hidden = !acq(); decl.setCustomValidity(''); ref.setCustomValidity(''); }
  radios.forEach(function (r) { r.addEventListener('change', sync); });
  form.addEventListener('octave-validate', function () {
    var v = ref.value.trim();
    ref.setCustomValidity(acq() && v && !/^ok_[0-9a-f]{24}$/.test(v) ? 'La référence Acquimètre commence par ok_ suivi de 24 caractères (voir l’e-mail de commande). Laissez le champ vide et cochez la déclaration si vous ne la trouvez pas.' : '');
    decl.setCustomValidity(acq() && !v && !decl.checked ? 'Saisissez la référence de votre commande Acquimètre ou cochez la déclaration.' : '');
  });
  sync();
})();
