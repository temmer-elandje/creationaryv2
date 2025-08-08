// Lego Creationary-like word generator v2
// - Supports images (per-word image path)
// - Quick difficulty pick buttons (Makkelijk / Normaal / Moeilijk)
// - Difficulty filter still available
// - Stores state in localStorage

const DEFAULT_TIMER = 0;

const els = {
  category: document.getElementById('category'),
  difficulty: document.getElementById('difficulty'),
  timerSelect: document.getElementById('timerSelect'),
  btnStartTimer: document.getElementById('btnStartTimer'),
  btnPauseTimer: document.getElementById('btnPauseTimer'),
  btnResetTimer: document.getElementById('btnResetTimer'),
  timeDisplay: document.getElementById('timeDisplay'),
  btnNewWord: document.getElementById('btnNewWord'),
  btnReveal: document.getElementById('btnReveal'),
  btnSkip: document.getElementById('btnSkip'),
  wordPanel: document.getElementById('wordPanel'),
  wordText: document.getElementById('wordText'),
  hintText: document.getElementById('hintText'),
  meta: document.getElementById('meta'),
  usedList: document.getElementById('usedList'),
  btnResetCycle: document.getElementById('btnResetCycle'),
  settingsDialog: document.getElementById('settingsDialog'),
  btnSettings: document.getElementById('btnSettings'),
  categoryList: document.getElementById('categoryList'),
  customCatName: document.getElementById('customCatName'),
  customWords: document.getElementById('customWords'),
  btnSaveCustom: document.getElementById('btnSaveCustom'),
  btnClearCustom: document.getElementById('btnClearCustom'),
  customDifficulty: document.getElementById('customDifficulty'),
  beep: document.getElementById('beep'),
  toggleImages: document.getElementById('toggleImages'),
  imageWrap: document.getElementById('imageWrap'),
  wordImage: document.getElementById('wordImage'),
  imgCaption: document.getElementById('imgCaption'),
};

let db = {
  categories: {},
  activeCategories: new Set(),
  used: [],
  hidden: true,
  showImages: true,
};

let timer = {
  seconds: DEFAULT_TIMER,
  remaining: 0,
  id: null,
  running: false,
};

function loadDefaultWords() {
  return fetch('words.json')
    .then(res => res.json())
    .then(data => data);
}

function saveState() {
  const state = {
    activeCategories: Array.from(db.activeCategories),
    used: db.used,
    lastCategory: els.category.value,
    lastDifficulty: els.difficulty.value,
    timer: els.timerSelect.value,
    customCategory: JSON.parse(localStorage.getItem('customCategory') || 'null'),
    showImages: db.showImages
  };
  localStorage.setItem('legoGameState', JSON.stringify(state));
}

function restoreState() {
  const state = JSON.parse(localStorage.getItem('legoGameState') || 'null');
  if (!state) return;
  db.used = state.used || [];
  els.difficulty.value = state.lastDifficulty || 'alle';
  els.timerSelect.value = state.timer || String(DEFAULT_TIMER);
  db.showImages = state.showImages !== false;
  els.toggleImages.checked = db.showImages;
  setTimeout(() => {
    if (state.lastCategory) els.category.value = state.lastCategory;
  }, 0);
}

function renderCategoriesDropdown() {
  const opts = [];
  Object.keys(db.categories).forEach(cat => {
    const o = document.createElement('option');
    o.value = cat;
    o.textContent = cat;
    opts.push(o);
  });
  els.category.replaceChildren(...opts);
}

