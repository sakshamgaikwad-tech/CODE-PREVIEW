/* ═══════════════════════════════════════════
   CODE-PREVIEW — Frontend Logic
   ═══════════════════════════════════════════ */

const API_BASE = 'http://localhost:8000';

// ─── DOM refs ───────────────────────────────
const codeInput       = document.getElementById('code-input');
const langSelect      = document.getElementById('lang-select');
const contextInput    = document.getElementById('context-input');
const charCount       = document.getElementById('char-count');
const reviewBtn       = document.getElementById('review-btn');
const clearBtn        = document.getElementById('clear-btn');
const lineNumbers     = document.getElementById('line-numbers');

const loadingSection  = document.getElementById('loading-section');
const resultsSection  = document.getElementById('results-section');
const errorSection    = document.getElementById('error-section');
const errorText       = document.getElementById('error-text');

// ─── Line numbers ────────────────────────────
function updateLineNumbers() {
  const lines = codeInput.value.split('\n').length;
  lineNumbers.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
}

// ─── Char counter ────────────────────────────
function updateCharCount() {
  const len = codeInput.value.length;
  charCount.textContent = `${len.toLocaleString()} / 50 000 chars`;
  charCount.style.color = len > 45000 ? '#ef4444' : len > 35000 ? '#f59e0b' : '';
}

let autoReviewTimer;
const AUTO_REVIEW_DELAY = 1500; // 1.5 seconds

codeInput.addEventListener('input', () => {
  updateLineNumbers();
  updateCharCount();
  
  // Auto-review feature
  if (document.getElementById('auto-review-toggle')?.checked) {
    clearTimeout(autoReviewTimer);
    autoReviewTimer = setTimeout(() => {
      if (codeInput.value.trim().length > 10) { // minimum threshold
        submitReview();
      }
    }, AUTO_REVIEW_DELAY);
  }
});

// Sync scroll between line numbers and editor
codeInput.addEventListener('scroll', () => {
  lineNumbers.scrollTop = codeInput.scrollTop;
});

// Tab key support
codeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = codeInput.selectionStart;
    const end   = codeInput.selectionEnd;
    codeInput.value = codeInput.value.substring(0, start) + '  ' + codeInput.value.substring(end);
    codeInput.selectionStart = codeInput.selectionEnd = start + 2;
    updateLineNumbers();
  }
});

// Ctrl/Cmd + Enter to submit
codeInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submitReview();
});

// Clear
clearBtn.addEventListener('click', () => {
  codeInput.value = '';
  contextInput.value = '';
  updateLineNumbers();
  updateCharCount();
  resetUI();
});

// Init
updateLineNumbers();
updateCharCount();

// ─── UI state helpers ────────────────────────
function showSection(id) {
  ['loading-section', 'results-section', 'error-section'].forEach(s => {
    document.getElementById(s).classList.add('hidden');
  });
  if (id) document.getElementById(id).classList.remove('hidden');
}

function resetUI() {
  showSection(null);
  reviewBtn.disabled = false;
}

// ─── Score ring ──────────────────────────────
function animateScore(score) {
  const circle = document.getElementById('score-circle');
  const numberEl = document.getElementById('score-number');
  const circumference = 314; // 2π × 50

  // Color based on score
  let color = '#ef4444';
  if (score >= 90) color = '#10b981';
  else if (score >= 70) color = '#06b6d4';
  else if (score >= 50) color = '#f59e0b';

  circle.style.stroke = color;
  const offset = circumference - (score / 100) * circumference;
  circle.style.strokeDashoffset = offset;

  // Animate number
  let current = 0;
  const step = score / 60;
  const timer = setInterval(() => {
    current = Math.min(current + step, score);
    numberEl.textContent = Math.round(current);
    if (current >= score) clearInterval(timer);
  }, 16);
}

