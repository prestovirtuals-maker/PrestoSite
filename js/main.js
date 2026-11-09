(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---- Sale promo bar + countdown ---- */
  var bar = document.getElementById('promo-bar');
  var endAttr = (bar && bar.getAttribute('data-sale-end')) || (document.querySelector('[data-sale-end]') || {}).getAttribute && document.querySelector('[data-sale-end]').getAttribute('data-sale-end');
  var end = endAttr ? new Date(endAttr).getTime() : 0;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    if (!end) return;
    var left = end - Date.now();
    var over = left <= 0;
    document.documentElement.classList.toggle('sale-over', over);
    if (over) { if (bar) bar.hidden = true; return; }
    var d = Math.floor(left / 864e5), h = Math.floor(left % 864e5 / 36e5),
        m = Math.floor(left % 36e5 / 6e4), s = Math.floor(left % 6e4 / 1e3);
    var pc = document.getElementById('promo-count');
    if (pc) pc.textContent = d >= 1 ? 'Ends in ' + d + (d === 1 ? ' day' : ' days') : 'Ends in ' + h + 'h ' + pad(m) + 'm';
    [['d', d], ['h', h], ['m', m], ['s', s]].forEach(function (p) {
      var el = document.querySelector('[data-cd="' + p[0] + '"]');
      if (el) el.textContent = p[0] === 'd' ? p[1] : pad(p[1]);
    });
  }
  tick();
  if (end) setInterval(tick, 1000);

  var close = document.querySelector('.promo-close');
  if (bar && close) {
    try { if (sessionStorage.getItem('promoClosed') === '1') bar.hidden = true; } catch (e) {}
    close.addEventListener('click', function () {
      bar.hidden = true;
      try { sessionStorage.setItem('promoClosed', '1'); } catch (e) {}
    });
  }
})();
