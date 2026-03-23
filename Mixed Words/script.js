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
const closeHelpBtn = document.getElementById('closeHelpBtn');

function shuffleWord(word) {
  if (word.length < 2) return word.split('');

  let chars = word.split('');
  let attempts = 0;

  do {
    for (let i = chars.length - 1; i > 0; i--) {
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
  feedbackTextEl.className = 'feedback-pill';
  feedbackTextEl.classList.add(
    type === 'success'
      ? 'feedback-success'
      : type === 'error'
      ? 'feedback-error'
      : 'feedback-idle'
  );
}

function updateStats() {
  scoreTextEl.textContent = `${state.score} / ${state.words.length}`;
  roundTextEl.textContent = `${Math.min(state.currentIndex + 1, state.words.length)} / ${state.words.length}`;
  const currentWord = getCurrentWord() || '';
  targetLengthEl.textContent = `${currentWord.length} ${currentWord.length === 1 ? 'letter' : 'letters'}`;

  const progress = (state.currentIndex / state.words.length) * 100;
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
    button.className = 'tile';

    if (index === state.selectedIndex) {
      button.classList.add('selected');
    }

    button.textContent = letter;
    button.setAttribute('aria-label', `Letter ${letter}, position ${index + 1}`);

    button.addEventListener('click', () => {
      if (state.gameFinished) return;
      state.selectedIndex = index;
      setFeedback(`Selected “${letter.toUpperCase()}”. Use arrows to move it.`, 'idle');
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
  setFeedback('Pick a tile to start. Press Enter to check your word.', 'idle');
  render();
}

function moveSelected(direction) {
  if (state.selectedIndex === null || state.gameFinished) return;

  const newIndex = direction === 'left' ? state.selectedIndex - 1 : state.selectedIndex + 1;

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
    setFeedback(`Not quite. You made “${guess.toUpperCase()}”. Try again.`, 'error');
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

function finishGame() {
  state.gameFinished = true;
  state.selectedIndex = null;
  progressBarEl.style.width = '100%';
  setFeedback(`Game complete. Final score: ${state.score} out of ${state.words.length}.`, 'success');
  render();
}

moveLeftBtn.addEventListener('click', () => moveSelected('left'));
moveRightBtn.addEventListener('click', () => moveSelected('right'));
nextWordBtn.addEventListener('click', checkWord);
clearSelectionBtn.addEventListener('click', clearSelection);
shuffleBtn.addEventListener('click', reshuffleCurrent);
finishBtn.addEventListener('click', finishGame);

helpBtn.addEventListener('click', () => {
  helpModal.classList.add('open');
  helpModal.setAttribute('aria-hidden', 'false');
});

closeHelpBtn.addEventListener('click', () => {
  helpModal.classList.remove('open');
  helpModal.setAttribute('aria-hidden', 'true');
});

helpModal.addEventListener('click', (event) => {
  if (event.target === helpModal) {
    helpModal.classList.remove('open');
    helpModal.setAttribute('aria-hidden', 'true');
  }
});

document.addEventListener('keydown', (event) => {
  if (helpModal.classList.contains('open') && event.key !== 'Escape') return;

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
    if (helpModal.classList.contains('open')) {
      helpModal.classList.remove('open');
      helpModal.setAttribute('aria-hidden', 'true');
    } else {
      clearSelection();
    }
  }
});

loadWord(0);