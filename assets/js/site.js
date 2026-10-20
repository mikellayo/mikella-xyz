/* mikella.xyz site script.
   Replaces the parts of Adobe Portfolio's script the theme relies on:
   page fade-in, header on scroll, mobile menu, photo grid sizing,
   image load states, lightbox, hero video and the contact forms. */
(function () {
  'use strict';

  /* Contact form delivery. Set FORM_ENDPOINT to a Formspree URL
     (https://formspree.io/f/xxxxxxx) to receive submissions by email.
     Until then the form opens the visitor's email app addressed to CONTACT_EMAIL. */
  var FORM_ENDPOINT = '';
  var CONTACT_EMAIL = 'contact@mikella.studio';

  var doc = document, body = doc.body, html = doc.documentElement;
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); };

  /* ---------- page transitions ---------- */
  function fadeIn() { body.classList.add('transition-in'); }
  if (body.classList.contains('transition-enabled')) {
    requestAnimationFrame(fadeIn);
    window.addEventListener('pageshow', function (e) { if (e.persisted) { body.classList.remove('transition-out'); fadeIn(); } });
  }
  body.classList.add('link-transition', 'disable-download');
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || a.target === '_blank' || /^(mailto:|tel:|https?:)/.test(href)) return;
    e.preventDefault();
    body.classList.remove('transition-in');
    body.classList.add('transition-out');
    setTimeout(function () { location.href = href; }, 250);
  });
  doc.addEventListener('contextmenu', function (e) { if (e.target.tagName === 'IMG') e.preventDefault(); });

  /* ---------- fixed header changes colour once the page scrolls ---------- */
  var header = doc.querySelector('.js-site-header');
  function onScroll() { if (header) header.classList.toggle('on-scroll', window.scrollY > 0); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  $$('.js-hamburger').forEach(function (b) { b.addEventListener('click', function () { body.classList.add('show-responsive-nav'); }); });
  $$('.js-close-responsive-nav').forEach(function (b) { b.addEventListener('click', function () { body.classList.remove('show-responsive-nav'); }); });

  /* ---------- image load states ---------- */
  /* Single images hold their space with padding until they load, then the padding comes off. */
  function markLoaded(img) {
    if ((img.currentSrc || img.src).indexOf('data:') === 0) return;
    img.classList.add('image-loaded');
    if (img.getAttribute('height') === '0') {
      img.removeAttribute('height');
      img.style.paddingBottom = '';
      img.style.background = '';
    }
  }
  $$('img').forEach(function (img) {
    img.addEventListener('load', function () { markLoaded(img); });
    if (img.complete && img.naturalWidth) markLoaded(img);
  });

  /* ---------- photo grids ----------
     Same sizing rules as the old site's grid code: photos start at a row height of
     220px (170 / 130 / 90 on narrower grids), rows stretch to fill the width, and the row
     height is nudged until the last row isn't much taller than the others. */
  var BREAKPOINTS = [{ width: 1325, modifier: 220 / 260 }, { width: 1024, modifier: 170 / 260 }, { width: 768, modifier: 0.5 }, { width: 540, modifier: 90 / 260 }];
  var MAX_RATIO = 1.5;
  function cssFloat(el, prop) { return parseFloat(getComputedStyle(el)[prop]) || 0; }
  function gridData(grid) {
    return $$('.js-grid-item-container', grid).map(function (el) {
      var h = +el.getAttribute('data-height'), w = +el.getAttribute('data-width'), fw = +el.getAttribute('data-flex-grow');
      var cs = getComputedStyle(el);
      var nonContent = ['borderLeftWidth', 'borderRightWidth', 'paddingLeft', 'paddingRight', 'marginLeft', 'marginRight']
        .reduce(function (a, k) { return a + (parseFloat(cs[k]) || 0); }, 0);
      return { el: el, height: h, width: w, flexWidth: fw, flexHeight: Math.round(fw * h / w), nonContent: nonContent };
    });
  }
  function breakpointModifier(W) {
    return BREAKPOINTS.reduce(function (best, b) { return b.width >= W && b.width < best.width ? b : best; }, { width: Infinity, modifier: 1 }).modifier;
  }
  function rowHeights(data, W, s) {
    var rows = [], row = [], left = W;
    function flush() {
      if (!row.length) return;
      var sum = row.reduce(function (a, r) { return a + r.w; }, 0), k = W / sum;
      rows.push(row[0].h * k); row = [];
    }
    data.forEach(function (d) {
      var w = s * d.flexWidth + d.nonContent, h = s * d.flexHeight;
      if (left >= w) left -= w; else { flush(); left = W - w; }
      row.push({ w: w, h: h });
    });
    flush();
    return rows;
  }
  function sizeFree(grid, data) {
    var W = cssFloat(grid, 'width');
    var a = breakpointModifier(W), s = 1, u = 0, last = Infinity, avg = 1, f = -1;
    while (last / avg > MAX_RATIO && s < 2) {
      s = (1 + u * (f *= -1)) * a;
      var hs = rowHeights(data, W, s).reverse();
      last = hs[0];
      var rest = hs.slice(1);
      avg = rest.reduce(function (x, y) { return x + y; }, 0) / rest.length;
      u += 0.005;
    }
    var useS = s < 2 ? s : 1;
    data.forEach(function (d) { var w = useS * d.flexWidth; d.el.style.width = w + 'px'; d.el.style.flexGrow = '' + w; });
    var spacer = grid.querySelector('.js-grid-spacer');
    var toggle = function (on) { if (spacer) { spacer.classList.toggle('grid__item-spacer', on); spacer.style.display = on ? 'block' : 'none'; } };
    toggle(false);
    var lastItem = data.length ? data[data.length - 1].el : null;
    toggle(!(s < 2) || (lastItem && lastItem.clientHeight / avg > 2.5));
  }
  function sizeMax(grid, data, max) {
    for (var i = 0; i < data.length; i += max) {
      var row = data.slice(i, i + max);
      var avgH = row.reduce(function (a, d) { return a + d.height; }, 0) / row.length;
      var total = 0;
      row.forEach(function (d) { d.adj = d.width * (avgH / d.height); total += d.adj; });
      var W = Math.floor(cssFloat(grid, 'width'));
      row.forEach(function (d) { d.el.style.width = Math.floor(d.adj / total * (W - row.length * d.nonContent)) + 'px'; });
    }
  }
  function sizeGrid(grid) {
    var max = parseInt((grid.getAttribute('data-grid-max-images') || '').trim(), 10);
    var data = gridData(grid);
    if (max) sizeMax(grid, data, max); else sizeFree(grid, data);
    grid.classList.add('grid--ready');
  }
  var grids = $$('.js-grid-main');
  /* Photos only get their full list of sizes once their on-screen width is known, so the
     browser downloads the size that fits instead of the 4K version for every thumbnail. */
  function fitImages() {
    $$('img[data-srcset]').forEach(function (img) {
      var w = img.clientWidth || (img.parentNode && img.parentNode.clientWidth) || 600;
      img.sizes = Math.ceil(w) + 'px';
      if (!img.getAttribute('srcset')) {
        img.srcset = img.getAttribute('data-srcset');
        img.src = img.getAttribute('data-src');
      }
    });
  }
  function sizeAll() { grids.forEach(sizeGrid); fitImages(); }
  sizeAll();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(sizeAll, 100); });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(sizeAll);

  /* ---------- home page arrow scrolls past the hero ---------- */
  $$('.masthead-arrow-container').forEach(function (a) {
    a.addEventListener('click', function () { window.scrollTo({ top: window.innerHeight, behavior: 'smooth' }); });
  });
  $$('.js-back-to-top').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  });

  /* ---------- hero video: pick the right size for the screen ---------- */
  /* The poster frame shows straight away. The video stays hidden until enough of it has
     downloaded to play without stopping, then fades in. Slow connections get the 720p file. */
  $$('video[data-responsive-video]').forEach(function (v) {
    var sources = $$('source', v), pick = null;
    var conn = navigator.connection || {};
    var slow = conn.saveData || /(^|-)(2g|3g)$/.test(conn.effectiveType || '');
    sources.forEach(function (s) {
      if (pick) return;
      if (slow && s.src.indexOf('720') > -1) { pick = s; return; }
      if (!s.media || window.matchMedia(s.media).matches) pick = s;
    });
    if (!pick) return;
    var poster = v.getAttribute('poster');
    var wrap = v.parentNode;
    if (poster && wrap) { wrap.style.background = '#000 url(' + poster + ') center / cover no-repeat'; }
    v.style.opacity = '0';
    v.style.transition = 'opacity .6s ease';
    var shown = false;
    function reveal() { if (shown) return; shown = true; v.style.opacity = '1'; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    v.addEventListener('canplaythrough', reveal);
    setTimeout(function () { if (v.readyState >= 3) reveal(); }, 4000);
    v.muted = true;
    v.src = pick.src;
    v.load();
  });

  /* ---------- lightbox ---------- */
  var slides = [];
  $$('.js-lightbox').forEach(function (el) {
    var img = el.querySelector('img');
    var src = img ? (img.currentSrc || img.getAttribute('src')) : el.getAttribute('data-src');
    /* lightbox: the smallest version that still fills this screen */
    var set = img && (img.getAttribute('data-srcset') || img.getAttribute('srcset'));
    var full = src;
    if (set) {
      var need = window.innerWidth * (window.devicePixelRatio || 1);
      var opts = set.split(',').map(function (s) { var p = s.trim().split(' '); return { u: p[0], w: parseInt(p[1], 10) || 0 }; })
        .filter(function (o) { return o.u; }).sort(function (a, b) { return a.w - b.w; });
      full = opts[opts.length - 1].u;
      for (var k = 0; k < opts.length; k++) { if (opts[k].w >= need) { full = opts[k].u; break; } }
    }
    el.classList.add('lightbox-link');
    slides.push({ el: el, src: full || src });
  });
  $$('.js-grid-item-container').forEach(function (el) {
    var tpl = el.querySelector('.js-lightbox-slide-content');
    var m = tpl && tpl.innerHTML.match(/<img[^>]+src="([^"]+)"/);
    if (!m) return;
    var cap = el.querySelector('.grid__caption-text');
    el.classList.add('lightbox-link', 'hoverable');
    slides.push({ el: el, src: m[1], caption: cap ? cap.textContent : '' });
  });
  slides.sort(function (a, b) { return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });

  var box, current = -1;
  var arrow = function (dir) {
    var d = dir === 'next' ? 'M26 20l12 10-12 10' : 'M34 20L22 30l12 10';
    return '<svg width="60" height="60" viewBox="0 0 60 60"><circle class="lightbox-icon-bg" cx="30" cy="30" r="30"/><path class="lightbox-icon-arrow" d="' + d + '" fill="none" stroke="#fff" stroke-width="3"/></svg>';
  };
  function build() {
    box = doc.createElement('div');
    box.id = 'lightbox-wrap';
    box.className = 'offscreen';
    box.innerHTML = '<div id="lightbox-inner-wrap">' +
      '<div class="control prev">' + arrow('prev') + '</div>' +
      '<div class="control next">' + arrow('next') + '</div>' +
      '<div class="control close"><svg width="40" height="40" viewBox="0 0 40 40"><circle class="lightbox-icon-bg" cx="20" cy="20" r="20"/><path d="M14 14l12 12M26 14L14 26" stroke="#696969" stroke-width="2"/></svg></div>' +
      '<div class="lightbox-content"><img alt=""></div>' +
      '<div class="lightbox-caption grid__image-caption-lightbox"><p class="grid__caption-text"></p></div></div>';
    body.appendChild(box);
    box.querySelector('.prev').addEventListener('click', function () { show(current - 1); });
    box.querySelector('.next').addEventListener('click', function () { show(current + 1); });
    box.querySelector('.close').addEventListener('click', close);
    box.querySelector('.lightbox-content').addEventListener('click', function (e) { if (e.target.tagName !== 'IMG') close(); });
  }
  function show(i) {
    if (!slides.length) return;
    if (!box) build();
    current = (i + slides.length) % slides.length;
    var s = slides[current];
    box.querySelector('.lightbox-content img').src = s.src;
    var cap = box.querySelector('.lightbox-caption');
    cap.style.display = s.caption ? '' : 'none';
    cap.querySelector('p').textContent = s.caption || '';
    box.classList.toggle('single', slides.length < 2);
    box.classList.remove('offscreen');
    html.classList.add('lightbox-enabled');
  }
  function close() {
    if (!box) return;
    box.classList.add('offscreen');
    html.classList.remove('lightbox-enabled');
    current = -1;
  }
  slides.forEach(function (s, i) { s.el.addEventListener('click', function (e) { e.preventDefault(); show(slides.indexOf(s)); }); });
  doc.addEventListener('keydown', function (e) {
    if (current < 0) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(current + 1);
    else if (e.key === 'ArrowLeft') show(current - 1);
  });

  /* ---------- contact + submissions forms ---------- */
  $$('.js-project-module-form').forEach(function (mod) {
    var form = mod.querySelector('form'), btn = mod.querySelector('.js-submit');
    if (!form || !btn) return;
    function submit() {
      var ok = true;
      $$('.form-input', form).forEach(function (wrap) {
        var f = wrap.querySelector('input,textarea'); if (!f) return;
        var rules = f.getAttribute('data-validate') || '', v = f.value.trim(), err = '';
        if (/required/.test(rules) && !v) err = 'This field is required';
        else if (/Email/.test(rules) && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) err = 'This field must be a valid email address';
        wrap.classList.toggle('error', !!err);
        var old = wrap.querySelector('.form-error'); if (old) old.remove();
        if (err) { ok = false; var p = doc.createElement('div'); p.className = 'form-error'; p.textContent = err; wrap.appendChild(p); }
      });
      if (!ok) return;
      var data = {};
      $$('.form-input', form).forEach(function (wrap) {
        var label = wrap.querySelector('label'), f = wrap.querySelector('input,textarea');
        if (f) data[(label ? label.textContent : f.name).replace(/\s*\*$/, '').trim()] = f.value.trim();
      });
      data._page = doc.title;
      var done = function () { form.style.display = 'none'; var s = mod.querySelector('.contact-form-sent'); if (s) s.style.display = 'block'; };
      if (FORM_ENDPOINT) {
        btn.classList.add('processing');
        fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw r; done(); })
          .catch(function () { alert('Sorry, that did not send. Please email ' + CONTACT_EMAIL); })
          .then(function () { btn.classList.remove('processing'); });
      } else {
        var lines = Object.keys(data).map(function (k) { return k + ': ' + data[k]; }).join('\n');
        location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Website enquiry') + '&body=' + encodeURIComponent(lines);
        done();
      }
    }
    btn.addEventListener('click', submit);
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
  });
})();
