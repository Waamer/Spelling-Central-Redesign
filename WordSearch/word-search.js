(function () {
  const GRID_SIZE = 12;
  const DIRECTIONS = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: -1, dc: 0 }
  ];
  const dataSource = window.wordLibraryData || { baseLibraries: [] };

  const boardEl = document.getElementById("wordSearchBoard");
  const wordListEl = document.getElementById("wordList");
  const selectedWordDisplay = document.getElementById("selectedWordDisplay");
  const selectedWordState = document.getElementById("selectedWordState");
  const selectionHint = document.getElementById("selectionHint");
  const statusMessage = document.getElementById("statusMessage");
  const timerValue = document.getElementById("timerValue");
  const progressText = document.getElementById("progressText");
  const progressFill = document.getElementById("progressFill");
  const tryWordBtn = document.getElementById("tryWordBtn");
  const clearSelectionBtn = document.getElementById("clearSelectionBtn");
  const finishBtn = document.getElementById("finishBtn");
  const restartBtn = document.getElementById("restartBtn");
  const gameCompleteModal = document.getElementById("gameCompleteModal");
  const gameCompleteMessage = document.getElementById("gameCompleteMessage");
  const playAgainBtn = document.getElementById("playAgainBtn");

  let board = [];
  let placedWords = [];
  let currentSelection = [];
  let startCell = null;
  let isPointerDown = false;
  let timerId = null;
  let gameStartedAt = 0;
  let elapsedSeconds = 0;
  let statusTimeoutId = null;
  let clearSelectionTimeoutId = null;

  function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function readSelectedList() {
    try {
      const custom = JSON.parse(localStorage.getItem("spellingcentral_selected_list") || "null");
      if (custom && Array.isArray(custom.words) && custom.words.length) return custom;
    } catch (error) {
      // ignore parse errors
    }
    const pool = dataSource.baseLibraries || [];
    if (!pool.length) {
      return {
        title: "Fallback",
        words: ["alpha", "beta", "gamma", "delta", "logic", "focus", "design"]
      };
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function normalizeWord(word) {
    return String(word || "")
      .trim()
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase();
  }

  function choosePuzzleWords(sourceWords) {
    const cleaned = sourceWords
      .map(normalizeWord)
      .filter((word) => word.length >= 3 && word.length <= GRID_SIZE);

    const unique = [];
    const seen = new Set();
    cleaned.forEach((word) => {
      if (!seen.has(word)) {
        seen.add(word);
        unique.push(word);
      }
    });

    const shuffled = shuffle(unique);
    const preferred = shuffled.slice(0, 7);
    if (preferred.length >= 5) return preferred;

    const fallbackPool = ["PUZZLE", "LETTER", "SEARCH", "BOARD", "GRID", "TRACE", "FOUND"];
    fallbackPool.forEach((word) => {
      if (preferred.length < 7 && !preferred.includes(word)) preferred.push(word);
    });
    return preferred;
  }

  function createEmptyBoard() {
    return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => ""));
  }

  function canPlaceWord(grid, word, row, col, direction) {
    for (let i = 0; i < word.length; i += 1) {
      const r = row + direction.dr * i;
      const c = col + direction.dc * i;
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
      const existing = grid[r][c];
      if (existing && existing !== word[i]) return false;
    }
    return true;
  }

  function placeWord(grid, word) {
    const attempts = 300;
    const directions = shuffle(DIRECTIONS);

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const direction = directions[attempt % directions.length];
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (!canPlaceWord(grid, word, row, col, direction)) continue;

      const cells = [];
      for (let i = 0; i < word.length; i += 1) {
        const r = row + direction.dr * i;
        const c = col + direction.dc * i;
        grid[r][c] = word[i];
        cells.push({ row: r, col: c });
      }
      return { word, cells, found: false };
    }
    return null;
  }

  function fillBoard(grid) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        if (!grid[row][col]) {
          grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }
  }

  function buildPuzzle() {
    const selectedList = readSelectedList();
    const chosenWords = choosePuzzleWords(selectedList.words || []);
    let grid = createEmptyBoard();
    let placements = [];
    let success = false;

    for (let tries = 0; tries < 40 && !success; tries += 1) {
      grid = createEmptyBoard();
      placements = [];
      success = true;
      const ordered = shuffle(chosenWords).sort((a, b) => b.length - a.length);
      for (const word of ordered) {
        const placed = placeWord(grid, word);
        if (!placed) {
          success = false;
          break;
        }
        placements.push(placed);
      }
    }

    if (!success) {
      placements = chosenWords.slice(0, 5).map((word, index) => {
        const row = index * 2;
        const cells = [];
        for (let col = 0; col < word.length; col += 1) {
          grid[row][col] = word[col];
          cells.push({ row, col });
        }
        return { word, cells, found: false };
      });
    }

    fillBoard(grid);
    return { grid, placements, title: selectedList.title || "Word List" };
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function startTimer() {
    stopTimer();
    gameStartedAt = Date.now();
    elapsedSeconds = 0;
    timerValue.textContent = formatTime(0);
    timerId = window.setInterval(() => {
      elapsedSeconds = Math.floor((Date.now() - gameStartedAt) / 1000);
      timerValue.textContent = formatTime(elapsedSeconds);
    }, 250);
  }

  function stopTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function clearPendingTimers() {
    if (statusTimeoutId) {
      window.clearTimeout(statusTimeoutId);
      statusTimeoutId = null;
    }
    if (clearSelectionTimeoutId) {
      window.clearTimeout(clearSelectionTimeoutId);
      clearSelectionTimeoutId = null;
    }
  }

  function setStatus(message, options) {
    const settings = options || {};
    statusMessage.textContent = message;
    if (settings.resetAfterMs) {
      if (statusTimeoutId) window.clearTimeout(statusTimeoutId);
      statusTimeoutId = window.setTimeout(() => {
        statusMessage.textContent = currentSelection.length
          ? "Selection ready."
          : "Keep going, find the hidden words.";
      }, settings.resetAfterMs);
    }
  }

  function cellKey(cell) {
    return `${cell.row},${cell.col}`;
  }

  function sameCellPath(a, b) {
    if (a.length !== b.length) return false;
    const forward = a.every((cell, index) => cell.row === b[index].row && cell.col === b[index].col);
    const backward = a.every((cell, index) => {
      const other = b[b.length - 1 - index];
      return cell.row === other.row && cell.col === other.col;
    });
    return forward || backward;
  }

  function getSelectionText() {
    return currentSelection.map(({ row, col }) => board[row][col]).join("");
  }

function getMatchedSelection() {
  if (!currentSelection.length) return null;

  const selectedWord = getSelectionText();

  return placedWords.find((entry) => {
    if (entry.found) return false;

    const textMatches = entry.word === selectedWord;

    const exactPathMatches =
      entry.cells.length === currentSelection.length &&
      entry.cells.every((cell, index) =>
        cell.row === currentSelection[index].row &&
        cell.col === currentSelection[index].col
      );

    return textMatches && exactPathMatches;
  }) || null;
}

  function setButtonEnabled(button, enabled) {
    button.disabled = !enabled;
    button.classList.toggle("tool-disabled", !enabled);
  }

  function updateControls() {
    const hasSelection = currentSelection.length > 0;
    setButtonEnabled(clearSelectionBtn, hasSelection);
    setButtonEnabled(tryWordBtn, hasSelection);
  }

  function updateSelectedDisplay() {
    const text = currentSelection.length ? getSelectionText() : "|";
    const matched = getMatchedSelection();

    selectedWordDisplay.textContent = text;
    selectedWordDisplay.classList.toggle("is-ready", !!matched);

    selectionHint.textContent = currentSelection.length ? "Release when done" : "Start selecting";

    selectedWordState.classList.remove("is-ready", "is-warning", "is-error");
    if (!currentSelection.length) {
      selectedWordState.textContent = "Select letters to build a word.";
    } else if (matched) {
      selectedWordState.textContent = `Ready to try: ${matched.word}`;
      selectedWordState.classList.add("is-ready");
    } else {
      selectedWordState.textContent = "This selection is not a listed word yet.";
      selectedWordState.classList.add("is-warning");
    }

    updateControls();
  }

  function clearSelection(options) {
    const settings = options || {};
    currentSelection = [];
    startCell = null;
    renderBoard();
    updateSelectedDisplay();
    if (!settings.silentStatus) {
      setStatus("Selection cleared.");
    }
  }

  function normalizeStep(delta) {
    if (delta === 0) return 0;
    return delta > 0 ? 1 : -1;
  }

  function buildLine(start, end) {
    const rowDelta = end.row - start.row;
    const colDelta = end.col - start.col;

    if (rowDelta !== 0 && colDelta !== 0) return null;

    const stepRow = normalizeStep(rowDelta);
    const stepCol = normalizeStep(colDelta);
    const length = Math.max(Math.abs(rowDelta), Math.abs(colDelta)) + 1;
    const cells = [];

    for (let i = 0; i < length; i += 1) {
      cells.push({ row: start.row + stepRow * i, col: start.col + stepCol * i });
    }

    return cells;
  }

  function showIncorrectFeedback(selectedWord) {
    tryWordBtn.classList.add("word-search-incorrect");
    selectedWordState.textContent = `“${selectedWord}” is not one of the hidden words.`;
    selectedWordState.classList.remove("is-ready", "is-warning");
    selectedWordState.classList.add("is-error");
    setStatus("That guess was incorrect.", { resetAfterMs: 1200 });

    window.setTimeout(() => {
      tryWordBtn.classList.remove("word-search-incorrect");
    }, 320);

    if (clearSelectionTimeoutId) window.clearTimeout(clearSelectionTimeoutId);
    clearSelectionTimeoutId = window.setTimeout(() => {
      clearSelection({ silentStatus: true });
      setStatus("Try another line of letters.");
    }, 1000);
  }

  function tryCurrentSelection() {
    if (tryWordBtn.disabled) return;

    const matched = getMatchedSelection();
    const selectedWord = getSelectionText();

    if (!matched) {
      showIncorrectFeedback(selectedWord);
      return;
    }

matched.found = true;

tryWordBtn.classList.add("word-search-correct");
window.setTimeout(() => {
  tryWordBtn.classList.remove("word-search-correct");
}, 320);

setStatus(`Found ${matched.word}. Nice job.`);
clearSelection({ silentStatus: true });
renderWordList();
renderBoard();

    if (placedWords.every((word) => word.found)) {
      finishGame(true);
    }
  }

  function renderBoard() {
    const selectedKeys = new Set(currentSelection.map(cellKey));
    const foundKeys = new Set(
      placedWords
        .filter((item) => item.found)
        .flatMap((item) => item.cells.map(cellKey))
    );

    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "word-search-cell";
        button.textContent = board[row][col];
        button.dataset.row = String(row);
        button.dataset.col = String(col);
        button.setAttribute("role", "gridcell");
        button.setAttribute("aria-label", `Row ${row + 1} column ${col + 1}: ${board[row][col]}`);
        const key = cellKey({ row, col });
        if (selectedKeys.has(key)) button.classList.add("is-selected");
        if (foundKeys.has(key)) button.classList.add("is-found");
        boardEl.appendChild(button);
      }
    }
  }

  function renderWordList() {
    wordListEl.innerHTML = "";
    const foundCount = placedWords.filter((item) => item.found).length;
    progressText.textContent = `${foundCount} / ${placedWords.length}`;
    progressFill.style.width = `${placedWords.length ? (foundCount / placedWords.length) * 100 : 0}%`;

    placedWords
      .slice()
      .sort((a, b) => a.word.localeCompare(b.word))
      .forEach((item) => {
        const li = document.createElement("li");
        li.className = "word-search-word-item";
        if (item.found) li.classList.add("is-found");

        const label = document.createElement("span");
        label.textContent = item.word;

        const state = document.createElement("span");
        state.className = "word-search-word-check";
        state.textContent = item.found ? "✓" : "";
        state.setAttribute("aria-hidden", "true");

        li.appendChild(label);
        li.appendChild(state);
        wordListEl.appendChild(li);
      });
  }

  function getCellFromTarget(target) {
    const button = target.closest(".word-search-cell");
    if (!button) return null;
    return {
      row: Number(button.dataset.row),
      col: Number(button.dataset.col)
    };
  }

  function updateSelectionFromPointer(target) {
    const cell = getCellFromTarget(target);
    if (!cell || !startCell) return;
    const line = buildLine(startCell, cell);
    if (!line) {
      setStatus("Keep dragging in one row or column.");
      return;
    }
    currentSelection = line;
    renderBoard();
    updateSelectedDisplay();
  }

  function beginSelection(target) {
    const cell = getCellFromTarget(target);
    if (!cell) return;
    clearPendingTimers();
    isPointerDown = true;
    startCell = cell;
    currentSelection = [cell];
    renderBoard();
    updateSelectedDisplay();
    setStatus("Keep dragging across letters.");
  }

  function endSelection() {
    if (!isPointerDown) return;
    isPointerDown = false;
    startCell = null;
    if (currentSelection.length) {
      setStatus("Selection ready.");
    }
  }

  function showCompletionModal(message) {
    gameCompleteMessage.textContent = message;
    gameCompleteModal.classList.remove("hidden");
  }

  function hideCompletionModal() {
    gameCompleteModal.classList.add("hidden");
  }

  function finishGame(completedAll) {
    stopTimer();
    const foundCount = placedWords.filter((item) => item.found).length;
    const message = completedAll
      ? `You found all ${placedWords.length} words in ${formatTime(elapsedSeconds)}.`
      : `You found ${foundCount} of ${placedWords.length} words in ${formatTime(elapsedSeconds)}.`;
    showCompletionModal(message);
  }

  function restartGame() {
    clearPendingTimers();
    hideCompletionModal();
    const puzzle = buildPuzzle();
    board = puzzle.grid;
    placedWords = puzzle.placements;
    currentSelection = [];
    startCell = null;
    isPointerDown = false;
    renderBoard();
    renderWordList();
    updateSelectedDisplay();
    setStatus(`Puzzle ready. Hidden words come from “${puzzle.title}.”`);
    startTimer();
  }

  boardEl.addEventListener("pointerdown", (event) => {
    beginSelection(event.target);
  });

  boardEl.addEventListener("pointermove", (event) => {
    if (!isPointerDown) return;
    updateSelectionFromPointer(event.target);
  });

  boardEl.addEventListener("pointerup", endSelection);
  boardEl.addEventListener("pointerleave", (event) => {
    if (!isPointerDown) return;
    const nextTarget = document.elementFromPoint(event.clientX, event.clientY);
    if (boardEl.contains(nextTarget)) return;
    endSelection();
  });

  document.addEventListener("pointerup", endSelection);

  restartBtn.addEventListener("click", restartGame);
  tryWordBtn.addEventListener("click", tryCurrentSelection);
  clearSelectionBtn.addEventListener("click", () => clearSelection());
  finishBtn.addEventListener("click", () => finishGame(false));
  playAgainBtn.addEventListener("click", restartGame);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!gameCompleteModal.classList.contains("hidden")) {
        hideCompletionModal();
        return;
      }
      if (!clearSelectionBtn.disabled) {
        clearSelection();
      }
      return;
    }

    if (event.key === "Enter") {
      if (tryWordBtn.disabled) return;
      event.preventDefault();
      tryCurrentSelection();
    }
  });

  restartGame();
})();
