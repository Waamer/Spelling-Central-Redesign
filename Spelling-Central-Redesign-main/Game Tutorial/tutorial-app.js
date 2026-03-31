// =============================================
// SPELLING CENTRAL — TUTORIAL ENGINE
// All demos are fully automated animations.
// User clicks Next / Prev to navigate.
// =============================================

const GAMES = {

  // ════════════════════════════════════════════
  // 1. WORD SEARCH
  // ════════════════════════════════════════════
  wordsearch: {
    icon: '🔍', title: 'Word Search',
    steps: [
      {
        title: 'The Goal',
        body: 'A grid of letters hides several spelling words. Find every word on the list to complete the puzzle. Words run left-to-right or top-to-bottom.',
        build: buildWS1
      },
      {
        title: 'Click, Hold & Drag',
        body: 'Click and hold on the first letter, then drag to the last. The "Selected Letters" panel on the right shows what you have highlighted. Release, then click "Try Word" to check.',
        build: buildWS2
      },
      {
        title: 'Correct & Wrong',
        body: 'Correct — "Try Word" flashes and the cells turn green, the word is ticked off the list. Wrong — "Try Word" shakes red and the selection clears automatically. Try a new selection.',
        build: buildWS3
      },
      {
        title: 'Finish the Game',
        body: 'Find all the words or press "Finish Game" at any time. A results screen shows how many words you found, how long you took, and your accuracy.',
        build: buildWS4
      }
    ]
  },

  // ════════════════════════════════════════════
  // 2. ALPHABETICAL ORDER
  // ════════════════════════════════════════════
  alphabetical: {
    icon: '🔤', title: 'Alphabetical Order',
    steps: [
      {
        title: 'The Goal',
        body: 'Four word cards appear in a random order. Drag each card into the correct numbered slot so the words are arranged from A to Z.',
        build: buildAL1
      },
      {
        title: 'Drag Cards into Slots',
        body: 'Pick up a word card and drop it in the slot where it belongs. The red × button next to any filled slot lets you remove that word and place it again.',
        build: buildAL2
      },
      {
        title: 'Right & Wrong Order',
        body: 'When all four slots are filled the game checks automatically. Correct — a green banner appears. Wrong — a "Not quite!" panel shows the issue with "Try Again" and "Show Hint" options.',
        build: buildAL3
      },
      {
        title: 'Score & Results',
        body: 'Complete all rounds to see your final score. Your accuracy percentage, number of correct answers, and time elapsed are shown on the results screen.',
        build: buildAL4
      }
    ]
  },

  // ════════════════════════════════════════════
  // 3. MIXED WORDS (Word Scramble)
  // ════════════════════════════════════════════
  scramble: {
    icon: '🔀', title: 'Mixed Words',
    steps: [
      {
        title: 'The Goal',
        body: 'A spelling word has been scrambled into random letter tiles. Rearrange the tiles so they spell the correct word, then press "Check Word" to submit.',
        build: buildMW1
      },
      {
        title: 'Select & Move Tiles',
        body: 'Click a tile to select it — it highlights in gold. Use the "← Left" and "→ Right" buttons (or keyboard arrow keys) to slide the selected tile to its correct position.',
        build: buildMW2
      },
      {
        title: 'Check Word',
        body: 'Press "Check Word" when the tiles look right. Correct — a green message confirms and the next word loads. Wrong — a red message shows what you guessed. Try moving tiles again.',
        build: buildMW3
      },
      {
        title: 'Score & Results',
        body: 'Work through all words. Use "Reshuffle" if you get stuck. Press "Finish" at any time to end. Your final score shows correct words out of total attempted.',
        build: buildMW4
      }
    ]
  },

  // ════════════════════════════════════════════
  // 4. MISSING LETTERS
  // ════════════════════════════════════════════
  missing: {
    icon: '🔡', title: 'Missing Letters',
    steps: [
      {
        title: 'The Goal',
        body: 'A word is shown with some letters missing — marked by empty boxes. Draggable letter tiles appear below. Drag the correct letters into the blank boxes to complete the word.',
        build: buildML1
      },
      {
        title: 'Drag Letters into Boxes',
        body: 'Pick up a letter tile and drag it onto an empty box in the word. You can also drag a letter back out of a box if you change your mind.',
        build: buildML2
      },
      {
        title: 'Submit, Correct & Wrong',
        body: 'Press "Submit" when all blanks are filled. Correct — a green banner appears and the next word loads. Wrong — a red banner shows the correct answer. Use "Skip" to move on without answering.',
        build: buildML3
      },
      {
        title: 'Score & Results',
        body: 'Complete all words to finish the game. Your score tracks how many words you answered correctly. Use the 💡 Hint button once per word if you need help.',
        build: buildML4
      }
    ]
  }
};

// ════════════════════════════════════════════
// ENGINE
// ════════════════════════════════════════════
let curGame   = null;
let curStep   = 0;
let cleanupFn = null;

function openTutorial(key) {
  curGame = key; curStep = 0;
  document.getElementById('landing').style.display = 'none';
  document.getElementById('tut-panel').classList.add('open');
  const g = GAMES[key];
  document.getElementById('tut-icon').textContent  = g.icon;
  document.getElementById('tut-title').textContent = g.title;
  renderStep();
}
function closeTutorial() {
  stopCleanup();
  document.getElementById('tut-panel').classList.remove('open');
  document.getElementById('landing').style.display = '';
  hideCursor();
}
function renderStep() {
  stopCleanup();
  const g = GAMES[curGame], step = g.steps[curStep], total = g.steps.length;
  document.getElementById('tut-step-label').textContent = `Step ${curStep+1} of ${total}`;
  document.getElementById('tut-prog-fill').style.width  = `${((curStep+1)/total)*100}%`;
  document.getElementById('step-num').textContent = curStep + 1;
  document.getElementById('step-of').textContent  = `of ${total}`;
  const titleEl = document.getElementById('step-title');
  const bodyEl  = document.getElementById('step-body');
  titleEl.style.opacity = '0'; bodyEl.style.opacity = '0';
  setTimeout(() => {
    titleEl.textContent = step.title; bodyEl.textContent = step.body;
    titleEl.style.transition = 'opacity .3s'; bodyEl.style.transition = 'opacity .3s';
    titleEl.style.opacity = '1'; bodyEl.style.opacity = '1';
  }, 80);
  const dotsEl = document.getElementById('tut-dots');
  dotsEl.innerHTML = g.steps.map((_,i) =>
    `<button class="tut-dot${i===curStep?' active':''}" onclick="goStep(${i})"></button>`
  ).join('');
  document.getElementById('btn-prev').disabled = curStep === 0;
  const nb = document.getElementById('btn-next');
  nb.textContent = curStep === total-1 ? '✓ Done' : 'Next →';
  const demo = document.getElementById('tut-demo');
  demo.innerHTML = '';
  const r = step.build(demo);
  if (typeof r === 'function') cleanupFn = r;
}
function stopCleanup() { if (cleanupFn) { try{cleanupFn();}catch(e){} cleanupFn=null; } hideCursor(); }
function nextStep() { if (curStep < GAMES[curGame].steps.length-1){curStep++;renderStep();}else closeTutorial(); }
function prevStep() { if (curStep > 0){curStep--;renderStep();} }
function goStep(i)  { curStep = i; renderStep(); }

