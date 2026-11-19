/* OZ Lead — interactions (sans dépendance) */
(function () {
  'use strict';

  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/direction@ozvizion.fr';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Pop-up de contact ---------- */
  var modal = document.getElementById('contact-modal');
  var lastFocus = null;

  function openModal(e) {
    if (!modal) return;
    if (e) e.preventDefault();
    lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    var box = modal.querySelector('.modal__box');
    box.scrollTop = 0;
    setTimeout(function () { box.focus({ preventScroll: true }); }, 30);
  }
  function closeModal() {
    if (!modal || !modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  document.querySelectorAll('[data-open]').forEach(function (el) {
    el.addEventListener('click', openModal);
  });
  if (modal) {
    modal.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Tab' && modal.classList.contains('open')) {
        var f = modal.querySelectorAll('a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"])');
        f = Array.prototype.filter.call(f, function (x) { return x.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- Formulaire « Être rappelé » ---------- */
  function cleanPhone(v) { return v.replace(/[^\d+]/g, ''); }
  function validPhone(v) {
    var d = cleanPhone(v);
    return /^0[1-9]\d{8}$/.test(d) || /^\+\d{10,15}$/.test(d) || /^00\d{10,15}$/.test(d);
  }

  document.querySelectorAll('.callback-form').forEach(function (form) {
    var err = form.querySelector('.form-err');
    var success = form.parentNode.querySelector('.success');
    var btn = form.querySelector('button[type="submit"]');
    var src = form.querySelector('input[name="source"]');
    if (src) src.value = location.href;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.textContent = '';
      var prenom = form.elements.prenom, tel = form.elements.whatsapp;
      prenom.removeAttribute('aria-invalid'); tel.removeAttribute('aria-invalid');

      if (form.elements._honey && form.elements._honey.value) return; // robot
      if (!prenom.value.trim()) {
        prenom.setAttribute('aria-invalid', 'true'); prenom.focus();
        err.textContent = 'Indiquez votre prénom.'; return;
      }
      if (!validPhone(tel.value)) {
        tel.setAttribute('aria-invalid', 'true'); tel.focus();
        err.textContent = 'Ce numéro ne semble pas valide. Exemple : 06 12 34 56 78'; return;
      }

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      btn.disabled = true;
      var label = btn.innerHTML;
      btn.textContent = 'Envoi…';

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.style.display = 'none';
        if (success) success.classList.add('show');
      }).catch(function () {
        btn.disabled = false; btn.innerHTML = label;
        err.innerHTML = 'L’envoi n’a pas abouti. Écrivez-nous directement sur WhatsApp, c’est encore plus rapide.';
      });
    });
  });

  /* ---------- Téléphone du hero : notifications une par une, en boucle ---------- */
  var notifs = document.querySelectorAll('.notif');
  if (notifs.length) {
    if (reduced) {
      notifs.forEach(function (n) { n.classList.add('show'); });
    } else {
      var i = 0;
      var step = function () {
        if (i < notifs.length) {
          notifs[i].classList.add('show'); i++;
          setTimeout(step, 1300);
        } else {
          setTimeout(function () {
            notifs.forEach(function (n) { n.classList.remove('show'); });
            i = 0; setTimeout(step, 700);
          }, 3200);
        }
      };
      setTimeout(step, 600);
    }
  }

  /* ---------- Apparition au scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Compteurs : de 0 (ou data-from) à la valeur, une fois visibles ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    var from = parseFloat(el.getAttribute('data-from') || '0');
    if (reduced) { el.textContent = to; return; }
    var t0 = null, dur = 1400;
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(frame);
    }
    el.textContent = from;
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ---------- Frise qui se remplit au scroll ---------- */
  var stepsWrap = document.querySelector('[data-steps]');
  if (stepsWrap) {
    var fill = stepsWrap.querySelector('.steps__fill');
    var rail = stepsWrap.querySelector('.steps__rail');
    var items = stepsWrap.querySelectorAll('.step');
    var ticking = false;
    var update = function () {
      ticking = false;
      var r = rail.getBoundingClientRect();
      var mid = window.innerHeight * 0.6;
      var p = reduced ? 1 : Math.max(0, Math.min(1, (mid - r.top) / r.height));
      fill.style.height = (p * 100) + '%';
      items.forEach(function (it) {
        var n = it.querySelector('.step__num').getBoundingClientRect();
        it.classList.toggle('is-on', reduced || n.top + n.height / 2 < mid);
      });
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Barre mobile collante : visible après le hero ---------- */
  var mbar = document.querySelector('.mbar');
  var hero = document.querySelector('.hero');
  if (mbar) {
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        mbar.classList.toggle('show', !entries[0].isIntersecting);
      }, { threshold: 0 }).observe(hero);
    } else {
      mbar.classList.add('show');
    }
  }

  /* ---------- Images manquantes : on garde un fond propre ---------- */
  document.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
  });
})();
