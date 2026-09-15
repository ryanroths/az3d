// AZ3D Custom — site JS (no deps)
(function () {
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  var form = document.getElementById('quote-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  var endpoint = form.getAttribute('data-endpoint') || '';
  var UPLOAD = '/api/upload';
  var TO = 'hello@az3d.net';

  function show(msg, ok) {
    status.hidden = false;
    status.textContent = msg;
    status.classList.toggle('ok', !!ok);
  }

  // --- file drop UI ---
  var drop = document.getElementById('drop'), fileIn = document.getElementById('file'), dropText = document.getElementById('drop-text');
  if (drop && fileIn) {
    var fmt = function (n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB'; };
    fileIn.addEventListener('change', function () {
      var f = fileIn.files[0];
      if (f) { drop.classList.add('has'); dropText.textContent = f.name + ' (' + fmt(f.size) + ')'; }
      else { drop.classList.remove('has'); dropText.innerHTML = 'Drag a file here or <u>choose one</u>'; }
    });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('over'); }); });
  }

  function fields() {
    var fd = new FormData(form), out = {};
    fd.forEach(function (v, k) { if (k !== '_gotcha' && !(v instanceof File)) out[k] = v; });
    return out;
  }

  function uploadFile(f, onProgress) {
    return new Promise(function (resolve, reject) {
      var fd = new FormData(); fd.append('file', f);
      var x = new XMLHttpRequest();
      x.open('POST', UPLOAD);
      x.upload.onprogress = function (e) { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
      x.onload = function () {
        var r = {}; try { r = JSON.parse(x.responseText); } catch (e) {}
        if (x.status >= 200 && x.status < 300 && r.ok) resolve(r); else reject(new Error(r.error || ('Upload failed (' + x.status + ')')));
      };
      x.onerror = function () { reject(new Error('Upload failed — network')); };
      x.send(fd);
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    if (form._gotcha && form._gotcha.value) return; // honeypot

    var f = fields();
    f._subject = 'AZ3D Custom order - ' + f.name;
    var btn = form.querySelector('button[type=submit]');
    var origLabel = btn.textContent;
    btn.disabled = true;

    var file = fileIn && fileIn.files[0];
    var step = file
      ? uploadFile(file, function (p) { btn.textContent = 'Uploading ' + Math.round(p * 100) + '%'; })
          .then(function (r) { f.file_name = r.name; f.file_size = r.size; f.file_download = r.download; })
      : Promise.resolve();

    step.then(function () {
      // No backend configured → mailto fallback
      if (!endpoint) {
        var body = Object.keys(f).map(function (k) { return k + ': ' + f[k]; }).join('\n');
        window.location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent('Order request - ' + f.name) + '&body=' + encodeURIComponent(body);
        show('Opening your email app. If nothing happens, email ' + TO + ' directly.', true);
        return;
      }
      btn.textContent = 'Sending…';
      return fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(f)
      }).then(function (r) {
        if (!r.ok) throw new Error('Send failed (' + r.status + ')');
        form.reset();
        if (fileIn) fileIn.dispatchEvent(new Event('change'));
        show('Got it! We\'ll reply within 24 hours to ' + f.email + '.', true);
      });
    }).catch(function (err) {
      show((err && err.message ? err.message + '. ' : '') + 'Email ' + TO + ' instead — sorry.', false);
    }).finally(function () {
      btn.disabled = false; btn.textContent = origLabel;
    });
  });
})();

// --- header menu, lightbox, sticky CTA ---
(function () {
  var burger = document.getElementById('burger'), header = document.querySelector('header');
  if (burger && header) {
    burger.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    header.querySelectorAll('nav a').forEach(function (a) { a.addEventListener('click', function () { header.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });
  }

  var lb = document.getElementById('lightbox');
  if (lb) {
    var figs = Array.prototype.slice.call(document.querySelectorAll('.gallery figure')), i = 0;
    var img = document.getElementById('lb-img'), cap = document.getElementById('lb-cap');
    function showAt(n) {
      i = (n + figs.length) % figs.length;
      var src = figs[i].querySelector('img'), c = figs[i].querySelector('figcaption');
      img.src = src.src; img.alt = src.alt; cap.textContent = c ? c.textContent : '';
      lb.hidden = false; document.body.style.overflow = 'hidden';
    }
    function close() { lb.hidden = true; document.body.style.overflow = ''; }
    figs.forEach(function (f, n) { f.addEventListener('click', function () { showAt(n); }); });
    document.getElementById('lb-close').addEventListener('click', close);
    document.getElementById('lb-prev').addEventListener('click', function (e) { e.stopPropagation(); showAt(i - 1); });
    document.getElementById('lb-next').addEventListener('click', function (e) { e.stopPropagation(); showAt(i + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') showAt(i - 1); else if (e.key === 'ArrowRight') showAt(i + 1);
    });
    var sx = 0;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) showAt(dx < 0 ? i + 1 : i - 1); }, { passive: true });
  }

  var sticky = document.getElementById('sticky-cta');
  if (sticky) {
    document.body.classList.add('has-sticky');
    var hero = document.querySelector('.hero');
    var threshold = hero ? hero.offsetHeight : 300;
    var onScroll = function () { sticky.classList.toggle('show', window.scrollY > threshold); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
})();