// ════════════════════════════════════════════
// FAKE CURSOR
// ════════════════════════════════════════════
const cursorEl = document.getElementById('cursor');
let cursorTimers = [];
function hideCursor() { cursorTimers.forEach(clearTimeout); cursorTimers=[]; cursorEl.classList.remove('visible'); }
function moveCursor(x,y,cb,delay=0) {
  const t = setTimeout(() => {
    cursorEl.classList.add('visible');
    cursorEl.style.left = x+'px'; cursorEl.style.top = y+'px';
    if (cb) { const t2=setTimeout(cb,560); cursorTimers.push(t2); }
  }, delay);
  cursorTimers.push(t);
}
function clickAt(x,y,delay=0,cb) {
  moveCursor(x,y,() => {
    const r=document.createElement('div'); r.className='cursor-click';
    r.style.left=x+'px'; r.style.top=y+'px';
    document.body.appendChild(r); setTimeout(()=>r.remove(),520);
    if(cb) cb();
  }, delay);
}
function centre(el) { const r=el.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; }

// ════════════════════════════════════════════════════════
// SHARED HELPERS
// ════════════════════════════════════════════════════════
function panel(cls='') {
  return `<div class="demo-scene${cls?` ${cls}`:''}">`;
}
function topbar(title, stat='') {
  return `<div class="demo-topbar"><span class="demo-topbar-title">${title}</span>${stat?`<span class="demo-topbar-stat">${stat}</span>`:''}</div>`;
}
function finalScore(emoji,title,sub,correct,wrong,extra='') {
  return `<div class="demo-screen" style="max-width:300px;margin:0 auto">
    ${topbar(title)}
    <div class="demo-content" style="text-align:center;padding:16px 12px">
      <div style="font-size:38px;margin-bottom:6px">${emoji}</div>
      <div style="font-family:inherit;font-size:15px;font-weight:700;color:var(--text-dark);margin-bottom:12px">${sub}</div>
      <div class="demo-score">
        <div class="demo-score-box"><div class="demo-score-val" style="color:var(--green-text)">${correct}</div><div class="demo-score-lbl">Correct</div></div>
        <div class="demo-score-box"><div class="demo-score-val" style="color:var(--red-text)">${wrong}</div><div class="demo-score-lbl">Wrong</div></div>
        ${extra}
      </div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:14px">
        <div class="tool-btn" style="font-size:12px;padding:7px 14px">↺ Play Again</div>
        <div class="tool-btn" style="font-size:12px;padding:7px 14px">🏠 Home</div>
      </div>
    </div>
  </div>`;
}

// ════════════════════════════════════════════
// WORD SEARCH — grid data
// Grid: 6 cols × 6 rows = 36 cells
// APPLE  row0  cells 0–4
// KNIFE  col5  cells 5,11,17,23,29
// CAKE   row2  cells 12–15
// PLATE  row4  cells 24–28
// ════════════════════════════════════════════
const WS_GRID = [
  'A','P','P','L','E','K',
  'B','M','Q','R','S','N',
  'C','A','K','E','T','I',
  'D','G','H','J','U','F',
  'P','L','A','T','E','E',
  'V','W','X','Y','Z','O'
];
const WS_WORDS = [
  {word:'APPLE', cells:[0,1,2,3,4]},
  {word:'KNIFE', cells:[5,11,17,23,29]},
  {word:'CAKE',  cells:[12,13,14,15]},
  {word:'PLATE', cells:[24,25,26,27,28]}
];

function makeWSGrid(id, cols=6) {
  return `<div class="ws-grid" id="${id}" style="grid-template-columns:repeat(${cols},28px)"></div>`;
}
function populateWSGrid(id) {
  const g = document.getElementById(id);
  if (!g) return;
  g.innerHTML = WS_GRID.map((l,i)=>`<div class="ws-cell" id="${id}c${i}">${l}</div>`).join('');
}
function wsCellEl(gid,i) { return document.getElementById(`${gid}c${i}`); }

// ── WS Slide 1 — Goal overview, all words animate found ──
function buildWS1(container) {
  container.innerHTML = `
    <div class="demo-scene" style="display:flex;gap:10px;align-items:flex-start;width:100%;max-width:480px">
      <div class="demo-screen" style="flex:1">
        ${topbar('🔍 Word Search','0 / 4 found')}
        <div class="demo-content">${makeWSGrid('wsg1')}</div>
      </div>
      <div class="demo-screen" style="min-width:110px">
        ${topbar('Word List')}
        <div class="demo-content" style="padding:8px">
          <div class="ws-wordlist" style="flex-direction:column;gap:4px" id="wswl1">
            ${WS_WORDS.map(w=>`<div class="ws-wchip" id="ww1${w.word}">${w.word}</div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  populateWSGrid('wsg1');
  const timers = [];
  WS_WORDS.forEach((w,wi) => {
    timers.push(setTimeout(()=>{
      w.cells.forEach(c=>wsCellEl('wsg1',c)?.classList.add('hl'));
    }, wi*1600+400));
    timers.push(setTimeout(()=>{
      w.cells.forEach(c=>{ const el=wsCellEl('wsg1',c); if(el){el.classList.remove('hl');el.classList.add('found');} });
      document.getElementById(`ww1${w.word}`)?.classList.add('done');
      const stat=container.querySelector('.demo-topbar-stat');
      if(stat) stat.textContent=`${wi+1} / 4 found`;
    }, wi*1600+1200));
  });
  return ()=>timers.forEach(clearTimeout);
}

