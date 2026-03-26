(function () {
  "use strict";

  /* =========================================================
     Main Word Search game logic
     Tutorial popup logic below includes adapted pieces from
     Ankan's tutorial system, trimmed to Word Search only
     ========================================================= */

  /* =========================
     Constants / config
     ========================= */
  const GRID_SIZE = 12;
  const DIRECTIONS = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: -1, dc: 0 }
  ];

  const dataSource = window.wordLibraryData || { baseLibraries: [] };

  /* Tutorial demo data adapted from Ankan's tutorial implementation */
  const WS_TUTORIAL_STEPS = [
    {
      title: "The Goal",
      body: "A letter grid hides words from your selected list. Find every hidden word to finish the puzzle. Words go left-to-right or top-to-bottom.",
      build: buildWSTutorial1
    },
    {
      title: "Select a Word",
      body: "Click and drag in one straight row or column. The Selected Letters panel updates live. When the word is right, Try Word becomes the next step.",
      build: buildWSTutorial2
    },
    {
      title: "Correct vs Wrong",
      body: "Correct selections turn green and get checked off. Wrong selections make Try Word flash red, then the highlighted letters clear automatically.",
      build: buildWSTutorial3
    },
    {
      title: "Finish the Game",
      body: "Find all the words or press Finish Game early. The game then shows how many words you found and how long you took.",
      build: buildWSTutorial4
    }
  ];

  const WS_TUTORIAL_GRID = [
    "A", "P", "P", "L", "E", "K",
    "B", "M", "Q", "R", "S", "N",
    "C", "A", "K", "E", "T", "I",
    "D", "G", "H", "J", "U", "F",
    "P", "L", "A", "T", "E", "E",
    "V", "W", "X", "Y", "Z", "O"
  ];

  const WS_TUTORIAL_WORDS = [
    { word: "APPLE", cells: [0, 1, 2, 3, 4] },
    { word: "KNIFE", cells: [5, 11, 17, 23, 29] },
    { word: "CAKE", cells: [12, 13, 14, 15] },
    { word: "PLATE", cells: [24, 25, 26, 27, 28] }
  ];

  /* =========================
     DOM
     ========================= */
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
  const gameCompleteFoundValue = document.getElementById("gameCompleteFoundValue");
  const gameCompleteTimeValue = document.getElementById("gameCompleteTimeValue");
  const playAgainBtn = document.getElementById("playAgainBtn");

  const helpBtn = document.getElementById("helpBtn");
  const helpModal = document.getElementById("helpModal");
  const helpCloseBtn = document.getElementById("helpCloseBtn");

  const wsTutStepLabel = document.getElementById("wsTutStepLabel");
  const wsTutProgressFill = document.getElementById("wsTutProgressFill");
  const wsTutStepNum = document.getElementById("wsTutStepNum");
  const wsTutStepOf = document.getElementById("wsTutStepOf");
  const wsTutStepTitle = document.getElementById("wsTutStepTitle");
  const wsTutStepBody = document.getElementById("wsTutStepBody");
  const wsTutDemo = document.getElementById("wsTutDemo");
  const wsTutDots = document.getElementById("wsTutDots");
  const wsTutPrevBtn = document.getElementById("wsTutPrevBtn");
  const wsTutNextBtn = document.getElementById("wsTutNextBtn");
  const cursorEl = document.getElementById("cursor");

  /* =========================
     State
     ========================= */
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

  let wsTutStep = 0;
  let wsTutCleanup = null;
  let cursorTimers = [];

  /* =========================
     Utility
     ========================= */
  function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function normalizeWord(word) {
    return String(word || "")
      .trim()
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase();
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function cellKey(cell) {
    return `${cell.row},${cell.col}`;
  }

  function normalizeStep(delta) {
    if (delta === 0) return 0;
    return delta > 0 ? 1 : -1;
  }

  /* =========================
     Puzzle generation
     ========================= */
  function readSelectedList() {
    try {
      const custom = JSON.parse(localStorage.getItem("spellingcentral_selected_list") || "null");
      if (custom && Array.isArray(custom.words) && custom.words.length) return custom;
    } catch (error) {
      /* ignore parse error */
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

    const preferred = shuffle(unique).slice(0, 7);
    if (preferred.length >= 5) return preferred;

    const fallbackPool = ["PUZZLE", "LETTER", "SEARCH", "BOARD", "GRID", "TRACE", "FOUND"];
    fallbackPool.forEach((word) => {
      if (preferred.length < 7 && !preferred.includes(word)) preferred.push(word);
    });

    return preferred;
  }

  function createEmptyBoard() {
    return Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => "")
    );
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

  /* =========================
     Timer / status
     ========================= */
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

  /* =========================
     Selection / controls
     ========================= */
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

  function buildLine(start, end) {
    const rowDelta = end.row - start.row;
    const colDelta = end.col - start.col;

    if (rowDelta !== 0 && colDelta !== 0) return null;

    const stepRow = normalizeStep(rowDelta);
    const stepCol = normalizeStep(colDelta);
    const length = Math.max(Math.abs(rowDelta), Math.abs(colDelta)) + 1;
    const cells = [];

    for (let i = 0; i < length; i += 1) {
      cells.push({
        row: start.row + stepRow * i,
        col: start.col + stepCol * i
      });
    }

    return cells;
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

  /* =========================
     Rendering
     ========================= */
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

  /* =========================
     Pointer interaction
     ========================= */
  function getCellFromTarget(target) {
    const button = target.closest(".word-search-cell");
    if (!button) return null;

    return {
      row: Number(button.dataset.row),
      col: Number(button.dataset.col)
    };
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

  function endSelection() {
    if (!isPointerDown) return;

    isPointerDown = false;
    startCell = null;

    if (currentSelection.length) {
      setStatus("Selection ready.");
    }
  }

  /* =========================
     Finish modal
     ========================= */
  function showCompletionModal(message, foundCount) {
    gameCompleteMessage.textContent = message;
    gameCompleteFoundValue.textContent = String(foundCount);
    gameCompleteTimeValue.textContent = formatTime(elapsedSeconds);
    gameCompleteModal.classList.remove("hidden", "is-closing");
  }

  function hideCompletionModal() {
    if (gameCompleteModal.classList.contains("hidden") || gameCompleteModal.classList.contains("is-closing")) return;

    gameCompleteModal.classList.add("is-closing");

    window.setTimeout(() => {
      gameCompleteModal.classList.add("hidden");
      gameCompleteModal.classList.remove("is-closing");
    }, 200);
  }

  function finishGame(completedAll) {
    stopTimer();

    const foundCount = placedWords.filter((item) => item.found).length;
    const message = completedAll
      ? `You found all ${placedWords.length} words.`
      : `You found ${foundCount} of ${placedWords.length} words.`;

    showCompletionModal(message, foundCount);
  }

  /* =========================================================
     Tutorial cursor system
     Adapted from Ankan's tutorial JS
     ========================================================= */
  function hideCursor() {
    cursorTimers.forEach(clearTimeout);
    cursorTimers = [];
    cursorEl.classList.remove("visible");
  }

  function moveCursor(x, y, cb, delay = 0) {
    const t = setTimeout(() => {
      cursorEl.classList.add("visible");
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
      const ripple = document.createElement("div");
      ripple.className = "cursor-click";
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

  /* =========================================================
     Tutorial popup engine
     Adapted from Ankan's tutorial JS and reduced to the
     Word Search help popup only
     ========================================================= */
  function stopWSTutorialCleanup() {
    if (wsTutCleanup) {
      try {
        wsTutCleanup();
      } catch (error) {
        /* ignore cleanup error */
      }
      wsTutCleanup = null;
    }
    hideCursor();
  }

  function renderWSTutorialStep() {
    stopWSTutorialCleanup();

    const step = WS_TUTORIAL_STEPS[wsTutStep];
    const total = WS_TUTORIAL_STEPS.length;

    wsTutStepLabel.textContent = `Step ${wsTutStep + 1} of ${total}`;
    wsTutProgressFill.style.width = `${((wsTutStep + 1) / total) * 100}%`;
    wsTutStepNum.textContent = wsTutStep + 1;
    wsTutStepOf.textContent = `of ${total}`;
    wsTutStepTitle.textContent = step.title;
    wsTutStepBody.textContent = step.body;

    wsTutDots.innerHTML = WS_TUTORIAL_STEPS
      .map((_, i) =>
        `<button class="ws-tut-dot${i === wsTutStep ? " active" : ""}" type="button" data-step="${i}" aria-label="Go to step ${i + 1}"></button>`
      )
      .join("");

    wsTutPrevBtn.disabled = wsTutStep === 0;
    wsTutNextBtn.textContent = wsTutStep === total - 1 ? "✓ Done" : "Next →";

    wsTutDemo.innerHTML = "";
    const cleanup = step.build(wsTutDemo);
    if (typeof cleanup === "function") {
      wsTutCleanup = cleanup;
    }

    wsTutDots.querySelectorAll(".ws-tut-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        wsTutStep = Number(dot.dataset.step);
        renderWSTutorialStep();
      });
    });
  }

  function openHelpModal() {
    helpModal.classList.remove("hidden", "is-closing");
    wsTutStep = 0;
    renderWSTutorialStep();
  }

  function closeHelpModal() {
    if (helpModal.classList.contains("hidden") || helpModal.classList.contains("is-closing")) return;

    stopWSTutorialCleanup();
    helpModal.classList.add("is-closing");

    window.setTimeout(() => {
      helpModal.classList.add("hidden");
      helpModal.classList.remove("is-closing");
      wsTutDemo.innerHTML = "";
    }, 200);
  }

  /* =========================================================
     Tutorial popup demo builders
     Mostly adapted from Ankan's original tutorial demo code,
     then tightened to match this page's popup layout
     ========================================================= */
  function makeWSGrid(id, cols = 6) {
    return `<div class="ws-grid" id="${id}" style="grid-template-columns:repeat(${cols},26px)"></div>`;
  }

  function populateWSGrid(id) {
    const grid = document.getElementById(id);
    if (!grid) return;

    grid.innerHTML = WS_TUTORIAL_GRID
      .map((letter, i) => `<div class="ws-cell" id="${id}c${i}">${letter}</div>`)
      .join("");
  }

  function wsCellEl(gridId, index) {
    return document.getElementById(`${gridId}c${index}`);
  }

  function buildWSTutorial1(container) {
    container.innerHTML = `
      <div class="ws-demo-scene">
        <div class="ws-demo-layout">
          <div class="ws-demo-screen ws-demo-board-card">
            <div class="ws-demo-topbar">
              <span class="ws-demo-topbar-title">Word Search</span>
              <span class="ws-demo-topbar-stat">0 / 4</span>
            </div>
            <div class="ws-demo-content">${makeWSGrid("wst1")}</div>
          </div>

          <div class="ws-demo-screen ws-demo-side-card">
            <div class="ws-demo-topbar">
              <span class="ws-demo-topbar-title">Word List</span>
            </div>
            <div class="ws-demo-content">
              <div class="ws-wordlist">
                ${WS_TUTORIAL_WORDS.map((w) => `<div class="ws-wchip" id="wst1chip${w.word}">${w.word}</div>`).join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    populateWSGrid("wst1");
    const timers = [];

    WS_TUTORIAL_WORDS.forEach((w, index) => {
      timers.push(setTimeout(() => {
        w.cells.forEach((cellIndex) => wsCellEl("wst1", cellIndex)?.classList.add("hl"));
      }, index * 1400 + 300));

      timers.push(setTimeout(() => {
        w.cells.forEach((cellIndex) => {
          const el = wsCellEl("wst1", cellIndex);
          if (el) {
            el.classList.remove("hl");
            el.classList.add("found");
          }
        });

        document.getElementById(`wst1chip${w.word}`)?.classList.add("done");
        const stat = container.querySelector(".ws-demo-topbar-stat");
        if (stat) stat.textContent = `${index + 1} / 4`;
      }, index * 1400 + 900));
    });

    return () => timers.forEach(clearTimeout);
  }

  function buildWSTutorial2(container) {
    container.innerHTML = `
      <div class="ws-demo-scene">
        <div class="ws-demo-layout">
          <div class="ws-demo-screen ws-demo-board-card">
            <div class="ws-demo-topbar">
              <span class="ws-demo-topbar-title">Word Search</span>
            </div>
            <div class="ws-demo-content">${makeWSGrid("wst2")}</div>
          </div>

          <div class="ws-demo-screen ws-demo-side-card">
            <div class="ws-demo-content">
              <div class="ws-mini-label">Selected Letters</div>
              <div id="wst2Display" class="ws-mini-display">|</div>
              <div id="wst2State" class="ws-mini-state">Select letters to build a word.</div>
              <button id="wst2Try" class="tool-btn ws-mini-btn dim" type="button" disabled>Try Word</button>
              <button id="wst2Clear" class="tool-btn ws-mini-btn dim" type="button" disabled>Clear Selection</button>
              <div id="wst2Msg" class="ws-mini-msg"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    populateWSGrid("wst2");
    const timers = [];

    function setMiniBtnEnabled(button, enabled) {
      if (!button) return;
      button.disabled = !enabled;
      button.classList.toggle("dim", !enabled);
    }

    function doPass() {
      WS_TUTORIAL_GRID.forEach((_, i) => {
        const el = wsCellEl("wst2", i);
        if (el) el.classList.remove("hl", "found");
      });

      const display = document.getElementById("wst2Display");
      const state = document.getElementById("wst2State");
      const tryBtn = document.getElementById("wst2Try");
      const clearBtn = document.getElementById("wst2Clear");
      const msg = document.getElementById("wst2Msg");
      const cells = WS_TUTORIAL_WORDS[0].cells;
      const word = "APPLE";

      display.textContent = "|";
      display.style.borderColor = "";
      display.style.background = "#fbf7ec";

      state.textContent = "Select letters to build a word.";
      state.style.color = "#486657";

      msg.textContent = "";

      tryBtn.style.background = "";
      tryBtn.style.borderColor = "";
      tryBtn.style.color = "";
      tryBtn.style.animation = "";

      clearBtn.style.background = "";
      clearBtn.style.borderColor = "";
      clearBtn.style.color = "";

      setMiniBtnEnabled(tryBtn, false);
      setMiniBtnEnabled(clearBtn, false);

      timers.push(setTimeout(() => {
        const el = wsCellEl("wst2", cells[0]);
        if (!el) return;
        const p = centre(el);
        moveCursor(p.x, p.y, null, 0);
      }, 400));

      timers.push(setTimeout(() => {
        const el = wsCellEl("wst2", cells[0]);
        if (!el) return;

        const p = centre(el);
        const ripple = document.createElement("div");
        ripple.className = "cursor-click";
        ripple.style.left = `${p.x}px`;
        ripple.style.top = `${p.y}px`;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 520);

        el.classList.add("hl");
        display.textContent = "A";
        setMiniBtnEnabled(tryBtn, true);
        setMiniBtnEnabled(clearBtn, true);

        state.textContent = "Holding — drag across…";
        msg.textContent = "Click & hold first letter";
      }, 1000));

      ["P", "PP", "PPL", "APPLE"].forEach((_, index) => {
        timers.push(setTimeout(() => {
          const el = wsCellEl("wst2", cells[index + 1]);
          if (!el) return;

          const p = centre(el);
          moveCursor(p.x, p.y, null, 0);
          el.classList.add("hl");
          display.textContent = word.slice(0, index + 2);
        }, 1450 + index * 300));
      });

      timers.push(setTimeout(() => {
        display.style.borderColor = "#87a47a";
        display.style.background = "#eef5e8";
        state.textContent = "Ready to try: APPLE";
        state.style.color = "#3f6b43";
        msg.textContent = "Release & click Try Word";
      }, 2700));

      timers.push(setTimeout(() => {
        const p = centre(tryBtn);
        moveCursor(p.x, p.y, null, 0);
      }, 3250));

      timers.push(setTimeout(() => {
        const p = centre(tryBtn);
        clickAt(p.x, p.y, 0, () => {
          tryBtn.style.background = "#dce8d5";
          tryBtn.style.borderColor = "#87a47a";
          tryBtn.style.color = "#3f6b43";
          tryBtn.style.animation = "word-search-shake .28s ease";

          setTimeout(() => {
            tryBtn.style.animation = "";
          }, 320);

          cells.forEach((cellIndex) => {
            const el = wsCellEl("wst2", cellIndex);
            if (el) {
              el.classList.remove("hl");
              el.classList.add("found");
            }
          });

          display.textContent = "APPLE";
          state.textContent = "✅ Found: APPLE";
          state.style.color = "#3f6b43";
          msg.textContent = "Word found!";
          hideCursor();
        });
      }, 3900));

      timers.push(setTimeout(doPass, 6900));
    }

    timers.push(setTimeout(doPass, 250));
    return () => {
      timers.forEach(clearTimeout);
      hideCursor();
    };
  }

  function buildWSTutorial3(container) {
    container.innerHTML = `
      <div class="ws-demo-scene" style="max-width:440px;">
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div class="ws-demo-screen">
            <div class="ws-demo-topbar" style="background:#3f6b43;">
              <span class="ws-demo-topbar-title">✅ Correct</span>
            </div>
            <div class="ws-demo-content" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <div style="display:flex;gap:3px;" id="wst3ok"></div>
              <div class="ws-wchip done">CAKE ✓</div>
              <button class="tool-btn ws-mini-btn" type="button" style="width:auto;margin-top:0;background:#dce8d5;border-color:#87a47a;color:#3f6b43;">Try Word</button>
            </div>
          </div>

          <div class="ws-demo-screen">
            <div class="ws-demo-topbar" style="background:#7c2e25;">
              <span class="ws-demo-topbar-title">❌ Wrong</span>
            </div>
            <div class="ws-demo-content">
              <div style="display:flex;gap:3px;margin-bottom:8px;" id="wst3bad"></div>
              <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;">
                <button id="wst3BadBtn" class="tool-btn ws-mini-btn" type="button" style="width:auto;margin-top:0;">Try Word</button>
                <button class="tool-btn ws-mini-btn" type="button" style="width:auto;margin-top:0;">Clear Selection</button>
              </div>
              <div id="wst3BadState" class="ws-mini-state" style="margin-top:6px;min-height:16px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const okDiv = document.getElementById("wst3ok");
    "CAKE".split("").forEach((letter) => {
      const cell = document.createElement("div");
      cell.className = "ws-cell found";
      cell.textContent = letter;
      okDiv.appendChild(cell);
    });

    const timers = [];

    function animWrong() {
      const bad = document.getElementById("wst3bad");
      const badBtn = document.getElementById("wst3BadBtn");
      const stateEl = document.getElementById("wst3BadState");
      if (!bad || !badBtn) return;

      bad.innerHTML = "";
      "XPQ".split("").forEach((letter) => {
        const cell = document.createElement("div");
        cell.className = "ws-cell hl";
        cell.textContent = letter;
        bad.appendChild(cell);
      });

      badBtn.style.background = "";
      badBtn.style.borderColor = "";
      badBtn.style.color = "";
      badBtn.style.animation = "";

      stateEl.textContent = "";
      stateEl.style.color = "#486657";

      timers.push(setTimeout(() => {
        const p = centre(badBtn);
        moveCursor(p.x, p.y, null, 0);
      }, 400));

      timers.push(setTimeout(() => {
        const p = centre(badBtn);
        clickAt(p.x, p.y, 0, () => {
          badBtn.style.background = "#f6ddd8";
          badBtn.style.borderColor = "#c56558";
          badBtn.style.color = "#7c2e25";
          badBtn.style.animation = "word-search-shake .28s ease";
          stateEl.textContent = "\"XPQ\" is not one of the hidden words.";
          stateEl.style.color = "#7c2e25";
        });
      }, 1000));

      timers.push(setTimeout(() => {
        badBtn.style.animation = "";
      }, 1450));

      timers.push(setTimeout(() => {
        bad.querySelectorAll(".ws-cell").forEach((cell) => cell.classList.remove("hl"));
        badBtn.style.background = "";
        badBtn.style.borderColor = "";
        badBtn.style.color = "";
        stateEl.textContent = "Selection cleared automatically. Try again.";
        stateEl.style.color = "#486657";
        hideCursor();
      }, 2300));

      timers.push(setTimeout(animWrong, 5000));
    }

    timers.push(setTimeout(animWrong, 350));
    return () => {
      timers.forEach(clearTimeout);
      hideCursor();
    };
  }

  function buildWSTutorial4(container) {
    container.innerHTML = `
      <div class="ws-demo-scene ws-result-card">
        <div class="ws-demo-screen">
          <div class="ws-demo-topbar">
            <span class="ws-demo-topbar-title">Puzzle Complete</span>
          </div>
          <div class="ws-demo-content" style="padding:16px 12px;">
            <div class="ws-result-emoji">🏆</div>
            <div class="ws-result-title">You found all 4 words.</div>
            <div class="ws-score-row">
              <div class="ws-score-box">
                <div class="ws-score-val" style="color:#3f6b43;">4</div>
                <div class="ws-score-lbl">Found</div>
              </div>
              <div class="ws-score-box">
                <div class="ws-score-val">00:42</div>
                <div class="ws-score-lbl">Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    return null;
  }

  /* =========================
     Game lifecycle
     ========================= */
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

  /* =========================
     Events
     ========================= */
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

  helpBtn.addEventListener("click", openHelpModal);
  helpCloseBtn.addEventListener("click", closeHelpModal);

  wsTutPrevBtn.addEventListener("click", () => {
    if (wsTutStep > 0) {
      wsTutStep -= 1;
      renderWSTutorialStep();
    }
  });

  wsTutNextBtn.addEventListener("click", () => {
    if (wsTutStep < WS_TUTORIAL_STEPS.length - 1) {
      wsTutStep += 1;
      renderWSTutorialStep();
    } else {
      closeHelpModal();
    }
  });

  helpModal.addEventListener("click", (event) => {
    if (event.target === helpModal) {
      closeHelpModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!helpModal.classList.contains("hidden")) {
      if (event.key === "Escape") closeHelpModal();
      return;
    }

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