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
  const gameCompleteRoundsValue = document.getElementById('gameCompleteRoundsValue');
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

  let tutorialStep = 0;

  const TUTORIAL_STEPS = [
    {
      title: "The Goal",
      body: "Each round shows a scrambled word. Your goal is to rearrange the letters so they spell the correct word.",
      build: buildTutorialStep1
    },
    {
      title: "Select a Letter",
      body: "Click a tile to select it. The selected letter gets highlighted so you always know which one you are moving.",
      build: buildTutorialStep2
    },
    {
      title: "Move the Letter",
      body: "Use the Left and Right buttons, or your keyboard arrow keys, to move the selected tile into a better position.",
      build: buildTutorialStep3
    },
    {
      title: "Check and Finish",
      body: "Press Check Word when you think the letters are correct. At the end, the game shows a results modal with your score.",
      build: buildTutorialStep4
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
    feedbackTextEl.className = 'status-card-text';

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

    const progress = ((state.currentIndex + (state.gameFinished ? 1 : 0)) / state.words.length) * 100;
    progressBarEl.style.width = `${Math.max(8, progress)}%`;
  }

  function updateButtons() {
    const canMove = state.selectedIndex !== null && !state.gameFinished;

    moveLeftBtn.disabled = !canMove || state.selectedIndex === 0;
    moveRightBtn.disabled = !canMove || state.selectedIndex === state.currentLetters.length - 1;
    nextWordBtn.disabled = state.gameFinished;
    clearSelectionBtn.disabled = state.selectedIndex === null;
    shuffleBtn.disabled = state.gameFinished;
  }

  function renderTiles() {
    tilesEl.innerHTML = '';

    state.currentLetters.forEach((letter, index) => {
      const button = document.createElement('button');
      button.className = 'word-card';

      if (index === state.selectedIndex) {
        button.classList.add('selected');
      }

      button.textContent = letter.toUpperCase();
      button.setAttribute('aria-label', `Letter ${letter}, position ${index + 1}`);
      button.type = 'button';

      button.addEventListener('click', () => {
        if (state.gameFinished) return;
        state.selectedIndex = index;
        setFeedback(`Selected "${letter.toUpperCase()}". Use arrows to move it.`, 'idle');
        render();
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
    if (state.gameFinished) return;

    const guess = state.currentLetters.join('');
    const answer = getCurrentWord();

    if (guess === answer) {
      if (!state.answeredCurrent) {
        state.score += 1;
        state.answeredCurrent = true;
      }

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
      setFeedback(`Not quite. You made "${guess.toUpperCase()}". Try again.`, 'error');
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

  function showCompletionModal() {
    gameCompleteScoreValue.textContent = String(state.score);
    gameCompleteRoundsValue.textContent = String(state.words.length);

    if (state.score === state.words.length) {
      gameCompleteMessage.textContent = `Amazing — you solved all ${state.words.length} words.`;
    } else {
      gameCompleteMessage.textContent = `You solved ${state.score} out of ${state.words.length} words.`;
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
    loadWord(0);
  }

  function openHelpModal() {
    helpModal.classList.remove('hidden');
    tutorialStep = 0;
    renderTutorialStep();
  }

  function closeHelpModal() {
    helpModal.classList.add('hidden');
  }

  function renderTutorialStep() {
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
    mwTutNextBtn.textContent = tutorialStep === total - 1 ? '✓ Done' : 'Next →';

    mwTutDemo.innerHTML = '';
    step.build(mwTutDemo);

    mwTutDots.querySelectorAll('.mw-tut-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        tutorialStep = Number(dot.dataset.step);
        renderTutorialStep();
      });
    });
  }

  function buildTutorialStep1(container) {
    container.innerHTML = `
      <div class="mw-demo-scene">
        <div class="mw-demo-card">
          <div class="mw-demo-topbar">
            <span class="mw-demo-topbar-title">Mixed Words</span>
            <span class="mw-demo-topbar-stat">Goal</span>
          </div>
          <div class="mw-demo-content">
            <div class="mw-demo-tiles">
              <div class="mw-demo-tile">A</div>
              <div class="mw-demo-tile">P</div>
              <div class="mw-demo-tile">P</div>
              <div class="mw-demo-tile">L</div>
              <div class="mw-demo-tile">E</div>
            </div>
            <div class="mw-demo-msg">Put the letters in the correct order to form a word.</div>
          </div>
        </div>
      </div>
    `;
  }

  function buildTutorialStep2(container) {
    container.innerHTML = `
      <div class="mw-demo-scene">
        <div class="mw-demo-card">
          <div class="mw-demo-topbar">
            <span class="mw-demo-topbar-title">Select a Tile</span>
          </div>
          <div class="mw-demo-content">
            <div class="mw-demo-tiles">
              <div class="mw-demo-tile">J</div>
              <div class="mw-demo-tile selected">A</div>
              <div class="mw-demo-tile">M</div>
            </div>
            <div class="mw-demo-msg">The selected tile is highlighted.</div>
          </div>
        </div>
      </div>
    `;
  }

  function buildTutorialStep3(container) {
    container.innerHTML = `
      <div class="mw-demo-scene">
        <div class="mw-demo-card">
          <div class="mw-demo-topbar">
            <span class="mw-demo-topbar-title">Move It</span>
          </div>
          <div class="mw-demo-content">
            <div class="mw-demo-tiles">
              <div class="mw-demo-tile">J</div>
              <div class="mw-demo-tile selected">A</div>
              <div class="mw-demo-tile">M</div>
            </div>
            <div class="mw-demo-btn-row">
              <button class="tool-btn" type="button">← Left</button>
              <button class="tool-btn" type="button">Right →</button>
            </div>
            <div class="mw-demo-msg">Move the selected letter until the word is correct.</div>
          </div>
        </div>
      </div>
    `;
  }

  function buildTutorialStep4(container) {
    container.innerHTML = `
      <div class="mw-demo-scene mw-result-card">
        <div class="mw-demo-card">
          <div class="mw-demo-topbar">
            <span class="mw-demo-topbar-title">Game Complete</span>
          </div>
          <div class="mw-demo-content">
            <div class="mw-score-row">
              <div class="mw-score-box">
                <div class="mw-score-val">6</div>
                <div class="mw-score-lbl">Score</div>
              </div>
              <div class="mw-score-box">
                <div class="mw-score-val">6</div>
                <div class="mw-score-lbl">Rounds</div>
              </div>
            </div>
            <div class="mw-demo-msg">You can play again or return to Game Selection.</div>
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

  gameCompleteModal.addEventListener('click', (event) => {
    if (event.target === gameCompleteModal) {
      hideCompletionModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!helpModal.classList.contains('hidden')) {
      if (event.key === 'Escape') closeHelpModal();
      return;
    }

    if (!gameCompleteModal.classList.contains('hidden')) {
      if (event.key === 'Escape') hideCompletionModal();
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