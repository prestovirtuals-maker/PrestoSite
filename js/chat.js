/* Presto chat assistant: answers common questions from the site's own content and
   takes messages. Messages are sent to the Google Apps Script endpoint (Sheet + email). */
(function () {
  'use strict';
  var cfg = window.PRESTO_CHAT || {};
  var BOOK = cfg.bookingUrl || 'https://calendly.com/presto_virtual/30min';
  var OWNER = cfg.ownerEmail || 'prestovirtuals@gmail.com';
  var ENDPOINT = cfg.endpoint || '';
  var SALE_END = new Date('2026-11-28T00:00:00-05:00').getTime();
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var KB = [
    { re: /^(hi|hello|hey|good (morning|afternoon|evening))\b/i,
      a: "Hi there! I can answer quick questions about our services, or take a message for the team." },
    { re: /leave.*message|send.*message|contact|talk to|speak|human|someone|owner|reach (you|out)|email you|get back to me|call me/i, lead: true },
    { re: /black friday|\bsale\b|\bbank\b|deal|discount|promo|free hours?|early bird/i, sale: true },
    { re: /starter|social|instagram|facebook|tiktok|linkedin|pinterest|hashtag|posts?\b|content|caption/i,
      a: "Social media comes in three monthly plans, priced the same in CAD or USD: Starter ($550, 10 posts a month across 2 platforms), Level Up ($950, 20 posts a month across 3 platforms, with custom graphics, stories and a monthly report) and Media Boss ($1,450, 30 posts a month with daily multi-platform posting). Add-ons are +$150/month each: extra platforms, or community management (replying to comments and DMs). New account setup and profile optimization are available too.",
      link: { label: 'See services', href: 'index.html#services' } },
    { re: /tech|website|web site|domain|hosting|logo|etsy|printful|e-?commerce|seo|landing page|online shop|catalogue/i,
      a: "Tech tasks cover website creation and management and landing pages. Add-ons include domain registration and hosting advice, e-commerce and SEO-optimized sites, logos, custom email, ongoing maintenance, Etsy and Printful shop setup, and product catalogues.",
      link: { label: 'See tech tasks', href: 'index.html#services' } },
    { re: /get started|get organized|package|admin|email|calendar|schedul|travel|data entry|invoice|expense|powerpoint|ppt|document|form\b|survey|e-?sign|research|supplies|customer service/i,
      a: "Administrative support comes in two packages, Get Started (10 hours, $395) and Get Organized (20 hours, $750). It covers appointment scheduling, editing and proofreading documents, PowerPoint decks, fillable forms and e-signatures, email and calendar management, data entry, travel booking, research, customer service, ordering supplies, invoicing and expense reconciliation. And more!",
      link: { label: 'See admin packages', href: 'index.html#packages' } },
    { re: /price|pricing|cost|rate|how much|fee|quote|afford/i,
      a: "Administrative support comes in two packages: Get Started (10 hours of work, $395) and Get Organized (20 hours of work, $750, with a dedicated executive assistant). Social media plans are monthly: Starter $550, Level Up $950 and Media Boss $1,450 (CAD or USD), and a free 30-minute call is the quickest way to find the right fit.",
      link: { label: 'See admin packages', href: 'index.html#packages' } },
    { re: /where|location|based|canada|canadian|\busa\b|u\.s\.?a?\b|united states|america|\bthe us\b|\bus (client|customer|business|compan|market|based)|\bin the us\b|toronto|mississauga|country|international|ontario/i,
      a: "We're based in Mississauga, Ontario and work remotely with business owners across Canada and the USA, during Eastern Time business hours (Mon to Fri, 9am to 5pm)." },
    { re: /\bhours?\b|open|available|availability|time ?zone|business hours/i,
      a: "Our hours are Monday to Friday, 9am to 5pm Eastern Time. Email is the best way to reach us outside those hours." },
    { re: /turnaround|how (long|fast|quick)|deadline|rush|urgent|how soon/i,
      a: "Turnaround is usually 2 to 3 business days. For time-sensitive projects we agree on a deadline before work begins." },
    { re: /book|call\b|meeting|consult|discovery|appointment|demo|get started|start\b/i,
      a: "You can book a free 30-minute call to talk through your priorities and get a proposal.",
      link: { label: 'Book a free call', href: BOOK, ext: true } },
    { re: /confiden|nda|privacy|secure|security|trust/i,
      a: "Confidentiality is a top priority, and an NDA can be signed on request." },
    { re: /contract|commit|cancel|long.?term/i,
      a: "Details depend on the plan you choose, and you get a proposal and agreement after your free call. Our sale hours are banked with no long contracts and are valid for 60 days." },
    { re: /thank|thanks|great|awesome|perfect|ok(ay)?$/i,
      a: "You're welcome! Anything else I can help with?" }
  ];

  var CHIPS = ['Services', 'Pricing', 'Black Friday sale', 'Where do you work?', 'Leave a message'];
  var CHIP_MAP = { 'Services': 'what services do you offer', 'Pricing': 'pricing', 'Black Friday sale': 'black friday sale',
                   'Where do you work?': 'where do you work', 'Leave a message': 'leave a message' };

  var state = { mode: 'chat', draft: {}, lastQ: '', open: false, sent: 0 };
  var els = {};

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function build() {
    var fab = el('button', 'chat-fab');
    fab.type = 'button';
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'chat-panel');
    fab.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>Chat with us</span>';

    var panel = el('section', 'chat-panel');
    panel.id = 'chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat with Presto Virtuals');
    panel.hidden = true;

    var head = el('div', 'chat-head');
    var ttl = el('div', 'chat-title');
    ttl.appendChild(el('strong', null, 'Presto Assistant'));
    ttl.appendChild(el('span', null, 'Automated assistant · messages go to our inbox'));
    var close = el('button', 'chat-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close chat');
    head.appendChild(ttl); head.appendChild(close);

    var log = el('div', 'chat-log');
    log.setAttribute('aria-live', 'polite');
    var chips = el('div', 'chat-chips');
    var form = el('form', 'chat-form');
    form.setAttribute('autocomplete', 'off');
    var input = el('input', 'chat-input');
    input.type = 'text'; input.maxLength = 1000;
    input.setAttribute('aria-label', 'Type your message');
    input.placeholder = 'Type your question…';
    var send = el('button', 'chat-send', 'Send');
    send.type = 'submit';
    form.appendChild(input); form.appendChild(send);

    panel.appendChild(head); panel.appendChild(log); panel.appendChild(chips); panel.appendChild(form);
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    els = { fab: fab, panel: panel, log: log, chips: chips, form: form, input: input, close: close };

    fab.addEventListener('click', function () { toggle(!state.open); });
    close.addEventListener('click', function () { toggle(false); });
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { toggle(false); fab.focus(); } });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return;
      input.value = '';
      handle(v);
    });
    showChips(CHIPS);
  }

  function toggle(open) {
    state.open = open;
    els.panel.hidden = !open;
    els.fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    els.fab.classList.toggle('is-open', open);
    if (open) {
      if (!els.log.children.length) {
        bot("Hi! I'm Presto's virtual assistant (an automated chat, not a person). Ask me about our services, pricing or the Black Friday sale, or leave a message and it will go straight to our inbox.");
      }
      setTimeout(function () { els.input.focus(); }, 50);
    }
  }

  function scroll() { els.log.scrollTop = els.log.scrollHeight; }

  function bubble(who, text, link) {
    var b = el('div', 'chat-msg ' + who);
    b.appendChild(el('p', null, text));
    if (link) {
      var a = el('a', 'chat-link', link.label + ' →');
      a.href = link.href;
      if (link.ext) { a.target = '_blank'; a.rel = 'noopener'; }
      b.appendChild(a);
    }
    els.log.appendChild(b);
    scroll();
    return b;
  }
  function bot(text, link) { return bubble('bot', text, link); }
  function user(text) { return bubble('user', text); }

  function showChips(list) {
    els.chips.textContent = '';
    list.forEach(function (c) {
      var b = el('button', 'chat-chip', c);
      b.type = 'button';
      b.addEventListener('click', function () { handle(c, true); });
      els.chips.appendChild(b);
    });
    els.chips.hidden = !list.length;
  }

  function saleAnswer() {
    if (Date.now() >= SALE_END) {
      return ["Our Black Friday sale has ended. Message us or book a free call to hear about our current plans.", { label: 'Book a free call', href: BOOK, ext: true }];
    }
    return ["Black Friday Early Bird: buy 15 hours, get 5 FREE. The Admin Bank is 20 hours for $525 and the Social Bank is 20 hours for $675. Hours are valid for 60 days, with no long contracts. It's limited to the first 10 businesses and ends at midnight on November 27, 2026 (ET).",
            { label: 'See sale details', href: 'black-friday.html' }];
  }

  function handle(text, fromChip) {
    user(text);
    if (/^\s*(cancel|stop|never ?mind|exit)\s*$/i.test(text) && state.mode !== 'chat') {
      state.mode = 'chat'; state.draft = {};
      bot("No problem, I've cancelled that. What else can I help with?");
      showChips(CHIPS);
      return;
    }
    if (state.mode !== 'chat') return step(text);
    answer(fromChip && CHIP_MAP[text] ? CHIP_MAP[text] : text, text);
  }

  function answer(q, original) {
    for (var i = 0; i < KB.length; i++) {
      var k = KB[i];
      if (!k.re.test(q)) continue;
      if (k.lead) return startLead('');
      if (k.sale) { var s = saleAnswer(); bot(s[0], s[1]); return afterAnswer(); }
      bot(k.a, k.link);
      return afterAnswer();
    }
    state.lastQ = original || q;
    bot("I'm not sure about that one, but the team can answer it. Want me to pass your question on? It goes straight to our inbox and we'll reply by email.");
    showChips(['Yes, send it to the team', 'No thanks']);
    state.mode = 'offer';
  }

  function afterAnswer() {
    bot("Anything else? You can also leave a message for the team.");
    showChips(['Leave a message', 'Book a free call', 'Pricing']);
  }

  function startLead(prefill) {
    state.draft = { message: prefill || '' };
    if (state.draft.message) { state.mode = 'name'; bot("Sure. What's your name?"); }
    else { state.mode = 'message'; bot("Happy to pass a message to the team. What's your question or message?"); }
    showChips([]);
    els.input.placeholder = state.mode === 'name' ? 'Your name' : 'Your question or message';
  }

  function step(text) {
    var d = state.draft;
    if (state.mode === 'offer') {
      if (/^(yes|yeah|yep|sure|ok|okay|please|y)\b/i.test(text)) return startLead(state.lastQ);
      state.mode = 'chat';
      if (/^(no|nope|nah|not now|no thanks|no thank you)\b/i.test(text)) {
        bot("No problem. Is there anything else I can help with?");
        showChips(CHIPS);
        return;
      }
      return answer(text, text);      // they asked something new instead
    }
    if (state.mode === 'message') {
      d.message = text.slice(0, 1000); state.mode = 'name';
      bot("Thanks. What's your name?"); els.input.placeholder = 'Your name';
      return;
    }
    if (state.mode === 'name') {
      d.name = text.slice(0, 100); state.mode = 'email';
      bot("Nice to meet you, " + d.name + ". What's the best email address to reply to?");
      els.input.placeholder = 'you@example.com'; els.input.type = 'email';
      return;
    }
    if (state.mode === 'email') {
      if (!EMAIL_RE.test(text)) { bot("That doesn't look like a valid email address. Could you check it?"); return; }
      d.email = text.slice(0, 200); state.mode = 'phone'; els.input.type = 'text';
      bot("Got it. Want to add a phone number? It's optional, so type \"skip\" to leave it out.");
      els.input.placeholder = 'Phone (optional) or "skip"';
      showChips(['skip']);
      return;
    }
    if (state.mode === 'phone') {
      d.phone = /^(skip|no|none|n\/a)$/i.test(text) ? '' : text.slice(0, 40);
      showChips([]);
      return submit();
    }
  }

  function submit() {
    var d = state.draft;
    state.mode = 'sending';
    els.input.placeholder = 'Type your question…';
    if (state.sent >= 3) {
      state.mode = 'chat';
      bot("You've sent a few messages already. We'll get back to you by email soon, or you can book a free call.", { label: 'Book a free call', href: BOOK, ext: true });
      return;
    }
    var typing = bot('Sending your message…');
    var payload = {
      name: d.name, email: d.email, phone: d.phone || '', message: d.message,
      page: location.pathname + location.hash, sentAt: new Date().toISOString()
    };
    function done(ok) {
      typing.remove();
      state.mode = 'chat'; state.draft = {};
      if (ok) {
        state.sent++;
        bot("Thanks, " + payload.name + "! Your message is on its way to our inbox and we'll reply to " + payload.email + ". In the meantime, you can book a free 30-minute call.",
            { label: 'Book a free call', href: BOOK, ext: true });
      } else {
        var body = 'Name: ' + payload.name + '\nEmail: ' + payload.email + '\nPhone: ' + payload.phone + '\n\n' + payload.message;
        var href = 'mailto:' + OWNER + '?subject=' + encodeURIComponent('Website message from ' + payload.name) + '&body=' + encodeURIComponent(body);
        bot("I couldn't send that automatically. Tap below to email it to us instead. Your message is already filled in.", { label: 'Email your message', href: href });
      }
      showChips(['Services', 'Pricing', 'Leave a message']);
    }
    if (!ENDPOINT) return setTimeout(function () { done(false); }, 400);
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(function () { done(true); })
      .catch(function () { done(false); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
