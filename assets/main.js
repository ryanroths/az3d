// AZ3D — site JS (no deps)
(function () {
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  var form = document.getElementById('quote-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  var endpoint = form.getAttribute('data-endpoint') || '';
  var TO = 'hello@az3d.net';

  function show(msg, ok) {
    status.hidden = false;
    status.textContent = msg;
    status.classList.toggle('ok', !!ok);
  }

  function fields() {
    var fd = new FormData(form), out = {};
    fd.forEach(function (v, k) { if (k !== '_gotcha') out[k] = v; });
    return out;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    if (form._gotcha && form._gotcha.value) return; // honeypot

    var f = fields();
    f._subject = 'AZ3D Custom order - ' + f.name;

    // No backend configured → open mail client with everything pre-filled.
    if (!endpoint) {
      var body = Object.keys(f).map(function (k) { return k + ': ' + f[k]; }).join('\n');
      var href = 'mailto:' + TO + '?subject=' + encodeURIComponent('Quote request — ' + f.name) +
                 '&body=' + encodeURIComponent(body);
      window.location.href = href;
      show('Opening your email app. If nothing happens, email ' + TO + ' directly.', true);
      return;
    }

    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Sending…';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(f)
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      form.reset();
      show('Got it! We\'ll reply within 24 hours to ' + f.email + '.', true);
    }).catch(function () {
      show('Something broke. Email ' + TO + ' instead — sorry.', false);
    }).finally(function () {
      btn.disabled = false; btn.textContent = 'Send my request';
    });
  });
})();
