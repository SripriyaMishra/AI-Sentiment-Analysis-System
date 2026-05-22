// ── Particles.js Configuration ────────────────────────────
function initParticles() {
  if (typeof particlesJS === 'undefined') return;
 
    particlesJS("particles-js", {
    particles: {

        number: {
            value: 100
        },

        color: {
            value: ["#38bdf8", "#60a5fa", "#a78bfa"]
        },

        shape: {
            type: "circle"
        },

        opacity: {
            value: 0.6,
            random: true
        },

        size: {
            value: 5,
            random: true
        },

        line_linked: {
            enable: false
        },

        move: {
            enable: true,
            speed: 2,
            random: true,
            out_mode: "out"
        }
    },

    retina_detect: true
});
}
 
// ── Typing Animation ──────────────────────────────────────
function initTypingAnimation() {
  const el = document.getElementById('typed-text');
  if (!el) return;
 
  const phrases = [
    'Analyze emotions from text.',
    'Detect positive sentiment.',
    'Identify negative reviews.',
    'Classify customer feedback.',
    'Power your NLP pipeline.'
  ];
 
  let phraseIndex = 0;
  let charIndex   = 0;
  let isDeleting  = false;
  let pauseMs     = 0;
 
  function type() {
    const current = phrases[phraseIndex];
 
    if (!isDeleting) {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex++;
      if (charIndex === current.length) {
        isDeleting = true;
        pauseMs = 2000;
      }
    } else {
      el.textContent = current.substring(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        isDeleting  = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        pauseMs     = 400;
      }
    }
 
    const speed = isDeleting ? 45 : 70;
    setTimeout(type, pauseMs > 0 ? (pauseMs = 0, pauseMs + (isDeleting ? 2000 : 400)) : speed);
  }
 
  // Restart properly
  (function restart() {
    const phrase = phrases[phraseIndex];
    if (!isDeleting) {
      el.textContent = phrase.substring(0, charIndex + 1);
      charIndex++;
      if (charIndex === phrase.length) { isDeleting = true; setTimeout(restart, 2000); return; }
      setTimeout(restart, 70);
    } else {
      el.textContent = phrase.substring(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        isDeleting  = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(restart, 400);
        return;
      }
      setTimeout(restart, 45);
    }
  })();
}
 
// ── Scroll Reveal ─────────────────────────────────────────
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
 
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
 
  items.forEach(el => observer.observe(el));
}
 
// ── Navbar scroll effect ──────────────────────────────────
function initNavbar() {
  const nav = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 20
      ? '0 4px 30px rgba(14,165,233,0.12)'
      : '0 2px 20px rgba(14,165,233,0.08)';
  }, { passive: true });
}
 
// ── Character Counter ─────────────────────────────────────
function initCharCounter() {
  const ta      = document.getElementById('text-input');
  const counter = document.getElementById('char-count');
  const MAX     = 5000;
 
  ta.addEventListener('input', () => {
    const len = ta.value.length;
    counter.textContent = `${len} / ${MAX}`;
    counter.className   = 'char-counter' +
      (len > MAX * 0.9 ? ' warn' : '') +
      (len > MAX       ? ' over' : '');
  });
}
 
// ── Smooth scroll for anchor links ────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}
 
// ── Animated counter (stats) ──────────────────────────────
function animateCounter(el, target, suffix = '') {
  let start   = 0;
  const end   = parseFloat(target);
  const dur   = 1600;
  const step  = 16;
  const inc   = end / (dur / step);
 
  const timer = setInterval(() => {
    start += inc;
    if (start >= end) { start = end; clearInterval(timer); }
    el.textContent = Number.isInteger(end)
      ? Math.floor(start).toLocaleString() + suffix
      : start.toFixed(1) + suffix;
  }, step);
}
 
function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el  = entry.target;
        const val = el.dataset.count;
        const sfx = el.dataset.suffix || '';
        animateCounter(el, val, sfx);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
 
  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
}
 
