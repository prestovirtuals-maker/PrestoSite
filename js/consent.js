/* Cookie notice: opt-out model. Nothing non-essential is loaded by default today.
   If analytics or marketing scripts are ever added, load them only when
   window.prestoCookiesAllowed() returns true. */
(function () {
  var KEY = 'prestoCookiePref';
  var note = document.getElementById('cookie-note');
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  window.prestoCookiesAllowed = function () { return get() !== 'optout'; };

  function clearTracking() {
    var names = ['_ga', '_gid', '_gat', '_gcl_au', '_fbp', '_fbc'];
    var host = location.hostname.split('.');
    var domains = ['', location.hostname, '.' + location.hostname];
    if (host.length > 2) domains.push('.' + host.slice(-2).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (names.indexOf(n) > -1 || /^_ga_/.test(n)) {
        domains.forEach(function (d) { document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : ''); });
      }
    });
  }

  if (!note) return;
  var msg = note.querySelector('.cookie-msg');
  var status = note.querySelector('.cookie-status');
  var actions = note.querySelector('.cookie-actions');
  function show() { note.hidden = false; if (status) status.textContent = ''; if (msg) msg.hidden = false; if (actions) actions.hidden = false; }
  function hide() { note.hidden = true; }

  if (!get()) show();

  var ok = document.getElementById('cookie-ok');
  var out = document.getElementById('cookie-optout');
  if (ok) ok.addEventListener('click', function () { set('accepted'); hide(); });
  if (out) out.addEventListener('click', function (e) {
    e.preventDefault();
    set('optout'); clearTracking();
    if (msg) msg.hidden = true; if (actions) actions.hidden = true;
    if (status) status.textContent = "You've opted out of non-essential cookies. Essential storage stays on so the site keeps working.";
    setTimeout(hide, 4000);
  });
  document.querySelectorAll('[data-cookie-settings]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); show(); });
  });
  if (get() === 'optout') clearTracking();
})();