// ── WS Slide 2 — Drag selection + sidebar panel (mirrors actual game) ──
function buildWS2(container) {
  container.innerHTML = `
    <div class="demo-scene" style="display:flex;gap:10px;align-items:flex-start;width:100%;max-width:520px">
      <!-- board -->
      <div class="demo-screen" style="flex:1">
        ${topbar('🔍 Word Search')}
        <div class="demo-content">${makeWSGrid('wsg2')}</div>
      </div>
      <!-- sidebar mirrors actual word-search.html -->
      <div style="min-width:130px;display:flex;flex-direction:column;gap:6px">
        <div class="demo-screen">
          <div style="padding:8px 10px">
            <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Selected Letters</div>
            <div id="ws2-display" style="background:var(--panel-shell);border:2px solid var(--shell-border);border-radius:8px;padding:7px 10px;font-size:18px;font-weight:700;color:var(--text-dark);min-height:38px;letter-spacing:2px">|</div>
            <div id="ws2-state" style="font-size:11px;margin-top:5px;color:var(--text-muted);min-height:14px">Select letters to build a word.</div>
          </div>
        </div>
        <div id="ws2-try"   class="tool-btn" style="font-size:12px;padding:7px;text-align:center;opacity:.35">Try Word</div>
        <div id="ws2-clear" class="tool-btn" style="font-size:12px;padding:7px;text-align:center;opacity:.35">Clear Selection</div>
        <div id="ws2-msg" style="font-size:11px;font-weight:700;color:var(--text-muted);text-align:center;min-height:14px"></div>
      </div>
    </div>`;
  populateWSGrid('wsg2');
  const timers = [];
  // Animate dragging APPLE (cells 0–4)
  function doPass() {
    WS_GRID.forEach((_,i)=>{ const el=wsCellEl('wsg2',i); if(el){el.classList.remove('hl','found');} });
    const disp  = document.getElementById('ws2-display');
    const state = document.getElementById('ws2-state');
    const tryBtn= document.getElementById('ws2-try');
    const clrBtn= document.getElementById('ws2-clear');
    const msg   = document.getElementById('ws2-msg');
    if (!disp) return;
    disp.textContent='|'; disp.style.borderColor=''; disp.style.background='var(--panel-shell)';
    state.textContent='Select letters to build a word.'; state.style.color='var(--text-muted)';
    tryBtn.style.opacity='.35'; tryBtn.style.background=''; tryBtn.style.borderColor=''; tryBtn.style.color='';
    clrBtn.style.opacity='.35'; msg.textContent='';

    const cells = WS_WORDS[0].cells; // APPLE: 0-4
    const word  = 'APPLE';

    // cursor to A
    timers.push(setTimeout(()=>{
      const el=wsCellEl('wsg2',cells[0]); if(!el) return;
      const p=centre(el); moveCursor(p.x,p.y,null,0);
    },400));
    // press A
    timers.push(setTimeout(()=>{
      const el=wsCellEl('wsg2',cells[0]); if(!el) return;
      const p=centre(el);
      const r=document.createElement('div'); r.className='cursor-click'; r.style.left=p.x+'px'; r.style.top=p.y+'px';
      document.body.appendChild(r); setTimeout(()=>r.remove(),520);
      el.classList.add('hl');
      disp.textContent='A'; clrBtn.style.opacity='1';
      state.textContent='Holding — drag across…';
      msg.textContent='Click & hold first letter';
    },1000));
    // drag P P L E
    ['P','PP','PPL','APPLE'].forEach((txt,idx)=>{
      timers.push(setTimeout(()=>{
        const el=wsCellEl('wsg2',cells[idx+1]); if(!el) return;
        const p=centre(el); moveCursor(p.x,p.y,null,0);
        el.classList.add('hl'); disp.textContent=word.slice(0,idx+2);
      },1500+idx*350));
    });
    // all highlighted — enable Try Word
    timers.push(setTimeout(()=>{
      tryBtn.style.opacity='1';
      disp.style.borderColor='var(--green-border)'; disp.style.background='var(--green-found)';
      state.textContent='Ready to try: APPLE'; state.style.color='var(--green-text)';
      msg.textContent='Release & click Try Word';
    },2800));
    // cursor → Try Word
    timers.push(setTimeout(()=>{
      const p=centre(tryBtn); moveCursor(p.x,p.y,null,0);
    },3400));
    // click Try Word → found
    timers.push(setTimeout(()=>{
      const p=centre(tryBtn);
      clickAt(p.x,p.y,0,()=>{
        cells.forEach(c=>{ const el=wsCellEl('wsg2',c); if(el){el.classList.remove('hl');el.classList.add('found');} });
        tryBtn.style.opacity='1'; tryBtn.style.background='var(--green-found)'; tryBtn.style.borderColor='var(--green-border)'; tryBtn.style.color='var(--green-text)';
        disp.textContent='APPLE'; disp.style.borderColor='var(--green-border)';
        state.textContent='✅ Found: APPLE'; state.style.color='var(--green-text)';
        msg.textContent='Word found!';
        hideCursor();
      });
    },4000));
    timers.push(setTimeout(doPass,7200));
  }
  timers.push(setTimeout(doPass,300));
  return ()=>{timers.forEach(clearTimeout);hideCursor();};
}