// ── Sentiment Analyzer ────────────────────────────────────
function initAnalyzer() {
  const form          = document.getElementById('analyzer-form');
  const textarea      = document.getElementById('text-input');
  const analyzeBtn    = document.getElementById('analyze-btn');
  const clearBtn      = document.getElementById('clear-btn');
  const loadingWrap   = document.getElementById('loading-wrapper');
  const resultWrap    = document.getElementById('result-wrapper');
  const errorBanner   = document.getElementById('error-banner');
  const errorMsg      = document.getElementById('error-msg');
  const wordCountEl   = document.getElementById('word-count-info');
 
  // Word count update
  textarea.addEventListener('input', () => {
    const words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
    wordCountEl.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  });
 
  // Clear button
  clearBtn.addEventListener('click', () => {
    textarea.value = '';
    wordCountEl.textContent = '0 words';
    document.getElementById('char-count').textContent = '0 / 5000';
    hideResult();
    hideError();
    textarea.focus();
  });
 
  // Form submit (analyze)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) { showError('Please enter some text to analyze.'); return; }
    if (text.length > 5000) { showError('Text exceeds 5,000 character limit.'); return; }
 
    hideResult();
    hideError();
    showLoading();
    analyzeBtn.disabled = true;
 
    try {
      const res  = await fetch('/predict', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text })
      });
 
      const data = await res.json();
 
      if (!res.ok) {
        showError(data.error || `Server error (${res.status}). Is the Flask server running?`);
        return;
      }
 
      displayResult(data);
 
    } catch (err) {
      showError('Could not connect to the server. Make sure Flask is running on port 5000.');
      console.error(err);
    } finally {
      hideLoading();
      analyzeBtn.disabled = false;
    }
  });
 
  /* ── helpers ── */
  function showLoading() {
    loadingWrap.classList.add('visible');
  }
 
  function hideLoading() {
    loadingWrap.classList.remove('visible');
  }
 
  function hideResult() {
    resultWrap.classList.remove('visible');
  }
 
  function hideError() {
    errorBanner.classList.remove('visible');
  }
 
  function showError(msg) {
    errorMsg.textContent = msg;
    errorBanner.classList.add('visible');
  }
 
  function displayResult(data) {
    // Populate DOM
    document.getElementById('result-emoji').textContent   = data.emoji;
    document.getElementById('result-label').textContent   = data.label;
    document.getElementById('result-message').textContent = data.message;
    document.getElementById('confidence-val').textContent = `${data.confidence}%`;
 
    // Apply sentiment colour class
    const card  = document.getElementById('result-card');
    const label = document.getElementById('result-label');
    const badge = document.getElementById('confidence-val');
    const fill  = document.getElementById('progress-fill');
    const pct   = document.getElementById('progress-pct');
 
    ['positive','negative','neutral'].forEach(c => {
      card.classList.remove(c);
      label.classList.remove(c);
      badge.classList.remove(c);
      fill.classList.remove(c);
    });
 
    card.classList.add(data.sentiment);
    label.classList.add(data.sentiment);
    badge.classList.add(data.sentiment);
    fill.classList.add(data.sentiment);
 
    pct.textContent = `${data.confidence}%`;
 
    // Animate progress bar
    requestAnimationFrame(() => {
      fill.style.width = '0%';
      requestAnimationFrame(() => {
        fill.style.width = `${data.confidence}%`;
      });
    });
 
    // Breakdown
    if (data.breakdown) {
      ['positive','negative','neutral'].forEach(key => {
        const el = document.getElementById(`bd-${key}`);
        if (el) el.textContent = `${data.breakdown[key] ?? 0}%`;
      });
    }
 
    // Show
    resultWrap.classList.add('visible');
    resultWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
 
// ── Sample text buttons ───────────────────────────────────
function initSamples() {
  document.querySelectorAll('[data-sample]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ta = document.getElementById('text-input');
      ta.value = btn.dataset.sample;
      ta.dispatchEvent(new Event('input'));
      document.getElementById('analyzer-section')
        .scrollIntoView({ behavior: 'smooth' });
    });
  });
}
 
// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initTypingAnimation();
  initScrollReveal();
  initNavbar();
  initCharCounter();
  initSmoothScroll();
  initCounters();
  initAnalyzer();
  initSamples();
});