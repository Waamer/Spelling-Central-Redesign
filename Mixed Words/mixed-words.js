(() => {
  "use strict";

  const WORDS = ['jam', 'code', 'apple', 'swift', 'train', 'planet'];

  const state = {
    words: WORDS.map((word) => word.toLowerCase()),
    currentIndex: 0,
    currentLetters: [],
    selectedIndex: null,
    score: 0,
    answeredCurrent: false,
    gameFinished: false,
    dragIndex: null
  };

  const tilesEl = document.getElementById('tiles');
  const scoreTextEl = document.getElementById('scoreText');
  const roundTextEl = document.getElementById('roundText');
  const targetLengthEl = document.getElementById('targetLength');
  const progressBarEl = document.getElementById('progressBar');
  const feedbackTextEl = document.getElementById('feedbackText');
  const moveLeftBtn = document.getElementById('moveLeftBtn');
  const moveRightBtn = document.getElementById('moveRightBtn');
  const nextWordBtn = document.getElementById('nextWordBtn');
  const clearSelectionBtn = document.getElementById('clearSelectionBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const finishBtn = document.getElementById('finishBtn');

  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const helpCloseBtn = document.getElementById('helpCloseBtn');

  const gameCompleteModal = document.getElementById('gameCompleteModal');
  const gameCompleteMessage = document.getElementById('gameCompleteMessage');
  const gameCompleteScoreValue = document.getElementById('gameCompleteScoreValue');
  const gameCompleteTotalValue = document.getElementById('gameCompleteTotalValue');
  const gameCompleteAccuracyValue = document.getElementById('gameCompleteAccuracyValue');
  const playAgainBtn = document.getElementById('playAgainBtn');

  const mwTutStepLabel = document.getElementById('mwTutStepLabel');
  const mwTutProgressFill = document.getElementById('mwTutProgressFill');
  const mwTutStepNum = document.getElementById('mwTutStepNum');
  const mwTutStepOf = document.getElementById('mwTutStepOf');
  const mwTutStepTitle = document.getElementById('mwTutStepTitle');
  const mwTutStepBody = document.getElementById('mwTutStepBody');
  const mwTutDemo = document.getElementById('mwTutDemo');
  const mwTutDots = document.getElementById('mwTutDots');
  const mwTutPrevBtn = document.getElementById('mwTutPrevBtn');
  const mwTutNextBtn = document.getElementById('mwTutNextBtn');
  const cursorEl = document.getElementById('cursor');

  let tutorialStep = 0;
  let tutorialCleanup = null;
  let cursorTimers = [];
  let touchDragging = false;

  const TUTORIAL_STEPS = [
    {
      title: 'The Goal',
      body: 'A spelling word has been scrambled into random letter tiles. Rearrange the tiles so they spell the correct word, then press "Check Word" to submit.',
      build: buildMW1
    },
    {
      title: 'Select & Move Tiles',
      body: 'Click a tile to select it — it highlights in gold. You can drag tiles on touch screens, or use the arrow buttons and keyboard arrows.',
      build: buildMW2
    },
    {
      title: 'Check Word',
      body: 'Press "Check Word" when the tiles look right. Wrong answers shake red. Correct answers turn green and load the next word.',
      build: buildMW3
    },
    {
      title: 'Score & Results',
      body: 'Work through all 6 words. Press "Finish Game" at any time to end. Accuracy is based on correct answers out of 6 total questions.',
      build: buildMW4
    }
  ];

  function shuffleWord(word) {
    if (word.length < 2) return word.split('');

    let chars = word.split('');
    let attempts = 0;

    do {
      chars = word.split('');
      for (let i = chars.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }
      attempts += 1;
    } while (chars.join('') === word && attempts < 10);

    return chars;
  }

  function getCurrentWord() {
    return state.words[state.currentIndex];
  }

  function setFeedback(message, type = 'idle') {
    feedbackTextEl.textContent = message;

    if (type === 'success') {
      feedbackTextEl.style.color = '#3f6b43';
    } else if (type === 'error') {
      feedbackTextEl.style.color = '#9b3b30';
    } else {
      feedbackTextEl.style.color = '#1f3b2d';
    }
  }

  function updateStats() {
    scoreTextEl.textContent = `${state.score} / ${state.words.length}`;
    roundTextEl.textContent = `${Math.min(state.currentIndex + 1, state.words.length)} / ${state.words.length}`;

    const currentWord = getCurrentWord() || '';
    targetLengthEl.textContent = `${currentWord.length} ${currentWord.length === 1 ? 'letter' : 'letters'}`;

    const total = state.words.length;
    const progress = total === 0 ? 0 : ((state.currentIndex + (state.gameFinished ? 1 : 0)) / total) * 100;
    progressBarEl.style.width = `${Math.max(8, Math.min(progress, 100))}%`;
  }

  function updateButtons() {
    const canMove = state.selectedIndex !== null && !state.gameFinished;

    moveLeftBtn.disabled = !canMove || state.selectedIndex === 0;
    moveRightBtn.disabled = !canMove || state.selectedIndex === state.currentLetters.length - 1;
    nextWordBtn.disabled = state.gameFinished || state.answeredCurrent;
    clearSelectionBtn.disabled = state.selectedIndex === null;
    shuffleBtn.disabled = state.gameFinished;
  }

  function reorderArray(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    const moved = state.currentLetters.splice(fromIndex, 1)[0];
    state.currentLetters.splice(toIndex, 0, moved);
  }

  function handleDrop(fromIndex, toIndex) {
    if (state.gameFinished || fromIndex === null || toIndex === null) return;
    reorderArray(fromIndex, toIndex);
    state.selectedIndex = toIndex;
    state.dragIndex = null;
    setFeedback('Tile moved.', 'idle');
    render();
  }

  function getTileIndexFromPoint(x, y) {
    const element = document.elementFromPoint(x, y);
    if (!element) return null;
    const tile = element.closest('.word-card');
    if (!tile) return null;
    return Number(tile.dataset.index);
  }

  function renderTiles() {
    tilesEl.innerHTML = '';

    state.currentLetters.forEach((letter, index) => {
      const button = document.createElement('button');
      button.className = 'word-card';
      button.type = 'button';
      button.draggable = true;
      button.dataset.index = String(index);

      if (index === state.selectedIndex) {
        button.classList.add('selected');
      }

      button.textContent = letter.toUpperCase();
      button.setAttribute('aria-label', `Letter ${letter}, position ${index + 1}`);

      button.addEventListener('click', () => {
        if (state.gameFinished || touchDragging) return;
        state.selectedIndex = index;
        setFeedback(`Selected "${letter.toUpperCase()}". Use arrows or drag to move it.`, 'idle');
        render();
      });

      button.addEventListener('dragstart', () => {
        state.dragIndex = index;
        state.selectedIndex = index;
        button.classList.add('dragging');
      });

      button.addEventListener('dragend', () => {
        button.classList.remove('dragging');
        state.dragIndex = null;
      });

      button.addEventListener('dragover', (event) => {
        event.preventDefault();
      });

      button.addEventListener('drop', (event) => {
        event.preventDefault();
        if (state.dragIndex === null) return;
        handleDrop(state.dragIndex, index);
      });

      button.addEventListener('touchstart', () => {
        if (state.gameFinished) return;
        state.dragIndex = index;
        state.selectedIndex = index;
        touchDragging = false;
      }, { passive: true });

      button.addEventListener('touchmove', (event) => {
        if (state.dragIndex === null || state.gameFinished) return;
        touchDragging = true;
        const touch = event.touches[0];
        const targetIndex = getTileIndexFromPoint(touch.clientX, touch.clientY);

        if (targetIndex !== null && targetIndex !== state.dragIndex) {
          handleDrop(state.dragIndex, targetIndex);
        }
      }, { passive: true });

      button.addEventListener('touchend', () => {
        state.dragIndex = null;
        setTimeout(() => {
          touchDragging = false;
        }, 0);
      });

      tilesEl.appendChild(button);
    });
  }

  function render() {
    renderTiles();
    updateStats();
    updateButtons();
  }

  function loadWord(index) {
    const word = state.words[index];
    state.currentLetters = shuffleWord(word);
    state.selectedIndex = null;
    state.answeredCurrent = false;
    state.dragIndex = null;
    setFeedback('Pick a tile to start.', 'idle');
    render();
  }

  function moveSelected(direction) {
    if (state.selectedIndex === null || state.gameFinished) return;

    const newIndex = direction === 'left'
      ? state.selectedIndex - 1
      : state.selectedIndex + 1;

    if (newIndex < 0 || newIndex >= state.currentLetters.length) return;

    [state.currentLetters[state.selectedIndex], state.currentLetters[newIndex]] = [
      state.currentLetters[newIndex],
      state.currentLetters[state.selectedIndex],
    ];

    state.selectedIndex = newIndex;
    render();
  }

  function checkWord() {
    if (state.gameFinished || state.answeredCurrent) return;

    const guess = state.currentLetters.join('');
    const answer = getCurrentWord();

    if (guess === answer) {
      state.score += 1;
      state.answeredCurrent = true;

      nextWordBtn.classList.remove('mixed-words-incorrect');
      nextWordBtn.classList.add('mixed-words-correct');
      window.setTimeout(() => {
        nextWordBtn.classList.remove('mixed-words-correct');
      }, 320);

      setFeedback(`Correct — ${answer.toUpperCase()}! Loading next word...`, 'success');
      render();

      window.setTimeout(() => {
        if (state.currentIndex < state.words.length - 1) {
          state.currentIndex += 1;
          loadWord(state.currentIndex);
        } else {
          finishGame();
        }
      }, 900);
    } else {
      nextWordBtn.classList.remove('mixed-words-correct');
      nextWordBtn.classList.add('mixed-words-incorrect');
      window.setTimeout(() => {
        nextWordBtn.classList.remove('mixed-words-incorrect');
      }, 320);

      setFeedback(`Not quite. You made "${guess.toUpperCase()}". Try again.`, 'error');
      render();
    }
  }

  function reshuffleCurrent() {
    if (state.gameFinished) return;
    state.currentLetters = shuffleWord(getCurrentWord());
    state.selectedIndex = null;
    setFeedback('Tiles reshuffled.', 'idle');
    render();
  }

  function clearSelection() {
    state.selectedIndex = null;
    setFeedback('Selection cleared.', 'idle');
    render();
  }

  function getAccuracy() {
    const total = state.words.length;
    if (total === 0) return 0;
    return Math.round((state.score / total) * 100);
  }

  function showCompletionModal() {
    const total = state.words.length;
    const accuracy = getAccuracy();

    gameCompleteScoreValue.textContent = String(state.score);
    gameCompleteTotalValue.textContent = String(total);
    gameCompleteAccuracyValue.textContent = `${accuracy}%`;

    if (state.score === total) {
      gameCompleteMessage.textContent = `Amazing — you solved all ${total} words.`;
    } else {
      gameCompleteMessage.textContent = `You solved ${state.score} out of ${total} words.`;
    }

    gameCompleteModal.classList.remove('hidden');
  }

  function hideCompletionModal() {
    gameCompleteModal.classList.add('hidden');
  }

  function finishGame() {
    state.gameFinished = true;
    state.selectedIndex = null;
    progressBarEl.style.width = '100%';
    setFeedback(`Game complete. Final score: ${state.score} out of ${state.words.length}.`, 'success');
    render();
    showCompletionModal();
  }

  function restartGame() {
    hideCompletionModal();
    state.currentIndex = 0;
    state.score = 0;
    state.selectedIndex = null;
    state.answeredCurrent = false;
    state.gameFinished = false;
    state.dragIndex = null;
    loadWord(0);
  }

  function hideCursor() {
    cursorTimers.forEach(clearTimeout);
    cursorTimers = [];
    cursorEl.classList.remove('visible');
  }

  function moveCursor(x, y, cb, delay = 0) {
    const t = setTimeout(() => {
      cursorEl.classList.add('visible');
      cursorEl.style.left = `${x}px`;
      cursorEl.style.top = `${y}px`;

      if (cb) {
        const t2 = setTimeout(cb, 560);
        cursorTimers.push(t2);
      }
    }, delay);

    cursorTimers.push(t);
  }

  function clickAt(x, y, delay = 0, cb) {
    moveCursor(x, y, () => {
      const ripple = document.createElement('div');
      ripple.className = 'cursor-click';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 520);
      if (cb) cb();
    }, delay);
  }

  function centre(el) {
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  function stopTutorialCleanup() {
    if (tutorialCleanup) {
      try {
        tutorialCleanup();
      } catch (error) {}
      tutorialCleanup = null;
    }
    hideCursor();
  }

  function renderTutorialStep() {
    stopTutorialCleanup();

    const step = TUTORIAL_STEPS[tutorialStep];
    const total = TUTORIAL_STEPS.length;

    mwTutStepLabel.textContent = `Step ${tutorialStep + 1} of ${total}`;
    mwTutProgressFill.style.width = `${((tutorialStep + 1) / total) * 100}%`;
    mwTutStepNum.textContent = tutorialStep + 1;
    mwTutStepOf.textContent = `of ${total}`;
    mwTutStepTitle.textContent = step.title;
    mwTutStepBody.textContent = step.body;

    mwTutDots.innerHTML = TUTORIAL_STEPS
      .map((_, i) => `<button class="mw-tut-dot${i === tutorialStep ? ' active' : ''}" type="button" data-step="${i}" aria-label="Go to step ${i + 1}"></button>`)
      .join('');

    mwTutPrevBtn.disabled = tutorialStep === 0;
    mwTutNextBtn.textContent = tutorialStep === TUTORIAL_STEPS.length - 1 ? '✓ Done' : 'Next →';

    mwTutDemo.innerHTML = '';
    const cleanup = step.build(mwTutDemo);
    if (typeof cleanup === 'function') tutorialCleanup = cleanup;

    mwTutDots.querySelectorAll('.mw-tut-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        tutorialStep = Number(dot.dataset.step);
        renderTutorialStep();
      });
    });
  }

  function openHelpModal() {
    helpModal.classList.remove('hidden');
    tutorialStep = 0;
    renderTutorialStep();
  }

  function closeHelpModal() {
    stopTutorialCleanup();
    helpModal.classList.add('hidden');
    mwTutDemo.innerHTML = '';
  }

  const MW_SCRAMBLE = ['P', 'L', 'A', 'P', 'E'];

  function buildMW1(container) {
    container.innerHTML = `
      <div class="mw-demo-scene" style="width:100%;max-width:360px">
        <div class="mw-demo-card">
          <div class="mw-demo-topbar">
            <span class="mw-demo-topbar-title">🔀 Mixed Words</span>
            <span class="mw-demo-topbar-stat">Score: 0 / 6</span>
          </div>
          <div class="mw-demo-content">
            <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:8px">
              <span>Round: 1 / 6</span><span>Target: 5 letters</span>
            </div>
            <div style="height:6px;background:var(--shell-border);border-radius:99px;overflow:hidden;margin-bottom:12px">
              <div style="height:100%;width:8%;background:linear-gradient(90deg,var(--gold-light),var(--gold));border-radius:99px"></div>
            </div>
            <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px">
              ${MW_SCRAMBLE.map((l) => `<div class="alpha-chip" style="font-size:18px;padding:8px 12px;min-width:36px;text-align:center">${l}</div>`).join('')}
            </div>
            <div class="mw-demo-msg">Arrange the letters to spell the correct word.</div>
          </div>
        </div>
      </div>
    `;
  }

  function buildMW2(container) {
    container.innerHTML = `
      <div class="mw-demo-scene" style="width:100%;max-width:360px">
        <div class="mw-demo-card">
          <div class="mw-demo-topbar">
            <span class="mw-demo-topbar-title">🔀 Mixed Words</span>
          </div>
          <div class="mw-demo-content">
            <div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px" id="mw2-tiles"></div>
            <div class="mw-demo-btn-row">
              <div class="tool-btn" id="mw2-left" style="font-size:11px;padding:6px 10px;opacity:.35">← Left</div>
              <div class="tool-btn" id="mw2-right" style="font-size:11px;padding:6px 10px">Right →</div>
            </div>
            <div id="mw2-fb" class="mw-demo-msg">Pick a tile to start.</div>
          </div>
        </div>
      </div>
    `;

    let letters = [...MW_SCRAMBLE];
    let selIdx = null;
    const timers = [];

    function renderMW2() {
      const tilesWrap = document.getElementById('mw2-tiles');
      const leftBtn = document.getElementById('mw2-left');
      const rightBtn = document.getElementById('mw2-right');
      if (!tilesWrap) return;

      tilesWrap.innerHTML = letters.map((l, i) =>
        `<div class="alpha-chip" style="font-size:18px;padding:8px 12px;min-width:36px;text-align:center;${selIdx === i ? 'outline:3px solid var(--gold);outline-offset:2px;' : ''}">${l}</div>`
      ).join('');

      if (leftBtn) leftBtn.style.opacity = (selIdx !== null && selIdx > 0) ? '1' : '.35';
      if (rightBtn) rightBtn.style.opacity = (selIdx !== null && selIdx < letters.length - 1) ? '1' : '.35';
    }

    function doPass() {
      letters = [...MW_SCRAMBLE];
      selIdx = null;
      renderMW2();

      const fb = document.getElementById('mw2-fb');
      if (fb) fb.textContent = 'Pick a tile to start.';

      timers.push(setTimeout(() => {
        const first = document.querySelector('#mw2-tiles .alpha-chip');
        if (!first) return;
        const p = centre(first);
        moveCursor(p.x, p.y, null, 0);
      }, 500));

      timers.push(setTimeout(() => {
        const first = document.querySelector('#mw2-tiles .alpha-chip');
        if (!first) return;
        const p = centre(first);
        clickAt(p.x, p.y, 0, () => {
          selIdx = 0;
          renderMW2();
          if (fb) fb.textContent = 'Selected "P" — use arrows to move it';
        });
      }, 1100));

      timers.push(setTimeout(() => {
        const btn = document.getElementById('mw2-right');
        if (!btn) return;
        const p = centre(btn);
        moveCursor(p.x, p.y, null, 0);
      }, 1900));

      timers.push(setTimeout(() => {
        const btn = document.getElementById('mw2-right');
        if (!btn) return;
        const p = centre(btn);
        clickAt(p.x, p.y, 0, () => {
          if (selIdx !== null && selIdx < letters.length - 1) {
            [letters[selIdx], letters[selIdx + 1]] = [letters[selIdx + 1], letters[selIdx]];
            selIdx += 1;
          }
          renderMW2();
          if (fb) fb.textContent = 'Moved right — keep going!';
        });
      }, 2500));

      timers.push(setTimeout(() => {
        const btn = document.getElementById('mw2-right');
        if (!btn) return;
        const p = centre(btn);
        moveCursor(p.x, p.y, null, 0);
      }, 3200));

      timers.push(setTimeout(() => {
        const btn = document.getElementById('mw2-right');
        if (!btn) return;
        const p = centre(btn);
        clickAt(p.x, p.y, 0, () => {
          if (selIdx !== null && selIdx < letters.length - 1) {
            [letters[selIdx], letters[selIdx + 1]] = [letters[selIdx + 1], letters[selIdx]];
            selIdx += 1;
          }
          renderMW2();
          if (fb) fb.textContent = 'Tile moved — adjust all tiles, then Check Word';
          hideCursor();
        });
      }, 3800));

      timers.push(setTimeout(doPass, 7000));
    }

    timers.push(setTimeout(doPass, 300));
    return () => {
      timers.forEach(clearTimeout);
      hideCursor();
    };
  }

  function buildMW3(container) {
    container.innerHTML = `
      <div class="mw-demo-scene" style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:380px">
        <div class="mw-demo-card">
          <div class="mw-demo-topbar" style="background:var(--green-text)">
            <span class="mw-demo-topbar-title">✅ Correct — next word loads automatically</span>
          </div>
          <div class="mw-demo-content">
            <div class="mw-demo-tiles">
              ${'APPLE'.split('').map(l => `<div class="alpha-chip" style="font-size:18px;padding:8px 12px;min-width:36px;text-align:center;background:var(--green-found);border-color:var(--green-border);color:var(--green-text)">${l}</div>`).join('')}
            </div>
            <div class="mw-demo-msg" style="color:var(--green-text)">Correct — APPLE! Loading next word…</div>
          </div>
        </div>

        <div class="mw-demo-card">
          <div class="mw-demo-topbar" style="background:var(--red-text)">
            <span class="mw-demo-topbar-title">❌ Wrong — Check Word shakes red</span>
          </div>
          <div class="mw-demo-content">
            <div class="mw-demo-tiles" id="mw3-bad-tiles"></div>
            <div class="mw-demo-msg" style="color:var(--red-text)">Not quite. You made "LAPPE". Try again.</div>
            <div class="mw-demo-btn-row">
              <div class="tool-btn" id="mw3-check" style="font-size:11px;padding:6px 10px;background:linear-gradient(180deg,var(--gold-light),var(--gold));border-color:#b07e10">Check Word</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const badTiles = document.getElementById('mw3-bad-tiles');
    'LAPPE'.split('').forEach(l => {
      const d = document.createElement('div');
      d.className = 'alpha-chip';
      d.style.cssText = 'font-size:18px;padding:8px 12px;min-width:36px;text-align:center';
      d.textContent = l;
      badTiles.appendChild(d);
    });

    const timers = [];

    function animCheck() {
      const btn = document.getElementById('mw3-check');
      if (!btn) return;

      timers.push(setTimeout(() => {
        const p = centre(btn);
        moveCursor(p.x, p.y, null, 0);
      }, 400));

      timers.push(setTimeout(() => {
        const p = centre(btn);
        clickAt(p.x, p.y, 0, () => {
          btn.style.background = 'var(--red-bg)';
          btn.style.borderColor = 'var(--red-border)';
          btn.style.animation = 'mixed-words-shake .28s ease';

          setTimeout(() => {
            btn.style.animation = '';
            btn.style.background = 'linear-gradient(180deg,var(--gold-light),var(--gold))';
            btn.style.borderColor = '#b07e10';
          }, 500);

          hideCursor();
        });
      }, 1000));

      timers.push(setTimeout(animCheck, 4500));
    }

    timers.push(setTimeout(animCheck, 500));
    return () => {
      timers.forEach(clearTimeout);
      hideCursor();
    };
  }

  function buildMW4(container) {
    container.innerHTML = `
      <div class="mw-demo-scene mw-result-card">
        <div class="mw-demo-card">
          <div class="mw-demo-topbar">
            <span class="mw-demo-topbar-title">🔀 Game Complete!</span>
          </div>
          <div class="mw-demo-content">
            <div class="mw-score-row">
              <div class="mw-score-box">
                <div class="mw-score-val">1</div>
                <div class="mw-score-lbl">Correct</div>
              </div>
              <div class="mw-score-box">
                <div class="mw-score-val">6</div>
                <div class="mw-score-lbl">Total</div>
              </div>
              <div class="mw-score-box">
                <div class="mw-score-val">17%</div>
                <div class="mw-score-lbl">Accuracy</div>
              </div>
            </div>
            <div class="mw-demo-msg">Accuracy is based on correct answers out of 6 total words.</div>
          </div>
        </div>
      </div>
    `;
  }

  moveLeftBtn.addEventListener('click', () => moveSelected('left'));
  moveRightBtn.addEventListener('click', () => moveSelected('right'));
  nextWordBtn.addEventListener('click', checkWord);
  clearSelectionBtn.addEventListener('click', clearSelection);
  shuffleBtn.addEventListener('click', reshuffleCurrent);
  finishBtn.addEventListener('click', finishGame);

  playAgainBtn.addEventListener('click', restartGame);

  helpBtn.addEventListener('click', openHelpModal);
  helpCloseBtn.addEventListener('click', closeHelpModal);

  mwTutPrevBtn.addEventListener('click', () => {
    if (tutorialStep > 0) {
      tutorialStep -= 1;
      renderTutorialStep();
    }
  });

  mwTutNextBtn.addEventListener('click', () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      tutorialStep += 1;
      renderTutorialStep();
    } else {
      closeHelpModal();
    }
  });

  helpModal.addEventListener('click', (event) => {
    if (event.target === helpModal) {
      closeHelpModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!helpModal.classList.contains('hidden')) {
      if (event.key === 'Escape') closeHelpModal();
      return;
    }

    if (!gameCompleteModal.classList.contains('hidden')) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveSelected('left');
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveSelected('right');
    } else if (event.key === 'Enter') {
      event.preventDefault();
      checkWord();
    } else if (event.key === 'Escape') {
      clearSelection();
    }
  });

  loadWord(0);
})();