// ── WS Slide 3 — Correct (green flash) vs Wrong (red shake + auto clear) ──
function buildWS3(container) {
  container.innerHTML = `
    <div class="demo-scene" style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:420px">
      <div class="demo-screen">
        <div class="demo-topbar" style="background:var(--green-text)"><span class="demo-topbar-title">✅ Correct — cells turn green, word ticked off</span></div>
        <div class="demo-content" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <div style="display:flex;gap:3px" id="ws3-ok"></div>
          <div class="ws-wchip done">CAKE ✓</div>
          <div id="ws3-ok-btn" class="tool-btn" style="font-size:12px;padding:6px 12px;background:var(--green-found);border-color:var(--green-border);color:var(--green-text)">Try Word</div>
        </div>
      </div>
      <div class="demo-screen">
        <div class="demo-topbar" style="background:var(--red-text)"><span class="demo-topbar-title">❌ Wrong — Try Word shakes red, clears automatically</span></div>
        <div class="demo-content">
          <div style="display:flex;gap:3px;margin-bottom:8px" id="ws3-bad"></div>
          <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
            <div id="ws3-bad-btn" class="tool-btn" style="font-size:12px;padding:6px 12px">Try Word</div>
            <div id="ws3-bad-clr" class="tool-btn" style="font-size:12px;padding:6px 12px">Clear Selection</div>
          </div>
          <div id="ws3-bad-state" style="font-size:11px;margin-top:6px;font-weight:700;color:var(--text-muted);min-height:14px"></div>
        </div>
      </div>
    </div>`;
  // correct panel — static
  const okDiv = document.getElementById('ws3-ok');
  'CAKE'.split('').forEach(l=>{ const d=document.createElement('div'); d.className='ws-cell found'; d.textContent=l; okDiv.appendChild(d); });
  const timers = [];
  function animWrong() {
    const bad     = document.getElementById('ws3-bad');
    const badBtn  = document.getElementById('ws3-bad-btn');
    const clrBtn  = document.getElementById('ws3-bad-clr');
    const stEl    = document.getElementById('ws3-bad-state');
    if (!bad||!badBtn) return;
    bad.innerHTML=''; 'XPQ'.split('').forEach(l=>{ const d=document.createElement('div'); d.className='ws-cell hl'; d.textContent=l; bad.appendChild(d); });
    badBtn.style.background=''; badBtn.style.borderColor=''; badBtn.style.color=''; badBtn.style.animation='';
    clrBtn.style.background=''; stEl.textContent='';
    // cursor → Try Word
    timers.push(setTimeout(()=>{ const p=centre(badBtn); moveCursor(p.x,p.y,null,0); },500));
    // click → shakes red
    timers.push(setTimeout(()=>{
      const p=centre(badBtn);
      clickAt(p.x,p.y,0,()=>{
        badBtn.style.background='var(--red-bg)'; badBtn.style.borderColor='var(--red-border)'; badBtn.style.color='var(--red-text)';
        badBtn.style.animation='shake .28s ease';
        stEl.textContent='"XPQ" is not one of the hidden words.'; stEl.style.color='var(--red-text)';
      });
    },1100));
    // stop shake
    timers.push(setTimeout(()=>{ badBtn.style.animation=''; },1500));
    // auto-clear cells after ~1s (matches game behaviour)
    timers.push(setTimeout(()=>{
      bad.querySelectorAll('.ws-cell').forEach(c=>c.classList.remove('hl'));
      badBtn.style.background=''; badBtn.style.borderColor=''; badBtn.style.color='';
      stEl.textContent='Selection cleared automatically. Try again.'; stEl.style.color='var(--text-muted)';
      hideCursor();
    },2400));
    timers.push(setTimeout(animWrong,5200));
  }
  timers.push(setTimeout(animWrong,400));
  return ()=>{timers.forEach(clearTimeout);hideCursor();};
}

// ── WS Slide 4 — Results screen ──
function buildWS4(container) {
  container.innerHTML = `<div class="demo-scene" style="width:100%;max-width:360px">` + finalScore('🏆','🔍 Puzzle Complete!','You found all 4 words!','4','0',`<div class="demo-score-box"><div class="demo-score-val">00:42</div><div class="demo-score-lbl">Time</div></div>`) + `</div>`;
  return null;
}

// ════════════════════════════════════════════
// ALPHABETICAL ORDER
// ════════════════════════════════════════════
const AL_SCRAMBLED = ['orange','apple','grape','banana'];
const AL_CORRECT   = ['apple','banana','grape','orange'];

function alphaZone(n,word='',correct=false,filled=false) {
  const bg = correct ? 'var(--green-found)' : filled ? '#edf5e8' : 'var(--panel-shell)';
  const bc = correct ? 'var(--green-border)' : filled ? 'var(--green-border)' : 'var(--shell-border)';
  const bs = correct||filled ? 'solid' : 'dashed';
  return `<div class="alpha-zone${correct?' correct':filled?' filled':''}" style="background:${bg};border-color:${bc};border-style:${bs}">
    <div class="alpha-zone-n">${n}</div>
    <div class="alpha-zone-w">${word||'<span style="color:var(--text-muted);font-style:italic;font-size:12px">Drop here</span>'}</div>
    ${correct?`<span class="alpha-check" style="opacity:1">✅</span>`:filled?`<button style="background:var(--red-bg);border:1.5px solid var(--red-border);border-radius:50%;width:20px;height:20px;font-size:11px;font-weight:700;color:var(--red-text);cursor:pointer;padding:0;margin-left:auto" id="rm${n}">×</button>`:''}
  </div>`;
}

// ── AL Slide 1 — Goal ──
function buildAL1(container) {
  container.innerHTML = `
    <div class="demo-scene" style="width:100%;max-width:340px">
      <div class="demo-screen">
        ${topbar('🔤 Alphabetical Order','Round 1 / 10')}
        <div class="demo-content">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Word Cards</div>
          <div class="alpha-pool" style="margin-bottom:12px">
            ${AL_SCRAMBLED.map(w=>`<div class="alpha-chip">${w}</div>`).join('')}
          </div>
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Drop Zones</div>
          <div class="alpha-zones">
            ${[1,2,3,4].map(n=>alphaZone(n)).join('')}
          </div>
        </div>
      </div>
    </div>`;
  return null;
}

