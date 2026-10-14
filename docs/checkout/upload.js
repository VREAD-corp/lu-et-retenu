/* Page « Envoyer vos documents » de Lu et Retenu (copie de celle d'Acquimètre, libellés « document »). Le lien personnel (?commande=…&cle=…) vient de l'e-mail de
 * commande. Chaque fichier part seul, encodé en base64, vers l'action evalUpload du service de commande
 * (POST text/plain : pas de requête préalable CORS). Le serveur revérifie tout : clé du lien, format réel
 * (PDF, DOCX, PPTX), taille, nombre de fichiers, numéro de document. Rien n'est conservé dans le navigateur. */
(function () {
  'use strict';
  var cfg = window.OCTAVE_PAY || {};
  var q = new URLSearchParams(window.location.search);
  var order = q.get('commande') || '';
  var key = q.get('cle') || '';
  var $ = function (id) { return document.getElementById(id); };
  var state = null;
  var busy = false;
  var MAX_MB = 15;
  var OK_EXT = /\.(pdf|docx|pptx)$/i;

  function msg(el, text, cls) { el.textContent = text; el.className = 'status ' + (cls || ''); el.hidden = !text; }
  function call(body) {
    body.action = 'evalUpload';
    body.order_id = order;
    body.token = key;
    return fetch(cfg.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) { var e = new Error(j.message || 'Envoi impossible.'); e.code = j.error; throw e; } return j; });
  }
  function mb(n) { return (n / 1048576).toFixed(n < 1048576 ? 2 : 1).replace('.', ',') + ' Mo'; }

  function render() {
    var s = state;
    $('upload-company').textContent = s.company;
    $('upload-order').textContent = s.order_id;
    var list = $('upload-files');
    list.textContent = '';
    if (!s.files.length) {
      var li = document.createElement('li');
      li.textContent = 'Aucun fichier reçu pour l’instant.';
      list.appendChild(li);
    }
    s.files.slice().sort(function (a, b) { return a.course - b.course; }).forEach(function (f) {
      var li = document.createElement('li');
      li.textContent = 'Document ' + f.course + ' (' + f.title + ') : ' + f.name + ', ' + mb(f.bytes);
      list.appendChild(li);
    });
    $('upload-count').textContent = s.files.length + ' fichier(s) reçu(s) sur ' + s.max_files + ' possibles';
    var titles = {};
    s.files.forEach(function (f) { titles[f.course] = f.title; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-course-title]'), function (inp) {
      var n = inp.getAttribute('data-course-title');
      if (titles[n] && !inp.value) inp.value = titles[n];
    });
    var delivered = s.status === 'delivered';
    $('upload-form').hidden = delivered;
    $('upload-done').disabled = !s.files.length || busy;
    if (s.status === 'files_received') msg($('upload-state'), 'Envoi validé. Livraison au plus tard le ' + s.due_date + '. Vous pouvez encore ajouter un fichier oublié : validez de nouveau l’envoi ensuite.', 'ok');
    else if (delivered) msg($('upload-state'), 'Le questionnaire de cette commande a été livré par e-mail.', 'ok');
    else msg($('upload-state'), '', '');
  }

  function readB64(file) {
    return new Promise(function (ok, ko) {
      var r = new FileReader();
      r.onload = function () { var s = String(r.result); ok(s.slice(s.indexOf(',') + 1)); };
      r.onerror = function () { ko(new Error('Lecture impossible : ' + file.name)); };
      r.readAsDataURL(file);
    });
  }

  function sendAll(e) {
    e.preventDefault();
    if (busy) return;
    var out = $('upload-error');
    msg(out, '', '');
    var jobs = [];
    var problems = [];
    Array.prototype.forEach.call(document.querySelectorAll('.course-row'), function (row) {
      var n = Number(row.getAttribute('data-course'));
      var title = row.querySelector('input[type="text"]').value.trim();
      var files = row.querySelector('input[type="file"]').files;
      if (!files.length) return;
      if (title.length < 3) problems.push('Document ' + n + ' : indiquez son intitulé.');
      Array.prototype.forEach.call(files, function (f) {
        if (!OK_EXT.test(f.name)) problems.push(f.name + ' : seuls les PDF, DOCX et PPTX sont acceptés.');
        else if (f.size > MAX_MB * 1048576) problems.push(f.name + ' : ' + mb(f.size) + ', ' + MAX_MB + ' Mo au plus.');
        else jobs.push({ course: n, title: title, file: f });
      });
    });
    if (problems.length) { msg(out, problems.join(' '), 'err'); return; }
    if (!jobs.length) { msg(out, 'Choisissez au moins un fichier.', 'err'); return; }
    busy = true;
    $('upload-send').disabled = true;
    var progress = $('upload-progress');
    var i = 0;
    (function next() {
      if (i >= jobs.length) {
        busy = false;
        $('upload-send').disabled = false;
        Array.prototype.forEach.call(document.querySelectorAll('.course-row input[type="file"]'), function (inp) { inp.value = ''; });
        msg(progress, jobs.length + ' fichier(s) envoyé(s). Quand tout est là, cliquez sur « J’ai tout envoyé ».', 'ok');
        render();
        return;
      }
      var j = jobs[i];
      msg(progress, 'Envoi ' + (i + 1) + '/' + jobs.length + ' : ' + j.file.name + '…', '');
      readB64(j.file)
        .then(function (b64) { return call({ op: 'file', course: j.course, courseTitle: j.title, name: j.file.name, data: b64 }); })
        .then(function (s) { state = s; i++; next(); })
        .catch(function (err) {
          busy = false;
          $('upload-send').disabled = false;
          msg(progress, '', '');
          msg(out, j.file.name + ' : ' + err.message + (i ? ' Les fichiers précédents sont bien reçus.' : ''), 'err');
          render();
        });
    })();
  }

  function done() {
    if (busy) return;
    busy = true;
    $('upload-done').disabled = true;
    call({ op: 'done' })
      .then(function (s) { state = s; busy = false; render(); $('upload-state').focus(); })
      .catch(function (err) { busy = false; render(); msg($('upload-error'), err.message, 'err'); });
  }

  if (!/^ok_[0-9a-f]{24}$/.test(order) || !/^[0-9a-f]{40}$/.test(key)) {
    msg($('upload-loading'), 'Lien incomplet : ouvrez le lien reçu par e-mail après votre commande.', 'err');
    return;
  }
  $('upload-form').addEventListener('submit', sendAll);
  $('upload-done').addEventListener('click', done);
  call({ op: 'status' })
    .then(function (s) { state = s; $('upload-loading').hidden = true; $('upload-app').hidden = false; render(); })
    .catch(function (err) { msg($('upload-loading'), err.message, 'err'); });
})();
