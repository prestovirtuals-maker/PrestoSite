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

  /* Promo bar phases (home page only). Default bar = Black Friday, ends midnight Nov 27.
     Later phases swap the message by date (Toronto time). Outside every phase the expired default bar stays hidden. */
  var promoKey = 'promoClosed';
  var PROMO_PHASES = [
    { start: '2026-11-29T00:00:00-05:00', end: '2026-12-05T00:00:00-05:00', key: 'promoClosedCyber', label: 'Cyber Week sale',
      html: '<strong>Cyber Week Sale:</strong> Admin: buy 15 hours, get 5 FREE &middot; 20 hours for $525 <span class="promo-count" id="promo-count"></span>',
      href: '#packages', cta: 'See admin packages &darr;' },
    { start: '2026-12-07T00:00:00-05:00', end: '2026-12-12T00:00:00-05:00', key: 'promoClosedYearEnd', label: 'Year-end sale',
      html: '<strong>Year-End Sale:</strong> Admin: buy 15 hours, get 5 FREE &middot; 20 hours for $525 <span class="promo-count" id="promo-count"></span>',
      href: '#packages', cta: 'See admin packages &darr;' },
    /* Dec 8 and Dec 10: social media offer (later phases override the year-end phase above). Offer itself runs to Dec 31. */
    { start: '2026-12-08T00:00:00-05:00', end: '2026-12-09T00:00:00-05:00', key: 'promoClosedSocial', label: 'Social media sale',
      html: '<strong>Social Media Sale:</strong> $100 off your first month of the Starter plan ($450, reg. $550) &middot; ends Dec 31',
      href: '#social-packages', cta: 'See social plans &darr;' },
    { start: '2026-12-10T00:00:00-05:00', end: '2026-12-11T00:00:00-05:00', key: 'promoClosedSocial', label: 'Social media sale',
      html: '<strong>Social Media Sale:</strong> $100 off your first month of the Starter plan ($450, reg. $550) &middot; ends Dec 31',
      href: '#social-packages', cta: 'See social plans &darr;' },
    { start: '2026-12-14T00:00:00-05:00', end: '2026-12-19T00:00:00-05:00', key: 'promoClosedRescue', label: 'CEO Holiday Rescue deal',
      html: '<strong>CEO Holiday Rescue:</strong> 10 hours of VA support + executive perks for $399 flat &middot; limited spots <span class="promo-count" id="promo-count"></span>',
      href: '#contact', cta: 'Claim your spot &darr;' },
    /* Dec 19 - Dec 31: social media offer returns to the bar (ends Dec 31 at midnight) */
    { start: '2026-12-19T00:00:00-05:00', end: '2027-01-01T00:00:00-05:00', key: 'promoClosedSocialLate', label: 'Social media sale',
      html: '<strong>Social Media Sale:</strong> $100 off your first month of the Starter plan ($450, reg. $550) <span class="promo-count" id="promo-count"></span>',
      href: '#social-packages', cta: 'See social plans &darr;' }
  ];
  if (bar && bar.hasAttribute('data-cyber')) {
    var nowT = Date.now();
    PROMO_PHASES.forEach(function (ph) {
      if (nowT >= new Date(ph.start).getTime() && nowT < new Date(ph.end).getTime()) {
        bar.setAttribute('data-sale-end', ph.end);
        bar.setAttribute('aria-label', ph.label);
        var msg = bar.querySelector('.promo-inner p');
        if (msg) msg.innerHTML = ph.html;
        var lnk = bar.querySelector('.promo-link');
        if (lnk) { lnk.setAttribute('href', ph.href); lnk.innerHTML = ph.cta; }
        promoKey = ph.key;
      }
    });
  }
  /* Elements with data-offer-start / data-offer-end are only shown inside that window */
  document.querySelectorAll('[data-offer-end]').forEach(function (el) {
    var t = Date.now(), st = el.getAttribute('data-offer-start'), en = el.getAttribute('data-offer-end');
    var on = (!st || t >= new Date(st).getTime()) && (!en || t < new Date(en).getTime());
    el.hidden = !on;
  });
  var endAttr = (bar && bar.getAttribute('data-sale-end')) || (document.querySelector('[data-sale-end]') || {}).getAttribute && document.querySelector('[data-sale-end]').getAttribute('data-sale-end');
  var end = endAttr ? new Date(endAttr).getTime() : 0;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    if (!end) return;
    var left = end - Date.now();
    var over = left <= 0;
    if (over) {
      if (bar) bar.hidden = true;
      ['d', 'h', 'm', 's'].forEach(function (k) { var el = document.querySelector('[data-cd="' + k + '"]'); if (el) el.textContent = k === 'd' ? '0' : '00'; });
      return;
    }
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
    try { if (sessionStorage.getItem(promoKey) === '1') bar.hidden = true; } catch (e) {}
    close.addEventListener('click', function () {
      bar.hidden = true;
      try { sessionStorage.setItem(promoKey, '1'); } catch (e) {}
    });
  }
})();
