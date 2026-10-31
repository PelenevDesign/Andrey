/* Яндекс Метрика — счётчик 88022855 (тот же, что на сайте art-stone.site).
   На локальных адресах (localhost, 127.0.0.1, file://) настоящий счётчик не подключается,
   чтобы не портить статистику тестовыми заходами: вместо него работает заглушка,
   которая пишет вызовы в консоль и в массив window.__ymCalls. */
(function () {
  'use strict';
  var ID = 88022855;
  var host = location.hostname;
  var local = !host || location.protocol === 'file:' ||
    /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(host) || /\.(local|test|localhost)$/.test(host);

  if (local) {
    window.__ymCalls = window.__ymCalls || [];
    window.ym = function () {
      var args = Array.prototype.slice.call(arguments);
      window.__ymCalls.push(args);
      if (window.console) console.info('[Метрика: заглушка]', args.filter(function (a) { return typeof a !== 'function'; }));
      args.forEach(function (a) { if (typeof a === 'function') setTimeout(a, 0); });
    };
    return;
  }

  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    k = e.createElement(t); a = e.getElementsByTagName(t)[0];
    k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

  window.ym(ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
})();
