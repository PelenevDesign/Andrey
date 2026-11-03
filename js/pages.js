/* Art Stone — поведение внутренних страниц */
(function () {
  'use strict';
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* появление анимированных элементов нулевых блоков */
  (function anim() {
    var items = $$('[data-anim]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, d = parseFloat(el.getAttribute('data-anim-delay') || 0);
        setTimeout(function () { el.classList.add('is-in'); }, d * 1000);
        io.unobserve(el);
      });
    }, { threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
  })();
})();

/* лайтбокс для галерей, формы нулевых блоков */
(function () {
  'use strict';
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* ---------- лайтбокс ---------- */
  var zoomables = $$('[data-zoom]');
  if (zoomables.length) {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<button type="button" class="lightbox__btn lightbox__btn--close" aria-label="Закрыть"></button>' +
      '<button type="button" class="lightbox__btn lightbox__btn--prev" aria-label="Предыдущее фото"></button>' +
      '<img class="lightbox__img" alt="">' +
      '<button type="button" class="lightbox__btn lightbox__btn--next" aria-label="Следующее фото"></button>';
    document.body.appendChild(box);
    var img = $('.lightbox__img', box), cur = 0, list = [];
    var show = function (i) {
      cur = (i + list.length) % list.length;
      img.src = list[cur].getAttribute('data-zoom');
    };
    var close = function () { box.hidden = true; document.body.classList.remove('is-locked'); img.removeAttribute('src'); };
    zoomables.forEach(function (el) {
      el.addEventListener('click', function () {
        var scope = el.closest('[data-gallery]') || el.closest('section');
        list = zoomables.filter(function (z) { return scope.contains(z); });
        show(list.indexOf(el));
        box.hidden = false;
        document.body.classList.add('is-locked');
      });
    });
    $('.lightbox__btn--close', box).addEventListener('click', close);
    $('.lightbox__btn--prev', box).addEventListener('click', function () { show(cur - 1); });
    $('.lightbox__btn--next', box).addEventListener('click', function () { show(cur + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
  }

  /* ---------- формы внутри нулевых блоков ---------- */
  $$('.zf').forEach(function (form) {
    var ok = $('.zf__ok', form), btn = $('.zf__btn', form);
    function err(el, msg) {
      var g = el.closest('.zf__g'), box = $('.zf__err', g);
      if (el.type !== 'checkbox') el.classList.toggle('is-error', !!msg);
      if (box) box.textContent = msg || '';
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      $$('.zf__in[required]', form).forEach(function (el) {
        var bad = !el.value.trim() || (el.type === 'tel' && el.value.replace(/\D/g, '').length < 11);
        err(el, bad ? (el.type === 'tel' ? 'Введите корректный номер телефона' : 'Заполните это поле') : '');
        if (bad) valid = false;
      });
      $$('.zf__cb input', form).forEach(function (c) {
        err(c, c.checked ? '' : 'Необходимо согласие с политикой конфиденциальности');
        if (!c.checked) valid = false;
      });
      if (!valid) return;
      var data = new FormData(form);
      data.append('form', form.getAttribute('data-form') || '');
      btn.disabled = true;
      var done = function () {
        btn.disabled = false; ok.hidden = false; form.reset();
        setTimeout(function () { ok.hidden = true; }, 6000);
      };
      if (!window.FORM_ENDPOINT) { done(); return; }
      fetch(window.FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
        .catch(function () { btn.disabled = false; err($('.zf__cb input', form) || btn, 'Не удалось отправить заявку. Позвоните нам: +7(921)632-28-09'); });
    });
  });
})();

/* слайдер-галерея (t1148) и видео-попап */
(function () {
  'use strict';
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  $$('[data-gslider]').forEach(function (root) {
    var view = $('.sl__view', root), prev = $('.sl__btn--prev', root), next = $('.sl__btn--next', root);
    var step = function () { var it = $('.sl__item', root); return it ? it.getBoundingClientRect().width : 300; };
    var sync = function () {
      prev.disabled = view.scrollLeft <= 4;
      next.disabled = view.scrollLeft >= view.scrollWidth - view.clientWidth - 4;
    };
    prev.addEventListener('click', function () { view.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { view.scrollBy({ left: step(), behavior: 'smooth' }); });
    view.addEventListener('scroll', function () { window.requestAnimationFrame(sync); }, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  var vp = $('#popup-video');
  if (vp) {
    var frame = $('iframe', vp);
    var setSrc = function () {
      if (vp.hidden) frame.removeAttribute('src');
      else if (!frame.getAttribute('src')) frame.setAttribute('src', frame.getAttribute('data-src'));
    };
    new MutationObserver(setSrc).observe(vp, { attributes: true, attributeFilter: ['hidden'] });
  }
})();

/* горизонтальная прокрутка шагов, привязанная к вертикальному скроллу */
(function () {
  'use strict';
  var blocks = Array.prototype.slice.call(document.querySelectorAll('[data-hscroll]'));
  if (!blocks.length) return;
  var mq = window.matchMedia('(min-width: 960px)');
  var ticking = false;
  function update() {
    ticking = false;
    blocks.forEach(function (b) {
      var track = b.querySelector('.hs__track'), cards = track.querySelectorAll('.hs__card');
      if (!mq.matches || cards.length < 2) { track.style.transform = ''; return; }
      var pin = b.querySelector('.hs__pin');
      var total = b.offsetHeight - pin.offsetHeight;
      var p = Math.min(1, Math.max(0, (-b.getBoundingClientRect().top) / total));
      var step = cards[1].offsetLeft - cards[0].offsetLeft;
      track.style.transform = 'translate3d(' + (-p * step * (cards.length - 1)) + 'px,0,0)';
    });
  }
  function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