// ── AL Slide 2 — Drag animation + remove button ──
function buildAL2(container) {
  container.innerHTML = `
    <div class="demo-scene" style="width:100%;max-width:340px">
      <div class="demo-screen">
        ${topbar('🔤 Alphabetical Order')}
        <div class="demo-content">
          <div class="alpha-pool" id="al2-pool"></div>
          <div class="alpha-zones" id="al2-zones"></div>
          <div id="al2-msg" style="font-size:11px;font-weight:700;color:var(--text-muted);margin-top:8px;text-align:center;min-height:14px"></div>
        </div>
      </div>
    </div>`;
  const pool  = document.getElementById('al2-pool');
  const zones = document.getElementById('al2-zones');
  AL_SCRAMBLED.forEach(w=>{ const d=document.createElement('div'); d.className='alpha-chip'; d.id=`al2c-${w}`; d.textContent=w; pool.appendChild(d); });
  for(let n=1;n<=4;n++) { const z=document.createElement('div'); z.className='alpha-zone'; z.id=`al2z-${n}`; z.innerHTML=`<div class="alpha-zone-n">${n}</div><div class="alpha-zone-w" id="al2zw-${n}" style="color:var(--text-muted);font-style:italic;font-size:12px">Drop here</div>`; zones.appendChild(z); }
  const timers=[];
  function doPass() {
    AL_SCRAMBLED.forEach(w=>{ const c=document.getElementById(`al2c-${w}`); if(c){c.classList.remove('placed','lifted');c.style.display='';} });
    for(let n=1;n<=4;n++){
      const z=document.getElementById(`al2z-${n}`); const w=document.getElementById(`al2zw-${n}`);
      if(z){z.className='alpha-zone';z.style.background='';z.style.borderColor='';z.style.borderStyle='';}
      if(w){w.textContent='Drop here';w.style.color='var(--text-muted)';w.style.fontStyle='italic';w.style.fontSize='12px';}
      const rm=z?.querySelector('.remove-btn-demo'); if(rm) rm.remove();
    }
    const msg=document.getElementById('al2-msg'); if(msg) msg.textContent='';
    // Animate placing first two words, then show remove button on slot 1
    AL_CORRECT.slice(0,2).forEach((word,idx)=>{
      const chip=document.getElementById(`al2c-${word}`);
      const zoneZ=document.getElementById(`al2z-${idx+1}`);
      const zoneW=document.getElementById(`al2zw-${idx+1}`);
      if(!chip||!zoneZ) return;
      timers.push(setTimeout(()=>{ chip.classList.add('lifted'); const p=centre(chip); moveCursor(p.x,p.y,null,0); },idx*1200+300));
      timers.push(setTimeout(()=>{
        const p=centre(zoneZ); moveCursor(p.x,p.y,null,0);
        clickAt(p.x,p.y,0,()=>{
          chip.classList.add('placed');
          zoneZ.className='alpha-zone filled'; zoneZ.style.background='#edf5e8'; zoneZ.style.borderColor='var(--green-border)'; zoneZ.style.borderStyle='solid';
          if(zoneW){zoneW.textContent=word;zoneW.style.color='var(--text-dark)';zoneW.style.fontStyle='normal';zoneW.style.fontSize='13px';}
          // add remove button
          const rm=document.createElement('button'); rm.className='remove-btn-demo';
          rm.style.cssText='background:var(--red-bg);border:1.5px solid var(--red-border);border-radius:50%;width:20px;height:20px;font-size:11px;font-weight:700;color:var(--red-text);cursor:pointer;padding:0;margin-left:auto';
          rm.textContent='×'; zoneZ.appendChild(rm);
        });
      },idx*1200+900));
    });
    timers.push(setTimeout(()=>{
      if(msg) msg.textContent='Click × to remove a word and place it again';
      hideCursor();
    },2800));
    timers.push(setTimeout(doPass,5600));
  }
  timers.push(setTimeout(doPass,300));
  return ()=>{timers.forEach(clearTimeout);hideCursor();};
}

