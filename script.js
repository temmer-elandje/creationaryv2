// v3: Startscherm met niveaus (punten) -> opdrachtenscherm
// Behoudt afbeeldingen, timer, categorieën en custom woorden

const els = {
  // global
  btnSettings: document.getElementById('btnSettings'),
  settingsDialog: document.getElementById('settingsDialog'),
  categoryList: document.getElementById('categoryList'),
  toggleImages: document.getElementById('toggleImages'),
  customCatName: document.getElementById('customCatName'),
  customWords: document.getElementById('customWords'),
  btnSaveCustom: document.getElementById('btnSaveCustom'),
  btnClearCustom: document.getElementById('btnClearCustom'),
  customDifficulty: document.getElementById('customDifficulty'),
  beep: document.getElementById('beep'),

  // screens
  screenStart: document.getElementById('screenStart'),
  screenWord: document.getElementById('screenWord'),

  // start screen
  levels: document.querySelectorAll('#levels .level'),
  category: document.getElementById('category'),

  // word screen
  btnBack: document.getElementById('btnBack'),
  pointsTag: document.getElementById('pointsTag'),
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
  imageWrap: document.getElementById('imageWrap'),
  wordImage: document.getElementById('wordImage'),
  imgCaption: document.getElementById('imgCaption'),
};

let db = {
  categories: {},
  activeCategories: new Set(),
  used: [],
  showImages: true,
};

let round = {
  difficulty: 'normaal',
  points: 0,
};

let timer = { remaining: 0, id: null, running: false };

function loadDefaultWords() { return fetch('words.json').then(r=>r.json()); }
function saveState() {
  const state = {
    activeCategories: Array.from(db.activeCategories),
    used: db.used,
    lastCategory: els.category.value,
    showImages: db.showImages
  };
  localStorage.setItem('legoGameState_v3', JSON.stringify(state));
}
function restoreState() {
  const s = JSON.parse(localStorage.getItem('legoGameState_v3') || 'null');
  if (!s) return;
  db.used = s.used || [];
  db.showImages = s.showImages !== false;
  els.toggleImages.checked = db.showImages;
  setTimeout(() => { if (s.lastCategory) els.category.value = s.lastCategory; }, 0);
}

function renderCategoriesDropdown() {
  const opts = [];
  Object.keys(db.categories).forEach(cat => {
    const o = document.createElement('option');
    o.value = cat; o.textContent = cat;
    opts.push(o);
  });
  els.category.replaceChildren(...opts);
}
function renderSettingsCategories() {
  const wrap = document.createElement('div');
  Object.keys(db.categories).forEach(cat => {
    const id = `cat_${cat.replace(/\s+/g,'_')}`;
    const row = document.createElement('label');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '8px';
    row.style.margin = '6px 0';

    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.id = id; cb.checked = db.activeCategories.has(cat);
    cb.addEventListener('change', () => {
      if (cb.checked) db.activeCategories.add(cat); else db.activeCategories.delete(cat);
      saveState();
    });

    const span = document.createElement('span'); span.textContent = cat;
    row.appendChild(cb); row.appendChild(span); wrap.appendChild(row);
  });
  els.categoryList.replaceChildren(wrap);
}

function seedKeys() {
  Object.entries(db.categories).forEach(([cat, list]) => {
    list.forEach(w => { w.category = cat; w.key = `${cat}|${w.word}`; });
  });
}

function buildCategoriesUI() {
  renderCategoriesDropdown();
  if (db.activeCategories.size === 0) Object.keys(db.categories).forEach(cat => db.activeCategories.add(cat));
  renderSettingsCategories();
}

function loadCustomCategory() {
  const custom = JSON.parse(localStorage.getItem('customCategory') || 'null');
  if (!custom) return;
  db.categories[custom.name] = custom.words.map(w => ({ word: w, difficulty: custom.difficulty || 'normaal', image: null }));
}

function getPool(diff) {
  const chosenCat = els.category.value;
  const active = db.activeCategories.size ? Array.from(db.activeCategories) : [chosenCat];
  let pool = [];
  active.forEach(cat => { pool.push(...(db.categories[cat] || [])); });
  if (diff) pool = pool.filter(w => (w.difficulty || 'normaal') === diff);
  const usedSet = new Set(db.used.map(u => u.key));
  pool = pool.filter(w => !usedSet.has(w.key));
  return pool;
}

