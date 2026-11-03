/* Art Stone — поведение страницы: меню, слайдер, аккордеон, попапы, формы */
(function () {
  'use strict';

  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };
  /* «stupeni», «stupeni.html», «./», «../» -> ключ страницы */
  var pageKey = function (href) {
    var h = (href || '').split('#')[0].split('?')[0].replace(/\.html$/, '');
    h = h.split('/').filter(function (x) { return x && x !== '.' && x !== '..'; }).pop() || 'index';
    return h;
  };

  /* ---------- Куда отправлять заявки ----------
     Сейчас формы только проверяют поля и показывают сообщение об успехе.
     Чтобы заявки реально уходили, укажите адрес обработчика (например, Formspree,
     собственный PHP-скрипт или webhook CRM): window.FORM_ENDPOINT = 'https://...';        */
  /* На хостинге с PHP (Бегет) заявки принимает send.php. Локально и на github.io обработчика нет. */
  var devHost = !location.hostname || location.protocol === 'file:' || /^(localhost|127\.|\[::1\])/.test(location.hostname) || /\.github\.io$/.test(location.hostname);
  window.FORM_ENDPOINT = window.FORM_ENDPOINT || (devHost ? '' : '/send.php');

  /* ---------- появление блоков при скролле: из размытия, с лёгким сдвигом ---------- */
  (function reveal() {
    var SEL = [
      'main h1', 'main h2', 'main .sh__l', 'main .sx__descr', 'main .h-head__l', 'main .t-statement__cap',
      '.hero2__kicker', '.hero2__lead', '.hero2__act', '.h-hero__lead', '.h-hero__act', '.b2bh__sub', '.b2bh__cta', '.b2bh__stats',
      '.facts__i', '.h-facts__list > li', '.h-card', '.wcard', '.scard', '.rw__img', '.rw__txt', '.f66__item', '.f66__img',
      '.c902', '.st', '.c12', '.l510__i', '.c686', '.gal__item', '.mat__i', '.mat__grid > *', '.why__i', '.rc', '.h-row',
      '.prodx__img', '.prodx__card', '.h-prod__fig', '.h-prod__txt', '.h-prod__dl', '.calc__in', '.cta2__in', '.h-cta__row', '.acc',
      '.sl__item', '.art__cover', '.art__text > section > *', '.art__cta', '.pcard', '.client', '.step', '.case', '.terms li',
      '.ftr__cta', '.ftr__grid > *', '.contacts__box', '.h-b2b__box', '.tx68 > *', '.h218__img', '.h218__in', '.split__body',
      '.checks li', '.req__side', '.bf'
    ].join(',');
    var SKIP = '.h-about, .hs__pin, .popup, .mmenu, .hdr, [data-anim], .lightbox';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    $$(SEL).forEach(function (el) {
      if (el.closest(SKIP) || el.classList.contains('reveal')) return;
      if (el.parentElement && el.parentElement.closest('.bl, .reveal')) return;
      el.classList.add('bl');
    });
    var items = $$('.reveal, .bl');
    /* соседние элементы одного ряда появляются по очереди */
    items.forEach(function (el) {
      var sib = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains('bl') || c.classList.contains('reveal'); });
      var k = sib.indexOf(el);
      if (k > 0) el.style.transitionDelay = Math.min(k, 5) * 90 + 'ms';
    });
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('is-in'); io.unobserve(el);
        if (el.style.transitionDelay) setTimeout(function () { el.style.transitionDelay = ''; }, 1600);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- выпадающее меню «Изделия» ---------- */
  (function dropdowns() {
    var drops = $$('[data-drop]');
    drops.forEach(function (d) {
      var trigger = $('[aria-haspopup]', d);
      if (!trigger) return;
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        var open = !d.classList.contains('is-open');
        drops.forEach(function (x) { x.classList.remove('is-open'); var t = $('[aria-haspopup]', x); if (t) t.setAttribute('aria-expanded', 'false'); });
        d.classList.toggle('is-open', open);
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-drop]')) return;
      drops.forEach(function (x) { x.classList.remove('is-open'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') drops.forEach(function (x) { x.classList.remove('is-open'); });
    });
  })();

  /* ---------- мобильное меню ---------- */
  (function mobileMenu() {
    var menu = $('#mmenu');
    if (!menu) return;
    function set(open) {
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.classList.toggle('is-locked', open);
    }
    $$('[data-menu-open]').forEach(function (b) { b.addEventListener('click', function () { set(true); }); });
    $$('[data-menu-close]', menu).forEach(function (b) { b.addEventListener('click', function () { set(false); }); });
    var tgl = $('.mmenu__sub-toggle', menu);
    if (tgl) tgl.addEventListener('click', function () {
      var g = tgl.parentNode, open = !g.classList.contains('is-open');
      g.classList.toggle('is-open', open);
      tgl.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });

    /* текущий раздел; на странице изделия список изделий сразу раскрыт */
    var here = pageKey(location.pathname.split('/').pop());
    $$('a', menu).forEach(function (a) {
      var h = pageKey(a.getAttribute('href'));
      if (h === here && !a.classList.contains('mmenu__logo')) { a.classList.add('is-active'); a.setAttribute('aria-current', 'page'); }
    });
    if (tgl && $('.mmenu__sub a.is-active', menu)) tgl.click();
  })();

  /* ---------- слайдер «Примеры наших работ» ---------- */
  (function slider() {
    var root = $('[data-slider]');
    if (!root) return;
    var section = root.closest('.works');
    var track = $('.works__track', root);
    var slides = $$('.works__slide', root);
    var prev = $('.works__arrow--prev', root);
    var next = $('.works__arrow--next', root);
    var pos = 0, startX = null;

    function perView() {
      var w = window.innerWidth;
      return w >= 960 ? 3 : (w >= 640 ? 2 : 1);
    }
    function maxPos() { return Math.max(0, slides.length - perView()); }
    function render() {
      var per = perView();
      section.style.setProperty('--per', per);
      pos = Math.min(pos, maxPos());
      track.style.transform = 'translateX(' + (-pos * (100 / per)) + '%)';
      prev.hidden = pos <= 0;
      next.hidden = pos >= maxPos();
      slides.forEach(function (s, i) {
        var visible = i >= pos && i < pos + per;
        s.setAttribute('aria-hidden', visible ? 'false' : 'true');
      });
    }
    prev.addEventListener('click', function () { pos = Math.max(0, pos - 1); render(); });
    next.addEventListener('click', function () { pos = Math.min(maxPos(), pos + 1); render(); });
    window.addEventListener('resize', render);

    /* свайп на тач-экранах */
    root.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { pos = Math.max(0, Math.min(maxPos(), pos + (dx < 0 ? 1 : -1))); render(); }
      startX = null;
    }, { passive: true });
    render();
  })();

  /* ---------- аккордеон FAQ ---------- */
  (function accordion() {
    $$('.acc').forEach(function (acc) {
      var head = $('.acc__head', acc);
      var body = $('.acc__body', acc);
      head.addEventListener('click', function () {
        var open = head.getAttribute('aria-expanded') === 'true';
        head.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (open) {
          body.style.height = body.scrollHeight + 'px';
          requestAnimationFrame(function () {
            body.style.transition = 'height .3s ease';
            body.style.height = '0px';
          });
          setTimeout(function () { if (head.getAttribute('aria-expanded') === 'false') { body.hidden = true; body.style.cssText = ''; } }, 320);
        } else {
          body.hidden = false;
          body.style.height = '0px';
          requestAnimationFrame(function () {
            body.style.transition = 'height .3s ease';
            body.style.height = body.scrollHeight + 'px';
          });
          setTimeout(function () { if (head.getAttribute('aria-expanded') === 'true') body.style.cssText = ''; }, 320);
        }
      });
    });
  })();

  /* ---------- попапы ---------- */
  (function popups() {
    var lastFocus = null;
    function open(name) {
      var p = $('#popup-' + name);
      if (!p) return;
      lastFocus = document.activeElement;
      p.hidden = false;
      document.body.classList.add('is-locked');
      var first = $('input[type="text"]', p);
      if (first) setTimeout(function () { first.focus(); }, 50);
    }
    function close(p) {
      p.hidden = true;
      document.body.classList.remove('is-locked');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.addEventListener('click', function (e) {
      var opener = e.target.closest('[data-popup]');
      if (opener) { e.preventDefault(); open(opener.getAttribute('data-popup')); return; }
      var closer = e.target.closest('[data-popup-close]');
      if (closer) { close(closer.closest('.popup')); return; }
      if (e.target.classList && e.target.classList.contains('popup')) close(e.target);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      $$('.popup').forEach(function (p) { if (!p.hidden) close(p); });
    });
  })();

  /* ---------- маска телефона +7 (999) 999-9999 ---------- */
  function applyMask(input) {
    var digits = input.value.replace(/\D/g, '');
    if (digits[0] === '7' || digits[0] === '8') digits = digits.slice(1);
    digits = digits.slice(0, 10);
    var out = '';
    if (digits.length || input === document.activeElement) {
      out = '+7';
      if (digits.length) out += ' (' + digits.slice(0, 3);
      if (digits.length >= 3) out += ')';
      if (digits.length > 3) out += ' ' + digits.slice(3, 6);
      if (digits.length > 6) out += '-' + digits.slice(6, 10);
    }
    input.value = out;
  }
  $$('[data-mask]').forEach(function (inp) {
    inp.addEventListener('input', function () { applyMask(inp); });
    inp.addEventListener('focus', function () { if (!inp.value) inp.value = '+7 ('; });
    inp.addEventListener('blur', function () { if (inp.value.replace(/\D/g, '').length <= 1) inp.value = ''; });
  });

  /* ---------- формы ---------- */
  $$('.form').forEach(function (form) {
    var phone = $('[name="Phone"]', form);
    var agree = $('[name="Checkbox"]', form);
    var ok = $('.form__ok', form);
    var btn = $('.form__submit', form);

    function setErr(el, msg) {
      var box = el.closest('.form__group');
      var err = $('.form__err', box);
      if (el.type !== 'checkbox') el.classList.toggle('is-error', !!msg);
      if (err) err.textContent = msg || '';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      setErr(phone, '');
      if (agree) setErr(agree, '');
      if (phone.value.replace(/\D/g, '').length < 11) { setErr(phone, 'Введите корректный номер телефона'); valid = false; }
      if (!agree.checked) { setErr(agree, 'Необходимо согласие с политикой конфиденциальности'); valid = false; }
      if (!valid) return;

      var data = new FormData(form);
      data.append('form', form.getAttribute('data-form'));
      btn.disabled = true;

      var done = function () {
        btn.disabled = false;
        ok.hidden = false;
        form.reset();
        $$('input[type="checkbox"]', form).forEach(function (c) { c.checked = true; });
        setTimeout(function () { ok.hidden = true; }, 6000);
      };

      if (!window.FORM_ENDPOINT) { done(); return; }
      fetch(window.FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
        .catch(function () {
          btn.disabled = false;
          setErr(agree, 'Не удалось отправить заявку. Позвоните нам: +7(921)632-28-09');
        });
    });
    form.addEventListener('input', function (e) { if (e.target.classList) e.target.classList.remove('is-error'); });
  });

  /* ---------- Яндекс.Карта (подгружается при подходе к блоку) ---------- */
  (function yandexMap() {
    $$('#ymap, [data-ymap]').forEach(initMap);
  })();
  function initMap(el) {
    var lat = parseFloat(el.getAttribute('data-lat'));
    var lng = parseFloat(el.getAttribute('data-lng'));
    var zoom = parseInt(el.getAttribute('data-zoom'), 10);
    var title = el.getAttribute('data-title');
    var started = false;

    function fallback() {
      el.innerHTML = '<iframe title="Карта: Art Stone" allowfullscreen ' +
        'src="https://yandex.ru/map-widget/v1/?ll=' + lng + '%2C' + lat + '&z=' + zoom + '&pt=' + lng + '%2C' + lat + '%2Cpm2blm"></iframe>';
    }
    function init() {
      window.ymaps.ready(function () {
        try {
          var map = new window.ymaps.Map(el, { center: [lat, lng], zoom: zoom, controls: ['zoomControl', 'typeSelector', 'geolocationControl', 'routeButtonControl'] });
          map.behaviors.disable('scrollZoom');
          map.geoObjects.add(new window.ymaps.Placemark([lat, lng], { hintContent: title, balloonContent: title }));
        } catch (err) { fallback(); }
      });
    }
    function load() {
      if (started) return;
      started = true;
      var s = document.createElement('script');
      s.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&coordorder=latlong';
      s.onload = init;
      s.onerror = fallback;
      document.head.appendChild(s);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries, io) {
        if (entries[0].isIntersecting) { io.disconnect(); load(); }
      }, { rootMargin: '700px 0px' }).observe(el);
    } else { load(); }
  }

  /* ---------- шапка: прозрачная над первым экраном, с фоном после прокрутки ---------- */
  (function header() {
    var hdr = $('#header');
    if (!hdr) return;
    /* текущий раздел в меню */
    var here = pageKey(location.pathname.split('/').pop());
    $$('.hdr__nav > a.hdr__link', hdr).forEach(function (a) {
      if (pageKey(a.getAttribute('href')) === here) { a.classList.add('is-active'); a.setAttribute('aria-current', 'page'); }
    });
    if ($$('.hdr__drop .drop a', hdr).some(function (a) { return pageKey(a.getAttribute('href')) === here; })) $('.hdr__drop > .hdr__link', hdr).classList.add('is-active');
    var hero = $('main > .h-hero:first-child, main > .hero2:first-child, main > .b2bh:first-child');
    if (!hero) { hdr.classList.add('is-solid'); return; }
    var set = function () { hdr.classList.toggle('is-solid', window.scrollY > 24); };
    window.addEventListener('scroll', set, { passive: true });
    set();
  })();

  /* ---------- плавающая кнопка звонка ---------- */
  (function floatCall() {
    var box = $('#fcall');
    if (!box) return;
    var btn = $('.fcall__btn', box);
    var close = $('.fcall__close', box);
    function set(open) {
      box.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function () { set(true); });
    close.addEventListener('click', function () { set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });

    /* рядом с формой, баннером «Узнайте стоимость», контактами и подвалом свой призыв к действию:
       кнопка там не нужна и не перекрывает поля */
    if ('IntersectionObserver' in window) {
      var zones = $$('.calc, .cta2, .cta, .contacts, .ftr, .bf, .b2b-form');
      var seen = new Set();
      var io = new IntersectionObserver(function (items) {
        items.forEach(function (it) { if (it.isIntersecting) seen.add(it.target); else seen.delete(it.target); });
        box.classList.toggle('is-away', seen.size > 0 && !box.classList.contains('is-open'));
      });
      zones.forEach(function (z) { io.observe(z); });
    }
  })();
})();

/* главная: «Мы делаем…» — экран закреплён, две части текста проявляются по очереди */
(function () {
  'use strict';
  var box = document.querySelector('[data-reveal-text]');
  if (!box) return;
  var parts = box.querySelectorAll('.h-about__part');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Array.prototype.forEach.call(parts, function (el) { el.style.setProperty('--k', 1); });
    return;
  }
  var ticking = false;
  var clamp = function (v) { return Math.min(1, Math.max(0, v)); };
  function update() {
    ticking = false;
    var total = box.offsetHeight - window.innerHeight;
    var p = clamp(-box.getBoundingClientRect().top / total);
    /* первая часть — первые ~110 px прокрутки (один шаг колеса), вторая — следующие ~200 px */
    var y = -box.getBoundingClientRect().top;
    parts[0].style.setProperty('--k', clamp(y / 110).toFixed(3));
    if (parts[1]) parts[1].style.setProperty('--k', clamp((y - 130) / 200).toFixed(3));
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* подвал: кнопка «Наверх» */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-to-top]');
    if (!a) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
})();
