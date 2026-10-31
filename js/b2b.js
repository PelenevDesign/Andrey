/* Страница «Строительным компаниям»: заявка, цели Метрики, UTM-метки, закреплённая кнопка */
(function () {
  'use strict';

  var COUNTER = 88022855;
  var THANKS_URL = 'spasibo-b2b.html';
  var MAX_FILE = 25 * 1024 * 1024;
  var FILE_EXT = ['pdf', 'dwg', 'jpg', 'jpeg', 'zip'];
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  /* Куда уходят заявки.
     TODO: уточнить у заказчика, адрес приёма заявок (почта/CRM/обработчик), куда сейчас идут заявки с сайта.
     Задайте до подключения этого файла: window.B2B_FORM_ENDPOINT = 'https://...';
     либо общий для всех форм window.FORM_ENDPOINT. Форма отправляет multipart/form-data
     с полями name, company, phone, email, task, project_file, topic, utm_*, page_url, referrer
     и темой письма в subject / _subject = «B2B: строительная компания». */

  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  var host = location.hostname;
  var isLocal = !host || location.protocol === 'file:' ||
    /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(host) || /\.(local|test|localhost)$/.test(host);

  /* ---------- цели Метрики ---------- */
  function goal(name, done) {
    var finished = false;
    var finish = function () { if (!finished) { finished = true; if (done) done(); } };
    try {
      if (typeof window.ym === 'function') {
        window.ym(COUNTER, 'reachGoal', name, {}, finish);
        if (done) setTimeout(finish, 1000); /* не держим пользователя, если счётчик заблокирован */
        return;
      }
    } catch (e) { /* ignore */ }
    finish();
  }

  document.addEventListener('click', function (e) {
    var g = e.target.closest ? e.target.closest('[data-goal]') : null;
    if (g) goal(g.getAttribute('data-goal'));
    var t = e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
    if (t) goal('b2b_phone');
  });

  /* ---------- UTM-метки ---------- */
  function readUtm() {
    var found = {}, any = false;
    try {
      var q = new URLSearchParams(location.search);
      UTM_KEYS.forEach(function (k) { var v = q.get(k); if (v) { found[k] = v; any = true; } });
    } catch (e) { /* старый браузер */ }
    try {
      if (any) { sessionStorage.setItem('as_utm', JSON.stringify(found)); return found; }
      return JSON.parse(sessionStorage.getItem('as_utm') || '{}');
    } catch (e) { return found; }
  }

  var form = $('#b2b-form');
  if (!form) return;

  function fillHidden() {
    var u = readUtm();
    UTM_KEYS.forEach(function (k) { if (form.elements[k]) form.elements[k].value = u[k] || ''; });
    form.elements.page_url.value = location.href;
    form.elements.referrer.value = document.referrer || '';
  }
  fillHidden();

  /* ---------- тема обращения и переход к форме ---------- */
  var topicInput = form.elements.topic;
  var topicBox = $('.req__topic');
  var topicLabel = $('[data-topic-label]');
  var DEFAULT_TOPIC = 'Расчёт проекта';

  function setTopic(t) {
    topicInput.value = t || DEFAULT_TOPIC;
    if (t && t !== DEFAULT_TOPIC) { topicLabel.textContent = t; topicBox.hidden = false; }
    else { topicBox.hidden = true; }
  }
  $('.req__topic-x').addEventListener('click', function () { setTopic(DEFAULT_TOPIC); });

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-topic]') : null;
    if (!b) return;
    e.preventDefault();
    setTopic(b.getAttribute('data-topic'));
    var target = $('#request');
    if (target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () { try { form.elements.name.focus({ preventScroll: true }); } catch (err) { /* ignore */ } }, 700);
  });

  /* ---------- закреплённая кнопка на мобильных ---------- */
  (function sticky() {
    var bar = $('.b2b-sticky');
    if (!bar || !('IntersectionObserver' in window)) return;
    var visible = {};
    var update = function () { bar.classList.toggle('is-off', !!(visible.cta || visible.form)); };
    bar.classList.add('is-off');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.getAttribute('data-sticky-watch')] = en.isIntersecting; });
      update();
    }, { threshold: 0.15 });
    var cta = $('.b2bh__cta'), req = $('#request');
    if (cta) { cta.setAttribute('data-sticky-watch', 'cta'); io.observe(cta); }
    if (req) { req.setAttribute('data-sticky-watch', 'form'); io.observe(req); }
  })();

  /* ---------- файл ---------- */
  var fileInput = form.elements.project_file;
  var fileLabel = $('.fu', form);
  var fileName = $('[data-file-name]', form);
  var fileClear = $('[data-file-clear]', form);
  var FILE_HINT = fileName.textContent;

  function fileError(msg) { setErr('file', msg); }
  function resetFile() {
    fileInput.value = '';
    fileName.textContent = FILE_HINT;
    fileLabel.classList.remove('has-file');
    fileClear.hidden = true;
  }
  fileInput.addEventListener('change', function () {
    fileError('');
    var f = fileInput.files && fileInput.files[0];
    if (!f) { resetFile(); return; }
    var ext = (f.name.split('.').pop() || '').toLowerCase();
    if (FILE_EXT.indexOf(ext) === -1) { resetFile(); fileError('Допустимые форматы: PDF, DWG, JPG, ZIP.'); return; }
    if (f.size > MAX_FILE) { resetFile(); fileError('Файл больше 25 МБ. Сожмите его или пришлите ссылкой в поле «Объект и задача».'); return; }
    fileName.textContent = f.name + ' (' + (f.size / 1048576).toFixed(1).replace('.', ',') + ' МБ)';
    fileLabel.classList.add('has-file');
    fileClear.hidden = false;
  });
  fileClear.addEventListener('click', function () { resetFile(); fileError(''); });

  /* ---------- проверка и отправка ---------- */
  function setErr(name, msg) {
    var box = $('[data-err="' + name + '"]', form);
    if (box) box.textContent = msg || '';
    var el = form.elements[name === 'file' ? 'project_file' : name];
    if (el && el.type !== 'checkbox' && el.type !== 'file') el.classList.toggle('is-error', !!msg);
  }

  function validate() {
    var first = null, ok = true;
    function bad(name, msg) { setErr(name, msg); ok = false; if (!first) first = form.elements[name === 'file' ? 'project_file' : name]; }
    ['name', 'phone', 'email', 'consent'].forEach(function (n) { setErr(n, ''); });

    if (form.elements.name.value.trim().length < 2) bad('name', 'Укажите имя');
    if (form.elements.phone.value.replace(/\D/g, '').length < 11) bad('phone', 'Введите телефон полностью');
    var em = form.elements.email.value.trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) bad('email', 'Проверьте адрес почты');
    if (!form.elements.consent.checked) bad('consent', 'Нужно согласие на обработку персональных данных');
    if (first) { try { first.focus(); } catch (e) { /* ignore */ } }
    return ok;
  }

  var status = $('.bf__status', form);
  var submit = $('.bf__submit', form);

  function showStatus(msg, isErr) {
    status.innerHTML = msg;
    status.classList.toggle('bf__status--err', !!isErr);
    status.hidden = false;
  }

  function onSuccess() {
    goal('b2b_form', function () { location.href = THANKS_URL; });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.hidden = true;
    if (!validate()) return;
    if (form.elements.website.value) { location.href = THANKS_URL; return; } /* ловушка для ботов */

    fillHidden();
    var fd = new FormData(form);
    fd.delete('website');
    fd.set('_subject', form.elements.subject.value);

    var endpoint = window.B2B_FORM_ENDPOINT || window.FORM_ENDPOINT || '';
    var payload = {};
    fd.forEach(function (v, k) { payload[k] = (typeof v === 'string') ? v : ('[файл] ' + v.name); });
    window.__b2bLast = payload; /* для проверки в консоли */

    if (!endpoint) {
      if (isLocal) { if (window.console) console.info('[B2B-форма] обработчик не задан, режим проверки. Данные:', payload); onSuccess(); return; }
      showStatus('Форма пока не подключена к приёму заявок. Позвоните <a href="tel:+79216322809">+7 (921) 632-28-09</a> или напишите на <a href="mailto:km89r@mail.ru">km89r@mail.ru</a>.', true);
      return;
    }

    submit.disabled = true;
    fetch(endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); onSuccess(); })
      .catch(function () {
        submit.disabled = false;
        showStatus('Не удалось отправить заявку. Позвоните <a href="tel:+79216322809">+7 (921) 632-28-09</a> или напишите на <a href="mailto:km89r@mail.ru">km89r@mail.ru</a>.', true);
      });
  });

  form.addEventListener('input', function (e) { if (e.target.classList) e.target.classList.remove('is-error'); });
})();