function renderSettingsCategories() {
  const wrap = document.createElement('div');
  Object.keys(db.categories).forEach(cat => {
    const id = `cat_${cat.replace(/\s+/g, '_')}`;
    const row = document.createElement('label');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '8px';
    row.style.margin = '6px 0';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = id;
    cb.checked = db.activeCategories.has(cat);
    cb.addEventListener('change', () => {
      if (cb.checked) db.activeCategories.add(cat);
      else db.activeCategories.delete(cat);
      saveState();
    });

    const span = document.createElement('span');
    span.textContent = cat;

    row.appendChild(cb);
    row.appendChild(span);
    wrap.appendChild(row);
  });
  els.categoryList.replaceChildren(wrap);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getPool({overrideDifficulty=null}={}) {
  const chosenCat = els.category.value;
  const active = db.activeCategories.size ? Array.from(db.activeCategories) : [chosenCat];
  let pool = [];
  active.forEach(cat => {
    const words = db.categories[cat] || [];
    pool.push(...words);
  });

  // Difficulty filter
  const diff = overrideDifficulty || els.difficulty.value;
  if (diff !== 'alle') {
    pool = pool.filter(w => (w.difficulty || 'normaal') === diff);
  }

  // Remove used (by unique key cat|word)
  const usedSet = new Set(db.used.map(u => u.key));
  pool = pool.filter(w => !usedSet.has(w.key));
  return pool;
}

function pickWord(opts={}) {
  let pool = getPool(opts);
  if (pool.length === 0) {
    // Reset cycle automatically
    db.used = [];
    pool = getPool(opts);
  }
  if (pool.length === 0) return null;
  const choice = pool[Math.floor(Math.random() * pool.length)];
  return choice;
}

function revealToggle() {
  db.hidden = !db.hidden;
  els.wordPanel.classList.toggle('hidden', db.hidden);
  els.btnReveal.textContent = db.hidden ? '👁 Toon' : '🙈 Verberg';
}

function updateUsedChips() {
  const chips = db.used.slice(-20).map(u => {
    const d = document.createElement('div');
    d.className = 'chip';
    d.textContent = u.word;
    return d;
  });
  els.usedList.replaceChildren(...chips);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m)}:${String(s).padStart(2,'0')}`;
}

function startTimer() {
  const val = parseInt(els.timerSelect.value, 10);
  if (!val) return;
  timer.seconds = val;
  if (!timer.running) {
    if (!timer.remaining) timer.remaining = val;
    els.timeDisplay.textContent = formatTime(timer.remaining);
    timer.id = setInterval(() => {
      if (timer.remaining > 0) {
        timer.remaining--;
        els.timeDisplay.textContent = formatTime(timer.remaining);
        if (timer.remaining === 0) {
          els.beep.currentTime = 0;
          els.beep.play().catch(()=>{});
          clearInterval(timer.id);
          timer.running = false;
        }
      }
    }, 1000);
    timer.running = true;
  }
}

function pauseTimer() { if (timer.running) { clearInterval(timer.id); timer.running = false; } }
function resetTimer() {
  pauseTimer();
  timer.remaining = parseInt(els.timerSelect.value, 10) || 0;
  els.timeDisplay.textContent = timer.remaining ? formatTime(timer.remaining) : '—:—';
}

function showWord(w) {
  els.wordText.textContent = w.word;
  els.hintText.textContent = w.hint ? `Tip: ${w.hint}` : '';
  els.meta.textContent = `Categorie: ${w.category} · Moeilijkheid: ${w.difficulty || 'normaal'}`;

  if (db.showImages && w.image) {
    els.wordImage.src = w.image;
    els.wordImage.alt = w.word;
    els.imgCaption.textContent = w.caption || '';
    els.imageWrap.classList.remove('hidden');
  } else {
    els.wordImage.removeAttribute('src');
    els.imgCaption.textContent = '';
    els.imageWrap.classList.add('hidden');
  }
}

function newWord({skipCurrent=false, overrideDifficulty=null} = {}) {
  const w = pickWord({overrideDifficulty});
  if (!w) return;
  showWord(w);
  if (!skipCurrent) {
    db.used.push({ key: w.key, word: w.word, ts: Date.now() });
    updateUsedChips();
    saveState();
  }
  if (db.hidden) revealToggle();
}

function resetCycle() { db.used = []; updateUsedChips(); saveState(); }

function seedKeys() {
  Object.entries(db.categories).forEach(([cat, list]) => {
    list.forEach(w => {
      w.category = cat;
      w.key = `${cat}|${w.word}`;
    });
  });
}

function buildCategoriesUI() {
  renderCategoriesDropdown();
  if (db.activeCategories.size === 0) {
    Object.keys(db.categories).forEach(cat => db.activeCategories.add(cat));
  }
  renderSettingsCategories();
}

function loadCustomCategory() {
  const custom = JSON.parse(localStorage.getItem('customCategory') || 'null');
  if (!custom) return;
  db.categories[custom.name] = custom.words.map(w => ({
    word: w,
    difficulty: custom.difficulty || 'normaal',
    image: null,
  }));
}

function saveCustomCategory(name, words, difficulty) {
  const payload = { name, words, difficulty };
  localStorage.setItem('customCategory', JSON.stringify(payload));
  db.categories[name] = words.map(w => ({ word: w, difficulty, image: null }));
  seedKeys();
  buildCategoriesUI();
}

function clearCustomCategory() {
  localStorage.removeItem('customCategory');
  const state = JSON.parse(localStorage.getItem('legoGameState') || 'null');
  if (state && state.activeCategories) {
    const custom = Object.keys(db.categories).find(cat => !(cat in DEFAULTS));
    if (custom) {
      delete db.categories[custom];
      db.activeCategories.delete(custom);
    }
  }
  seedKeys();
  buildCategoriesUI();
}

const DEFAULTS = {}; // filled from words.json

// Event bindings
els.btnSettings.addEventListener('click', () => els.settingsDialog.showModal());
els.btnSaveCustom.addEventListener('click', (e) => {
  e.preventDefault();
  const name = (els.customCatName.value || '').trim();
  const words = (els.customWords.value || '').split('\n').map(s => s.trim()).filter(Boolean);
  const difficulty = els.customDifficulty.value || 'normaal';
  if (!name || words.length === 0) {
    alert('Geef een categorienaam én minstens één woord.');
    return;
  }
  saveCustomCategory(name, words, difficulty);
  els.customCatName.value = '';
  els.customWords.value = '';
  alert('Opgeslagen! Nieuwe categorie toegevoegd.');
});
els.btnClearCustom.addEventListener('click', (e) => {
  e.preventDefault();
  if (confirm('Eigen categorie verwijderen?')) {
    clearCustomCategory();
    alert('Eigen categorie verwijderd.');
  }
});

els.btnNewWord.addEventListener('click', () => newWord());
els.btnReveal.addEventListener('click', revealToggle);
els.btnSkip.addEventListener('click', () => newWord({skipCurrent:true}));

document.querySelectorAll('button.pill[data-diff]').forEach(btn => {
  btn.addEventListener('click', () => {
    const diff = btn.getAttribute('data-diff');
    newWord({overrideDifficulty: diff});
  });
});

els.btnStartTimer.addEventListener('click', startTimer);
els.btnPauseTimer.addEventListener('click', pauseTimer);
els.btnResetTimer.addEventListener('click', resetTimer);

els.btnResetCycle.addEventListener('click', () => {
  if (confirm('Alle gebruikte woorden vergeten en opnieuw beginnen?')) {
    resetCycle();
  }
});

els.category.addEventListener('change', saveState);
els.difficulty.addEventListener('change', saveState);
els.timerSelect.addEventListener('change', () => { resetTimer(); saveState(); });
els.toggleImages.addEventListener('change', () => { db.showImages = els.toggleImages.checked; saveState(); });

// Init
(async function init() {
  const defaults = await loadDefaultWords();
  Object.assign(DEFAULTS, defaults);
  db.categories = JSON.parse(JSON.stringify(DEFAULTS)); // clone
  loadCustomCategory();
  seedKeys();
  buildCategoriesUI();
  restoreState();
  resetTimer();
  updateUsedChips();

  // PWA install
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('service-worker.js'); } catch (e) {}
  }
})();