// ─── Render helpers ─────────────────────────
function severityClass(sev) {
  const map = { low: 'sev-low', medium: 'sev-medium', high: 'sev-high', critical: 'sev-critical' };
  return map[sev] || 'sev-medium';
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBugs(bugs) {
  const container = document.getElementById('bugs-list');
  const section   = document.getElementById('bugs-section');

  if (!bugs || bugs.length === 0) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');

  container.innerHTML = bugs.map(bug => `
    <div class="bug-item">
      <div class="bug-header">
        <span class="bug-title">${escapeHtml(bug.title)}</span>
        <span class="severity-badge ${severityClass(bug.severity)}">${bug.severity}</span>
      </div>
      <p class="bug-desc">${escapeHtml(bug.description)}</p>
      ${bug.line_reference ? `<p class="bug-line">📍 ${escapeHtml(bug.line_reference)}</p>` : ''}
      ${bug.fix ? `<pre class="bug-fix">${escapeHtml(bug.fix)}</pre>` : ''}
    </div>
  `).join('');
}

function renderSuggestions(suggestions) {
  const container = document.getElementById('suggestions-list');
  const section   = document.getElementById('suggestions-section');

  if (!suggestions || suggestions.length === 0) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');

  container.innerHTML = suggestions.map(s => `
    <div class="suggestion-item">
      <div class="suggestion-header">
        <span class="suggestion-title">${escapeHtml(s.title)}</span>
        <span class="cat-badge">${escapeHtml(s.category)}</span>
      </div>
      <p class="suggestion-desc">${escapeHtml(s.description)}</p>
      ${s.example ? `<pre class="suggestion-example">${escapeHtml(s.example)}</pre>` : ''}
    </div>
  `).join('');
}

function renderPositives(positives) {
  const list    = document.getElementById('positives-list');
  const section = document.getElementById('positives-section');

  if (!positives || positives.length === 0) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');
  list.innerHTML = positives.map(p => `<li>${escapeHtml(p)}</li>`).join('');
}

function renderResults(data) {
  // score
  animateScore(data.score ?? 0);

  // meta
  document.getElementById('lang-badge').textContent = data.language_detected ?? '—';
  document.getElementById('time-badge').textContent =
    data.review_time_ms != null ? `${data.review_time_ms} ms` : '—';

  // summary
  document.getElementById('summary-text').textContent = data.summary ?? '—';

  // sections
  renderPositives(data.positive_aspects);
  renderBugs(data.bugs);
  renderSuggestions(data.suggestions);

  showSection('results-section');

  // smooth scroll down to results
  setTimeout(() => {
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ─── Main submit ─────────────────────────────
async function submitReview() {
  const code = codeInput.value.trim();
  if (!code) {
    codeInput.focus();
    codeInput.classList.add('shake');
    setTimeout(() => codeInput.classList.remove('shake'), 500);
    return;
  }

  reviewBtn.disabled = true;
  showSection('loading-section');

  try {
    const payload = {
      code,
      language: langSelect.value,
      context: contextInput.value.trim() || null,
    };

    const res = await fetch(`${API_BASE}/api/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }

    const data = await res.json();
    renderResults(data);
  } catch (err) {
    console.error(err);
    errorText.textContent = err.message || 'Could not reach the API. Is the backend running?';
    showSection('error-section');
    reviewBtn.disabled = false;
  }
}

// ─── Shake anim (inline) ─────────────────────
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
@keyframes shake {
  0%,100%{ transform:translateX(0) }
  20%{ transform:translateX(-6px) }
  40%{ transform:translateX(6px) }
  60%{ transform:translateX(-4px) }
  80%{ transform:translateX(4px) }
}
.shake { animation: shake 0.4s ease; }
`;
document.head.appendChild(shakeStyle);

// ─── Background particle canvas ──────────────
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  const COLORS = ['#6366f1', '#818cf8', '#06b6d4', '#10b981'];

  function createParticles(n) {
    return Array.from({ length: n }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      r:  Math.random() * 1.2 + 0.3,
      dx: (Math.random() - 0.5) * 0.25,
      dy: (Math.random() - 0.5) * 0.25,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.2,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    }
    requestAnimationFrame(draw);
  }

  resize();
  particles = createParticles(120);
  window.addEventListener('resize', () => { resize(); particles = createParticles(120); });
  draw();
})();