// ── AL Slide 3 — Wrong order modal + correct order ──
function buildAL3(container) {
  container.innerHTML = `
    <div class="demo-scene" style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:380px">
      <div class="demo-screen">
        <div class="demo-topbar" style="background:var(--green-text)"><span class="demo-topbar-title">✅ Correct Order — All zones turn green</span></div>
        <div class="demo-content">
          <div class="alpha-zones">
            ${AL_CORRECT.map((w,i)=>alphaZone(i+1,w,true)).join('')}
          </div>
        </div>
      </div>
      <div class="demo-screen">
        <div class="demo-topbar" style="background:var(--red-text)"><span class="demo-topbar-title">❌ Wrong order — "Not quite!" panel appears</span></div>
        <div class="demo-content">
          <div class="alpha-zones" style="margin-bottom:8px" id="al3-bad-zones"></div>
          <div id="al3-modal" style="background:var(--panel-bg);border:2px solid var(--red-border);border-radius:10px;padding:10px 12px;display:none">
            <div style="font-size:18px;margin-bottom:3px">✗</div>
            <div style="font-family:inherit;font-size:13px;font-weight:700;color:var(--red-text);margin-bottom:3px">Not quite!</div>
            <div id="al3-wrong-msg" style="font-size:11px;color:var(--text-muted);margin-bottom:8px"></div>
            <div style="display:flex;gap:6px">
              <div class="tool-btn" style="font-size:11px;padding:5px 10px">Try Again</div>
              <div class="tool-btn" style="font-size:11px;padding:5px 10px">Show Hint</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  const badZones = document.getElementById('al3-bad-zones');
  const wrongOrder = ['banana','apple','orange','grape'];
  wrongOrder.forEach((w,i)=>{ badZones.innerHTML+=alphaZone(i+1,w,false,true); });
  const timers=[];
  function animWrong() {
    const modal=document.getElementById('al3-modal');
    const wmsg=document.getElementById('al3-wrong-msg');
    if(!modal) return;
    modal.style.display='none';
    timers.push(setTimeout(()=>{
      modal.style.display='block';
      if(wmsg) wmsg.textContent='banana should come before orange in position 1.';
    },800));
    timers.push(setTimeout(()=>{ modal.style.display='none'; },3200));
    timers.push(setTimeout(animWrong,5000));
  }
  timers.push(setTimeout(animWrong,400));
  return ()=>timers.forEach(clearTimeout);
}

// ── AL Slide 4 — Results ──
function buildAL4(container) {
  container.innerHTML=`<div class="demo-scene" style="width:100%;max-width:340px">`+finalScore('🏅','🔤 All Rounds Done!','8 out of 10 correct','8','2',`<div class="demo-score-box"><div class="demo-score-val">80%</div><div class="demo-score-lbl">Accuracy</div></div>`)+`</div>`;
  return null;
}

// ════════════════════════════════════════════
// MIXED WORDS (game: click tile → ← → arrows → Check Word)
// ════════════════════════════════════════════
const MW_WORD     = 'APPLE';
const MW_SCRAMBLE = ['P','L','A','P','E']; // scrambled APPLE

function mwTile(letter, idx, selected=false, gone=false) {
  return `<div class="alpha-chip" id="mwt${idx}" style="${gone?'opacity:.2;':''}${selected?'outline:3px solid var(--gold);outline-offset:2px;':''}font-size:18px;padding:8px 12px;min-width:36px;text-align:center">${letter}</div>`;
}

// ── MW Slide 1 — Goal ──
function buildMW1(container) {
  container.innerHTML = `
    <div class="demo-scene" style="width:100%;max-width:360px">
      <div class="demo-screen">
        ${topbar('🔀 Mixed Words','Score: 0 / 6')}
        <div class="demo-content">
          <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:8px">
            <span>Round: 1 / 6</span><span>Target: 5 letters</span>
          </div>
          <div style="height:6px;background:var(--shell-border);border-radius:99px;overflow:hidden;margin-bottom:12px">
            <div style="height:100%;width:8%;background:linear-gradient(90deg,var(--gold-light),var(--gold));border-radius:99px"></div>
          </div>
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Letters</div>
          <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px">
            ${MW_SCRAMBLE.map((l,i)=>mwTile(l,i)).join('')}
          </div>
          <div style="font-size:12px;color:var(--text-muted);text-align:center">Arrange the letters to spell the correct word.</div>
          <div style="display:flex;gap:6px;justify-content:center;margin-top:10px;flex-wrap:wrap">
            <div class="tool-btn" style="font-size:11px;padding:6px 10px">← Left</div>
            <div class="tool-btn" style="font-size:11px;padding:6px 10px">Right →</div>
            <div class="tool-btn" style="font-size:11px;padding:6px 10px;background:linear-gradient(180deg,var(--gold-light),var(--gold));border-color:#b07e10">Check Word</div>
          </div>
        </div>
      </div>
    </div>`;
  return null;
}

// ── MW Slide 2 — Click tile, move with arrows ──
function buildMW2(container) {
  container.innerHTML = `
    <div class="demo-scene" style="width:100%;max-width:360px">
      <div class="demo-screen">
        ${topbar('🔀 Mixed Words')}
        <div class="demo-content">
          <div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px" id="mw2-tiles"></div>
          <div style="display:flex;gap:6px;justify-content:center;margin-bottom:8px">
            <div class="tool-btn" id="mw2-left"  style="font-size:11px;padding:6px 10px;opacity:.35">← Left</div>
            <div class="tool-btn" id="mw2-right" style="font-size:11px;padding:6px 10px">Right →</div>
            <div class="tool-btn" style="font-size:11px;padding:6px 10px;background:linear-gradient(180deg,var(--gold-light),var(--gold));border-color:#b07e10">Check Word</div>
          </div>
          <div id="mw2-fb" style="font-size:12px;font-weight:700;color:var(--text-muted);text-align:center;min-height:16px">Pick a tile to start.</div>
        </div>
      </div>
    </div>`;
  let letters = [...MW_SCRAMBLE]; // P L A P E
  let selIdx  = null;
  const timers = [];

  function renderMW2() {
    const tilesEl = document.getElementById('mw2-tiles');
    const leftBtn = document.getElementById('mw2-left');
    const rightBtn= document.getElementById('mw2-right');
    if (!tilesEl) return;
    tilesEl.innerHTML = letters.map((l,i)=>`<div class="alpha-chip" id="mw2t${i}" style="font-size:18px;padding:8px 12px;min-width:36px;text-align:center;${selIdx===i?'outline:3px solid var(--gold);outline-offset:2px;':''}">${l}</div>`).join('');
    if(leftBtn)  leftBtn.style.opacity  = (selIdx!==null&&selIdx>0)?'1':'.35';
    if(rightBtn) rightBtn.style.opacity = (selIdx!==null&&selIdx<letters.length-1)?'1':'.35';
  }

  function doPass() {
    letters = [...MW_SCRAMBLE]; selIdx = null; renderMW2();
    const fb = document.getElementById('mw2-fb');
    if (fb) fb.textContent = 'Pick a tile to start.';
    // Step 1: click tile P (idx 0)
    timers.push(setTimeout(()=>{
      const el=document.getElementById('mw2t0'); if(!el) return;
      const p=centre(el); moveCursor(p.x,p.y,null,0);
    },500));
    timers.push(setTimeout(()=>{
      const el=document.getElementById('mw2t0'); if(!el) return;
      const p=centre(el);
      clickAt(p.x,p.y,0,()=>{ selIdx=0; renderMW2(); if(fb) fb.textContent='Selected "P" — use arrows to move it'; });
    },1100));
    // Step 2: click Right →  (move P from 0→1)
    timers.push(setTimeout(()=>{
      const btn=document.getElementById('mw2-right'); if(!btn) return;
      const p=centre(btn); moveCursor(p.x,p.y,null,0);
    },1900));
    timers.push(setTimeout(()=>{
      const btn=document.getElementById('mw2-right'); if(!btn) return;
      const p=centre(btn);
      clickAt(p.x,p.y,0,()=>{
        if(selIdx!==null&&selIdx<letters.length-1){
          [letters[selIdx],letters[selIdx+1]]=[letters[selIdx+1],letters[selIdx]]; selIdx++;
        }
        renderMW2(); if(fb) fb.textContent='Moved right — keep going!';
      });
    },2500));
    // Step 3: click Right again (move P 1→2)
    timers.push(setTimeout(()=>{
      const btn=document.getElementById('mw2-right'); if(!btn) return;
      const p=centre(btn); moveCursor(p.x,p.y,null,0);
    },3200));
    timers.push(setTimeout(()=>{
      const btn=document.getElementById('mw2-right'); if(!btn) return;
      const p=centre(btn);
      clickAt(p.x,p.y,0,()=>{
        if(selIdx!==null&&selIdx<letters.length-1){
          [letters[selIdx],letters[selIdx+1]]=[letters[selIdx+1],letters[selIdx]]; selIdx++;
        }
        renderMW2(); if(fb) fb.textContent='Tile moved — adjust all tiles, then Check Word';
        hideCursor();
      });
    },3800));
    timers.push(setTimeout(doPass,7000));
  }
  timers.push(setTimeout(doPass,300));
  return ()=>{timers.forEach(clearTimeout);hideCursor();};
}

// ── MW Slide 3 — Check Word: correct green / wrong red ──
function buildMW3(container) {
  container.innerHTML = `
    <div class="demo-scene" style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:380px">
      <div class="demo-screen">
        <div class="demo-topbar" style="background:var(--green-text)"><span class="demo-topbar-title">✅ Correct — next word loads automatically</span></div>
        <div class="demo-content">
          <div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px">
            ${'APPLE'.split('').map(l=>`<div class="alpha-chip" style="font-size:18px;padding:8px 12px;min-width:36px;text-align:center;background:var(--green-found);border-color:var(--green-border);color:var(--green-text)">${l}</div>`).join('')}
          </div>
          <div style="font-size:12px;font-weight:700;color:var(--green-text);text-align:center">Correct — APPLE! Loading next word…</div>
        </div>
      </div>
      <div class="demo-screen">
        <div class="demo-topbar" style="background:var(--red-text)"><span class="demo-topbar-title">❌ Wrong — red message, try moving tiles again</span></div>
        <div class="demo-content">
          <div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px" id="mw3-bad-tiles"></div>
          <div id="mw3-fb" style="font-size:12px;font-weight:700;text-align:center;color:var(--red-text);min-height:16px">Not quite. You made "LAPPE". Try again.</div>
          <div style="display:flex;gap:6px;justify-content:center;margin-top:8px">
            <div class="tool-btn" style="font-size:11px;padding:6px 10px;background:linear-gradient(180deg,var(--gold-light),var(--gold));border-color:#b07e10" id="mw3-check">Check Word</div>
            <div class="tool-btn" style="font-size:11px;padding:6px 10px">Reshuffle</div>
          </div>
        </div>
      </div>
    </div>`;
  const badTiles=document.getElementById('mw3-bad-tiles');
  'LAPPE'.split('').forEach(l=>{ const d=document.createElement('div'); d.className='alpha-chip'; d.style.cssText='font-size:18px;padding:8px 12px;min-width:36px;text-align:center'; d.textContent=l; badTiles.appendChild(d); });
  const timers=[];
  function animCheck() {
    const fb=document.getElementById('mw3-fb'); const btn=document.getElementById('mw3-check'); if(!btn) return;
    btn.style.background='linear-gradient(180deg,var(--gold-light),var(--gold))'; btn.style.borderColor='#b07e10';
    if(fb) fb.textContent='Not quite. You made "LAPPE". Try again.'; if(fb) fb.style.color='var(--red-text)';
    timers.push(setTimeout(()=>{ const p=centre(btn); moveCursor(p.x,p.y,null,0); },400));
    timers.push(setTimeout(()=>{
      const p=centre(btn);
      clickAt(p.x,p.y,0,()=>{
        btn.style.background='var(--red-bg)'; btn.style.borderColor='var(--red-border)'; btn.style.animation='shake .28s ease';
        setTimeout(()=>{ btn.style.animation=''; btn.style.background='linear-gradient(180deg,var(--gold-light),var(--gold))'; btn.style.borderColor='#b07e10'; },500);
        hideCursor();
      });
    },1000));
    timers.push(setTimeout(animCheck,4500));
  }
  timers.push(setTimeout(animCheck,500));
  return ()=>{timers.forEach(clearTimeout);hideCursor();};
}

// ── MW Slide 4 — Results ──
function buildMW4(container) {
  container.innerHTML=`<div class="demo-scene" style="width:100%;max-width:340px">`+finalScore('🎉','🔀 Game Complete!','5 out of 6 words correct','5','1',`<div class="demo-score-box"><div class="demo-score-val">83%</div><div class="demo-score-lbl">Accuracy</div></div>`)+`</div>`;
  return null;
}

// ════════════════════════════════════════════
// MISSING LETTERS (drag letter tiles → blank boxes → Submit)
// ════════════════════════════════════════════
// Word: CAKE  — missing indices 1 (A) and 3 (E)  → C _ K _
const ML_WORD   = ['C','A','K','E'];
const ML_BLANKS = [false,true,false,true];
const ML_OPTIONS= ['A','E','B','T','I'];

function mlBox(letter, blank, filled='', correct=false) {
  if (!blank) return `<div class="ml-box">${letter}</div>`;
  if (correct) return `<div class="ml-box correct">${letter}</div>`;
  if (filled)  return `<div class="ml-box filling" id="mlbox-fill">${filled}</div>`;
  return `<div class="ml-box blank" id="mlbox-empty"></div>`;
}

// ── ML Slide 1 — Goal ──
function buildML1(container) {
  container.innerHTML = `
    <div class="demo-scene" style="width:100%;max-width:360px">
      <div class="demo-screen">
        ${topbar('🔡 Missing Letters','Score: 0 / 0')}
        <div class="demo-content" style="text-align:center">
          <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:10px">Complete the word:</div>
          <div class="ml-row">
            <div class="ml-box">C</div>
            <div class="ml-box blank"></div>
            <div class="ml-box">K</div>
            <div class="ml-box blank"></div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin:6px 0 10px">Drag the correct letters into the blank boxes</div>
          <div class="ml-opts">
            ${ML_OPTIONS.map(l=>`<div class="ml-opt" style="cursor:grab">${l}</div>`).join('')}
          </div>
          <div style="display:flex;gap:6px;justify-content:center;margin-top:10px">
            <div class="tool-btn" style="font-size:11px;padding:6px 10px">Skip</div>
            <div class="tool-btn" style="font-size:11px;padding:6px 10px;background:linear-gradient(180deg,var(--gold-light),var(--gold));border-color:#b07e10">Submit</div>
            <div class="tool-btn" style="font-size:11px;padding:6px 10px">💡 Hint</div>
          </div>
        </div>
      </div>
    </div>`;
  return null;
}

// ── ML Slide 2 — Drag letter into blank box ──
function buildML2(container) {
  container.innerHTML = `
    <div class="demo-scene" style="width:100%;max-width:360px">
      <div class="demo-screen">
        ${topbar('🔡 Missing Letters')}
        <div class="demo-content" style="text-align:center">
          <div class="ml-row" id="ml2-row">
            <div class="ml-box">C</div>
            <div class="ml-box blank" id="ml2b1"></div>
            <div class="ml-box">K</div>
            <div class="ml-box blank" id="ml2b2"></div>
          </div>
          <div id="ml2-msg" style="font-size:11px;font-weight:700;color:var(--text-muted);margin:6px 0 10px;min-height:14px">Drag a letter tile onto a blank box</div>
          <div class="ml-opts" id="ml2-opts">
            ${ML_OPTIONS.map((l,i)=>`<div class="ml-opt" id="ml2o${i}" style="cursor:grab">${l}</div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  const timers=[];
  function doPass() {
    const b1=document.getElementById('ml2b1'); const b2=document.getElementById('ml2b2');
    if(b1){b1.textContent='';b1.className='ml-box blank';} if(b2){b2.textContent='';b2.className='ml-box blank';}
    ML_OPTIONS.forEach((_,i)=>{ const o=document.getElementById(`ml2o${i}`); if(o){o.style.opacity='1';o.style.outline='';} });
    const msg=document.getElementById('ml2-msg'); if(msg) msg.textContent='Drag a letter tile onto a blank box';
    // Pick up 'A' (idx 0)
    const optA=document.getElementById('ml2o0'); if(!optA) return;
    timers.push(setTimeout(()=>{ const p=centre(optA); moveCursor(p.x,p.y,null,0); },500));
    timers.push(setTimeout(()=>{
      const p=centre(optA); const r=document.createElement('div'); r.className='cursor-click'; r.style.left=p.x+'px'; r.style.top=p.y+'px'; document.body.appendChild(r); setTimeout(()=>r.remove(),520);
      optA.style.opacity='.35'; optA.style.outline='';
      if(msg) msg.textContent='Picked up "A" — dragging to blank box…';
    },1100));
    // drag to b1
    timers.push(setTimeout(()=>{ if(b1) { const p=centre(b1); moveCursor(p.x,p.y,null,0); } },1700));
    // drop
    timers.push(setTimeout(()=>{
      if(!b1) return; const p=centre(b1);
      clickAt(p.x,p.y,0,()=>{
        b1.textContent='A'; b1.className='ml-box filling';
        if(msg) msg.textContent='Dropped! Now fill the second blank.';
        hideCursor();
      });
    },2300));
    // pick E (idx 1)
    const optE=document.getElementById('ml2o1');
    timers.push(setTimeout(()=>{ if(optE){const p=centre(optE);moveCursor(p.x,p.y,null,0);} },3100));
    timers.push(setTimeout(()=>{
      if(!optE) return; const p=centre(optE); const r=document.createElement('div'); r.className='cursor-click'; r.style.left=p.x+'px'; r.style.top=p.y+'px'; document.body.appendChild(r); setTimeout(()=>r.remove(),520);
      optE.style.opacity='.35';
      if(msg) msg.textContent='Picked up "E" — drag to second blank…';
    },3700));
    timers.push(setTimeout(()=>{ if(b2){const p=centre(b2);moveCursor(p.x,p.y,null,0);} },4300));
    timers.push(setTimeout(()=>{
      if(!b2) return; const p=centre(b2);
      clickAt(p.x,p.y,0,()=>{
        b2.textContent='E'; b2.className='ml-box filling';
        if(msg) msg.textContent='All blanks filled! Press Submit to check.';
        hideCursor();
      });
    },4900));
    timers.push(setTimeout(doPass,8000));
  }
  timers.push(setTimeout(doPass,300));
  return ()=>{timers.forEach(clearTimeout);hideCursor();};
}

// ── ML Slide 3 — Submit: correct / wrong / skip ──
function buildML3(container) {
  container.innerHTML = `
    <div class="demo-scene" style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:380px">
      <div class="demo-screen">
        <div class="demo-topbar" style="background:var(--green-text)"><span class="demo-topbar-title">✅ Correct — moves to next word</span></div>
        <div class="demo-content" style="text-align:center">
          <div class="ml-row" style="justify-content:center;margin-bottom:6px">
            ${'CAKE'.split('').map(l=>`<div class="ml-box correct">${l}</div>`).join('')}
          </div>
          <div style="font-size:12px;font-weight:700;color:var(--green-text)">Correct! Loading next word…</div>
        </div>
      </div>
      <div class="demo-screen">
        <div class="demo-topbar" style="background:var(--red-text)"><span class="demo-topbar-title">❌ Wrong — shows correct word, moves on</span></div>
        <div class="demo-content" style="text-align:center">
          <div class="ml-row" style="justify-content:center;margin-bottom:6px">
            <div class="ml-box">C</div>
            <div class="ml-box blank"></div>
            <div class="ml-box">K</div>
            <div class="ml-box filling">B</div>
          </div>
          <div id="ml3-fb" style="font-size:12px;font-weight:700;color:var(--red-text);margin-bottom:8px">Incorrect! Correct: CAKE</div>
          <div style="display:flex;gap:6px;justify-content:center">
            <div class="tool-btn" style="font-size:11px;padding:6px 10px" id="ml3-skip">Skip</div>
            <div class="tool-btn" style="font-size:11px;padding:6px 10px;background:linear-gradient(180deg,var(--gold-light),var(--gold));border-color:#b07e10" id="ml3-sub">Submit</div>
          </div>
        </div>
      </div>
    </div>`;
  const timers=[];
  function animSub() {
    const sub=document.getElementById('ml3-sub'); const skip=document.getElementById('ml3-skip'); if(!sub) return;
    timers.push(setTimeout(()=>{ const p=centre(sub); moveCursor(p.x,p.y,null,0); },400));
    timers.push(setTimeout(()=>{
      const p=centre(sub);
      clickAt(p.x,p.y,0,()=>{
        sub.style.background='var(--red-bg)'; sub.style.borderColor='var(--red-border)'; sub.style.animation='shake .28s ease';
        setTimeout(()=>{ sub.style.animation=''; sub.style.background='linear-gradient(180deg,var(--gold-light),var(--gold))'; sub.style.borderColor='#b07e10'; },500);
      });
    },1000));
    // cursor → Skip
    timers.push(setTimeout(()=>{ const p=centre(skip); moveCursor(p.x,p.y,null,0); },2200));
    timers.push(setTimeout(()=>{
      clickAt(centre(skip).x,centre(skip).y,0,()=>{ hideCursor(); });
    },2800));
    timers.push(setTimeout(animSub,5500));
  }
  timers.push(setTimeout(animSub,400));
  return ()=>{timers.forEach(clearTimeout);hideCursor();};
}

// ── ML Slide 4 — Results ──
function buildML4(container) {
  container.innerHTML=`<div class="demo-scene" style="width:100%;max-width:340px">`+finalScore('🌟','🔡 Game Complete!','7 out of 10 correct','7','3',`<div class="demo-score-box"><div class="demo-score-val">70%</div><div class="demo-score-lbl">Accuracy</div></div>`)+`</div>`;
  return null;
}