function pickWord(diff) {
  let pool = getPool(diff);
  if (pool.length === 0) { db.used = []; pool = getPool(diff); }
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function showWord(w) {
  els.wordText.textContent = w.word;
  els.hintText.textContent = w.hint ? `Tip: ${w.hint}` : '';
  els.meta.textContent = `Categorie: ${w.category} · Moeilijkheid: ${w.difficulty || 'normaal'}`;

  if (db.showImages && w.image) {
    els.wordImage.src = w.image; els.wordImage.alt = w.word;
    els.imgCaption.textContent = w.caption || '';
    els.imageWrap.classList.remove('hidden');
  } else {
    els.wordImage.removeAttribute('src'); els.imgCaption.textContent = '';
    els.imageWrap.classList.add('hidden');
  }
}

function goToWordScreen(diff, points) {
  round.difficulty = diff; round.points = points;
  els.pointsTag.textContent = `${points} ${points===1?'punt':'punten'}`;
  els.screenStart.classList.add('hidden');
  els.screenWord.classList.remove('hidden');

  const w = pickWord(diff);
  if (!w) return;
  showWord(w);
  db.used.push({ key: w.key, word: w.word, ts: Date.now() });
  updateUsedChips();
  saveState();
  // ensure visible
  els.wordPanel.classList.remove('hidden');
  els.btnReveal.textContent = '🙈 Verberg';
}

function updateUsedChips() {
  const chips = db.used.slice(-20).map(u => {
    const d = document.createElement('div'); d.className = 'chip'; d.textContent = u.word; return d;
  });
  els.usedList.replaceChildren(...chips);
}

// timer
function formatTime(sec){ const m=Math.floor(sec/60), s=sec%60; return `${String(m)}:${String(s).padStart(2,'0')}`; }
function startTimer() {
  const val = parseInt(els.timerSelect.value, 10); if (!val) return;
  if (!timer.running) {
    if (!timer.remaining) timer.remaining = val;
    els.timeDisplay.textContent = formatTime(timer.remaining);
    timer.id = setInterval(() => {
      if (timer.remaining > 0) {
        timer.remaining--;
        els.timeDisplay.textContent = formatTime(timer.remaining);
        if (timer.remaining === 0) {
          els.beep.currentTime = 0; els.beep.play().catch(()=>{});
          clearInterval(timer.id); timer.running = false;
        }
      }
    }, 1000); timer.running = true;
  }
}
function pauseTimer(){ if (timer.running) { clearInterval(timer.id); timer.running = false; } }
function resetTimer(){
  pauseTimer();
  timer.remaining = parseInt(els.timerSelect.value,10) || 0;
  els.timeDisplay.textContent = timer.remaining ? formatTime(timer.remaining) : '—:—';
}

// events
els.btnSettings.addEventListener('click', () => els.settingsDialog.showModal());
els.toggleImages.addEventListener('change', () => { db.showImages = els.toggleImages.checked; saveState(); });

els.btnSaveCustom.addEventListener('click', (e) => {
  e.preventDefault();
  const name = (els.customCatName.value || '').trim();
  const words = (els.customWords.value || '').split('\n').map(s=>s.trim()).filter(Boolean);
  const difficulty = els.customDifficulty.value || 'normaal';
  if (!name || words.length === 0) { alert('Geef een categorienaam én minstens één woord.'); return; }
  const payload = { name, words, difficulty };
  localStorage.setItem('customCategory', JSON.stringify(payload));
  db.categories[name] = words.map(w => ({ word: w, difficulty, image: null }));
  seedKeys(); buildCategoriesUI(); alert('Opgeslagen! Nieuwe categorie toegevoegd.');
  els.customCatName.value=''; els.customWords.value='';
});
els.btnClearCustom.addEventListener('click', (e) => {
  e.preventDefault();
  if (confirm('Eigen categorie verwijderen?')) {
    localStorage.removeItem('customCategory');
    const custom = Object.keys(db.categories).find(cat => !(cat in DEFAULTS));
    if (custom) { delete db.categories[custom]; db.activeCategories.delete(custom); }
    seedKeys(); buildCategoriesUI(); alert('Eigen categorie verwijderd.');
  }
});

els.levels.forEach(btn => {
  btn.addEventListener('click', () => {
    const diff = btn.getAttribute('data-diff');
    const pts = parseInt(btn.getAttribute('data-points'), 10);
    goToWordScreen(diff, pts);
  });
});

els.btnBack.addEventListener('click', () => {
  els.screenWord.classList.add('hidden');
  els.screenStart.classList.remove('hidden');
});

els.btnNewWord.addEventListener('click', () => {
  const w = pickWord(round.difficulty);
  if (!w) return;
  showWord(w);
  db.used.push({ key: w.key, word: w.word, ts: Date.now() });
  updateUsedChips();
  saveState();
});

els.btnReveal.addEventListener('click', () => {
  const hidden = els.wordPanel.classList.toggle('hidden');
  els.btnReveal.textContent = hidden ? '👁 Toon' : '🙈 Verberg';
});

els.btnSkip.addEventListener('click', () => {
  const w = pickWord(round.difficulty);
  if (!w) return;
  showWord(w);
});

els.btnStartTimer.addEventListener('click', startTimer);
els.btnPauseTimer.addEventListener('click', pauseTimer);
els.btnResetTimer.addEventListener('click', resetTimer);

els.btnResetCycle.addEventListener('click', () => {
  if (confirm('Alle gebruikte woorden vergeten en opnieuw beginnen?')) {
    db.used = []; updateUsedChips(); saveState();
  }
});

els.category.addEventListener('change', saveState);

// boot
const DEFAULTS = {};
(async function init(){
  const defaults = await loadDefaultWords(); Object.assign(DEFAULTS, defaults);
  db.categories = JSON.parse(JSON.stringify(DEFAULTS));
  loadCustomCategory(); seedKeys(); buildCategoriesUI(); restoreState(); updateUsedChips(); resetTimer();

  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('service-worker.js'); } catch(e){}
  }
})();
