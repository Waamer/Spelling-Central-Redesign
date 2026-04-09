// ==================== Word Source ====================
function shuffleWords(words) {
    const copy = [...words];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function uniqueNormalizedWords(words) {
    const seen = new Set();
    const result = [];
    words.forEach((word) => {
        const text = String(word || "").trim();
        if (!text) return;
        const key = text.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        result.push(text);
    });
    return result;
}

function getWordsFromLibrary() {
    const dataSource = window.wordLibraryData || { baseLibraries: [] };
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    let selectedList = null;
    const premadeLists = Array.isArray(dataSource.baseLibraries) ? dataSource.baseLibraries : [];

    if (mode === "custom") {
        try {
            selectedList = JSON.parse(localStorage.getItem("spellingcentral_selected_list") || "null");
        } catch (error) {
            selectedList = null;
        }
    }

    const selectedWords = Array.isArray(selectedList?.words) ? selectedList.words : [];
    const normalizedSelected = uniqueNormalizedWords(selectedWords);

    if (normalizedSelected.length >= 4) {
        return normalizedSelected;
    }

    // Quick play and fallback behavior: use one random premade list, not all premade words mixed.
    const shuffledPremade = shuffleWords(premadeLists);
    let normalized = [];
    for (const list of shuffledPremade) {
        const words = Array.isArray(list?.words) ? list.words : [];
        normalized = uniqueNormalizedWords(words);
        if (normalized.length >= 4) break;
    }

    if (normalized.length >= 4) {
        return normalized;
    }

    // Final fallback keeps the game playable even if storage data is missing.
    return uniqueNormalizedWords([
        "apple",
        "banana",
        "cherry",
        "date"
    ]);
}

// ==================== Game State ====================
let currentRound = 0;
let score = 0;
let totalAttempts = 0;
let currentWordSet = null;
let availableWords = [];
let placedWords = [null, null, null, null];
let showingHint = false;
let roundWordPool = [];
let draggedElement = null;

// ==================== DOM Elements ====================
const startScreen = document.getElementById("startScreen");
const gameContent = document.getElementById("gameContent");
const wordCardsContainer = document.getElementById("wordCards");
const dropZonesContainer = document.getElementById("dropZones");
const feedbackEl = document.getElementById("feedback");
const hintBox = document.getElementById("hintBox");
const hintWord = document.getElementById("hintWord");
const hintBtnText = document.getElementById("hintBtnText");
const modal = document.getElementById("modal");
const correctModal = document.getElementById("correctModal");
const wrongModal = document.getElementById("wrongModal");
const helpBtn = document.getElementById("helpBtn");
const tutPanel = document.getElementById("tut-panel");
const helpCloseBtn = document.getElementById("helpCloseBtn");
const tutStepLabel = document.getElementById("tut-step-label");
const tutProgFill = document.getElementById("tut-prog-fill");
const stepNum = document.getElementById("step-num");
const stepOf = document.getElementById("step-of");
const stepTitle = document.getElementById("step-title");
const stepBody = document.getElementById("step-body");
const tutDemo = document.getElementById("tut-demo");
const tutDots = document.getElementById("tut-dots");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");

const cursorEl = document.getElementById("cursor");
let cursorTimers = [];
let curStep = 0;
let cleanupFn = null;

const AL_TUTORIAL_STEPS = [
    {
        title: "The Goal",
        body: "Four word cards appear in a random order. Drag each card into the correct numbered slot so the words are arranged from A to Z.",
        build: buildAL1
    },
    {
        title: "Drag Cards into Slots",
        body: "Pick up a word card and drop it in the slot where it belongs. The red × button next to any filled slot lets you remove that word and place it again.",
        build: buildAL2
    },
    {
        title: "Right & Wrong Order",
        body: "When all four slots are filled the game checks automatically. Correct — a green banner appears. Wrong — a Not quite panel shows the issue with Try Again and Show Hint options.",
        build: buildAL3
    },
    {
        title: "Score & Results",
        body: "Complete all rounds to see your final score. Your accuracy percentage, number of correct answers, and time elapsed are shown on the results screen.",
        build: buildAL4
    }
];

function configureHomeLinks() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    if (!mode) return;

    const targetHref = `../homepage/game-selection.html?mode=${encodeURIComponent(mode)}`;
    const homePageLink = document.getElementById("homePageLink");
    const modalHomeLink = document.getElementById("modalHomeLink");

    if (homePageLink) {
        homePageLink.href = targetHref;
    }
    if (modalHomeLink) {
        modalHomeLink.href = targetHref;
    }
}

configureHomeLinks();

function openHelpModal() {
    if (!tutPanel) return;
    curStep = 0;
    tutPanel.classList.add("open");
    renderTutorialStep();
}

function closeHelpModal() {
    stopCleanup();
    if (!tutPanel) return;
    tutPanel.classList.remove("open");
}

function renderTutorialStep() {
    stopCleanup();

    const step = AL_TUTORIAL_STEPS[curStep];
    const total = AL_TUTORIAL_STEPS.length;

    tutStepLabel.textContent = `Step ${curStep + 1} of ${total}`;
    tutProgFill.style.width = `${((curStep + 1) / total) * 100}%`;
    stepNum.textContent = curStep + 1;
    stepOf.textContent = `of ${total}`;

    stepTitle.style.opacity = "0";
    stepBody.style.opacity = "0";
    setTimeout(() => {
        stepTitle.textContent = step.title;
        stepBody.textContent = step.body;
        stepTitle.style.transition = "opacity .3s";
        stepBody.style.transition = "opacity .3s";
        stepTitle.style.opacity = "1";
        stepBody.style.opacity = "1";
    }, 80);

    tutDots.innerHTML = AL_TUTORIAL_STEPS
        .map((_, i) => `<button class="tut-dot${i === curStep ? " active" : ""}" type="button" data-step="${i}" aria-label="Go to step ${i + 1}"></button>`)
        .join("");

    btnPrev.disabled = curStep === 0;
    btnNext.textContent = curStep === total - 1 ? "✓ Done" : "Next →";

    tutDemo.innerHTML = "";
    const r = step.build(tutDemo);
    if (typeof r === "function") cleanupFn = r;

    tutDots.querySelectorAll(".tut-dot").forEach((dot) => {
        dot.addEventListener("click", () => {
            curStep = Number(dot.dataset.step);
            renderTutorialStep();
        });
    });
}

function stopCleanup() {
    if (cleanupFn) {
        try {
            cleanupFn();
        } catch (error) {
            // no-op
        }
        cleanupFn = null;
    }
    hideCursor();
}

function nextTutorialStep() {
    if (curStep < AL_TUTORIAL_STEPS.length - 1) {
        curStep += 1;
        renderTutorialStep();
    } else {
        closeHelpModal();
    }
}

function prevTutorialStep() {
    if (curStep > 0) {
        curStep -= 1;
        renderTutorialStep();
    }
}

function hideCursor() {
    cursorTimers.forEach(clearTimeout);
    cursorTimers = [];
    if (cursorEl) {
        cursorEl.classList.remove("visible");
    }
}

function moveCursor(x, y, cb, delay = 0) {
    const t = setTimeout(() => {
        if (!cursorEl) return;
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

function topbar(title, stat = "") {
    return `<div class="demo-topbar"><span class="demo-topbar-title">${title}</span>${stat ? `<span class="demo-topbar-stat">${stat}</span>` : ""}</div>`;
}

function finalScore(emoji, title, sub, correct, wrong, extra = "") {
    return `<div class="demo-screen" style="max-width:300px;margin:0 auto">
        ${topbar(title)}
        <div class="demo-content" style="text-align:center;padding:16px 12px">
            <div style="font-size:38px;margin-bottom:6px">${emoji}</div>
            <div style="font-family:inherit;font-size:15px;font-weight:700;color:#1f3b2d;margin-bottom:12px">${sub}</div>
            <div class="demo-score">
                <div class="demo-score-box"><div class="demo-score-val" style="color:#3f6b43">${correct}</div><div class="demo-score-lbl">Correct</div></div>
                <div class="demo-score-box"><div class="demo-score-val" style="color:#7c2e25">${wrong}</div><div class="demo-score-lbl">Wrong</div></div>
                ${extra}
            </div>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:14px">
                <div class="tool-btn" style="font-size:12px;padding:7px 14px">↺ Play Again</div>
                <div class="tool-btn" style="font-size:12px;padding:7px 14px">🏠 Home</div>
            </div>
        </div>
    </div>`;
}

const AL_SCRAMBLED = ["orange", "apple", "grape", "banana"];
const AL_CORRECT = ["apple", "banana", "grape", "orange"];

function alphaZone(n, word = "", correct = false, filled = false) {
    const bg = correct ? "#dce8d5" : filled ? "#edf5e8" : "#fbf7ec";
    const bc = correct ? "#87a47a" : filled ? "#87a47a" : "#d8c9a8";
    const bs = correct || filled ? "solid" : "dashed";
    return `<div class="alpha-zone${correct ? " correct" : filled ? " filled" : ""}" style="background:${bg};border-color:${bc};border-style:${bs}">
        <div class="alpha-zone-n">${n}</div>
        <div class="alpha-zone-w">${word || '<span style="color:#486657;font-style:italic;font-size:12px">Drop here</span>'}</div>
        ${correct ? `<span class="alpha-check" style="opacity:1">✅</span>` : filled ? `<button style="background:#f6ddd8;border:1.5px solid #c56558;border-radius:50%;width:20px;height:20px;font-size:11px;font-weight:700;color:#7c2e25;cursor:pointer;padding:0;margin-left:auto" id="rm${n}">×</button>` : ""}
    </div>`;
}

function buildAL1(container) {
    container.innerHTML = `
        <div class="demo-scene" style="width:100%;max-width:340px">
            <div class="demo-screen">
                ${topbar("🔤 Alphabetical Order", "Round 1 / 10")}
                <div class="demo-content">
                    <div style="font-size:11px;font-weight:700;color:#486657;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Word Cards</div>
                    <div class="alpha-pool" style="margin-bottom:12px">
                        ${AL_SCRAMBLED.map((w) => `<div class="alpha-chip">${w}</div>`).join("")}
                    </div>
                    <div style="font-size:11px;font-weight:700;color:#486657;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Drop Zones</div>
                    <div class="alpha-zones">
                        ${[1, 2, 3, 4].map((n) => alphaZone(n)).join("")}
                    </div>
                </div>
            </div>
        </div>`;
    return null;
}

function buildAL2(container) {
    container.innerHTML = `
        <div class="demo-scene" style="width:100%;max-width:340px">
            <div class="demo-screen">
                ${topbar("🔤 Alphabetical Order")}
                <div class="demo-content">
                    <div class="alpha-pool" id="al2-pool"></div>
                    <div class="alpha-zones" id="al2-zones"></div>
                    <div id="al2-msg" style="font-size:11px;font-weight:700;color:#486657;margin-top:8px;text-align:center;min-height:14px"></div>
                </div>
            </div>
        </div>`;

    const pool = document.getElementById("al2-pool");
    const zones = document.getElementById("al2-zones");
    AL_SCRAMBLED.forEach((w) => {
        const chip = document.createElement("div");
        chip.className = "alpha-chip";
        chip.id = `al2c-${w}`;
        chip.textContent = w;
        pool.appendChild(chip);
    });
    for (let n = 1; n <= 4; n += 1) {
        const zone = document.createElement("div");
        zone.className = "alpha-zone";
        zone.id = `al2z-${n}`;
        zone.innerHTML = `<div class="alpha-zone-n">${n}</div><div class="alpha-zone-w" id="al2zw-${n}" style="color:#486657;font-style:italic;font-size:12px">Drop here</div>`;
        zones.appendChild(zone);
    }

    const timers = [];
    function doPass() {
        AL_SCRAMBLED.forEach((w) => {
            const c = document.getElementById(`al2c-${w}`);
            if (c) {
                c.classList.remove("placed", "lifted");
                c.style.display = "";
            }
        });
        for (let n = 1; n <= 4; n += 1) {
            const z = document.getElementById(`al2z-${n}`);
            const w = document.getElementById(`al2zw-${n}`);
            if (z) {
                z.className = "alpha-zone";
                z.style.background = "";
                z.style.borderColor = "";
                z.style.borderStyle = "";
            }
            if (w) {
                w.textContent = "Drop here";
                w.style.color = "#486657";
                w.style.fontStyle = "italic";
                w.style.fontSize = "12px";
            }
            const rm = z ? z.querySelector(".remove-btn-demo") : null;
            if (rm) rm.remove();
        }

        const msg = document.getElementById("al2-msg");
        if (msg) msg.textContent = "";

        AL_CORRECT.slice(0, 2).forEach((word, idx) => {
            const chip = document.getElementById(`al2c-${word}`);
            const zoneZ = document.getElementById(`al2z-${idx + 1}`);
            const zoneW = document.getElementById(`al2zw-${idx + 1}`);
            if (!chip || !zoneZ) return;

            timers.push(setTimeout(() => {
                chip.classList.add("lifted");
                const p = centre(chip);
                moveCursor(p.x, p.y, null, 0);
            }, idx * 1200 + 300));

            timers.push(setTimeout(() => {
                const p = centre(zoneZ);
                moveCursor(p.x, p.y, null, 0);
                clickAt(p.x, p.y, 0, () => {
                    chip.classList.add("placed");
                    zoneZ.className = "alpha-zone filled";
                    zoneZ.style.background = "#edf5e8";
                    zoneZ.style.borderColor = "#87a47a";
                    zoneZ.style.borderStyle = "solid";
                    if (zoneW) {
                        zoneW.textContent = word;
                        zoneW.style.color = "#1f3b2d";
                        zoneW.style.fontStyle = "normal";
                        zoneW.style.fontSize = "13px";
                    }
                    const rm = document.createElement("button");
                    rm.className = "remove-btn-demo";
                    rm.style.cssText = "background:#f6ddd8;border:1.5px solid #c56558;border-radius:50%;width:20px;height:20px;font-size:11px;font-weight:700;color:#7c2e25;cursor:pointer;padding:0;margin-left:auto";
                    rm.textContent = "×";
                    zoneZ.appendChild(rm);
                });
            }, idx * 1200 + 900));
        });

        timers.push(setTimeout(() => {
            if (msg) msg.textContent = "Click × to remove a word and place it again";
            hideCursor();
        }, 2800));
        timers.push(setTimeout(doPass, 5600));
    }

    timers.push(setTimeout(doPass, 300));
    return () => {
        timers.forEach(clearTimeout);
        hideCursor();
    };
}

function buildAL3(container) {
    container.innerHTML = `
        <div class="demo-scene" style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:380px">
            <div class="demo-screen">
                <div class="demo-topbar" style="background:#3f6b43"><span class="demo-topbar-title">✅ Correct Order — All zones turn green</span></div>
                <div class="demo-content">
                    <div class="alpha-zones">
                        ${AL_CORRECT.map((w, i) => alphaZone(i + 1, w, true)).join("")}
                    </div>
                </div>
            </div>
            <div class="demo-screen">
                <div class="demo-topbar" style="background:#7c2e25"><span class="demo-topbar-title">❌ Wrong order — Not quite panel appears</span></div>
                <div class="demo-content">
                    <div class="alpha-zones" style="margin-bottom:8px" id="al3-bad-zones"></div>
                    <div id="al3-modal" style="background:#efe7d1;border:2px solid #c56558;border-radius:10px;padding:10px 12px;display:none">
                        <div style="font-size:18px;margin-bottom:3px">✗</div>
                        <div style="font-family:inherit;font-size:13px;font-weight:700;color:#7c2e25;margin-bottom:3px">Not quite!</div>
                        <div id="al3-wrong-msg" style="font-size:11px;color:#486657;margin-bottom:8px"></div>
                        <div style="display:flex;gap:6px">
                            <div class="tool-btn" style="font-size:11px;padding:5px 10px">Try Again</div>
                            <div class="tool-btn" style="font-size:11px;padding:5px 10px">Show Hint</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    const badZones = document.getElementById("al3-bad-zones");
    const wrongOrder = ["banana", "apple", "orange", "grape"];
    wrongOrder.forEach((w, i) => {
        badZones.innerHTML += alphaZone(i + 1, w, false, true);
    });

    const timers = [];
    function animWrong() {
        const modalEl = document.getElementById("al3-modal");
        const wmsg = document.getElementById("al3-wrong-msg");
        if (!modalEl) return;
        modalEl.style.display = "none";
        timers.push(setTimeout(() => {
            modalEl.style.display = "block";
            if (wmsg) wmsg.textContent = "banana should come before orange in position 1.";
        }, 800));
        timers.push(setTimeout(() => {
            modalEl.style.display = "none";
        }, 3200));
        timers.push(setTimeout(animWrong, 5000));
    }

    timers.push(setTimeout(animWrong, 400));
    return () => timers.forEach(clearTimeout);
}

function buildAL4(container) {
    container.innerHTML = `<div class="demo-scene" style="width:100%;max-width:340px">${finalScore("🏅", "🔤 All Rounds Done!", "8 out of 10 correct", "8", "2", `<div class="demo-score-box"><div class="demo-score-val">80%</div><div class="demo-score-lbl">Accuracy</div></div>`)}</div>`;
    return null;
}

if (helpBtn) {
    helpBtn.addEventListener("click", openHelpModal);
}

if (helpCloseBtn) {
    helpCloseBtn.addEventListener("click", closeHelpModal);
}

if (btnPrev) {
    btnPrev.addEventListener("click", prevTutorialStep);
}

if (btnNext) {
    btnNext.addEventListener("click", nextTutorialStep);
}

if (tutPanel) {
    tutPanel.addEventListener("click", (event) => {
        if (event.target === tutPanel) {
            closeHelpModal();
        }
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && tutPanel && tutPanel.classList.contains("open")) {
        closeHelpModal();
    }
});

// ==================== Start Game ====================
function startGame() {
    currentRound = 0;
    score = 0;
    totalAttempts = 0;
    roundWordPool = shuffleWords(getWordsFromLibrary());
    
    startScreen.classList.add("hidden");
    gameContent.classList.remove("hidden");
    
    nextRoundSetup();
}

// ==================== Setup Next Round ====================
function nextRoundSetup() {
    currentRound++;

    if (roundWordPool.length < 4) {
        roundWordPool = shuffleWords(getWordsFromLibrary());
    }

    const roundWords = roundWordPool.splice(0, 4);
    currentWordSet = {
        words: roundWords,
        correct: [...roundWords].sort((a, b) => a.localeCompare(b))
    };

    // Shuffle words for display
    availableWords = shuffleWords(currentWordSet.words);
    placedWords = [null, null, null, null];
    showingHint = false;
    
    hintBox.classList.add("hidden");
    hintBtnText.textContent = "Show Hint";
    
    updateDisplay();
}

// ==================== Update Display ====================
function updateDisplay() {
    document.getElementById("currentRound").textContent = currentRound;
    document.getElementById("score").textContent = score;
    document.getElementById("total").textContent = totalAttempts;
    
    renderWordCards();
    renderDropZones();
}

// ==================== Render Word Cards ====================
function renderWordCards() {
    wordCardsContainer.innerHTML = "";
    
    if (availableWords.length === 0) {
        const emptyMsg = document.createElement("span");
        emptyMsg.className = "empty-message";
        emptyMsg.textContent = "All words placed!";
        wordCardsContainer.appendChild(emptyMsg);
        return;
    }
    
    availableWords.forEach((word, index) => {
        const card = document.createElement("div");
        card.className = "word-card";
        card.textContent = word;
        card.draggable = true;
        card.dataset.word = word;
        card.dataset.index = index;
        
        // Drag events
        card.addEventListener("dragstart", handleDragStart);
        card.addEventListener("dragend", handleDragEnd);
        
        // Touch events for mobile
        card.addEventListener("touchstart", handleTouchStart, { passive: false });
        card.addEventListener("touchmove", handleTouchMove, { passive: false });
        card.addEventListener("touchend", handleTouchEnd);
        
        wordCardsContainer.appendChild(card);
    });
}

// ==================== Render Drop Zones ====================
function renderDropZones() {
    dropZonesContainer.innerHTML = "";
    
    for (let i = 0; i < 4; i++) {
        const zone = document.createElement("div");
        zone.className = "drop-zone" + (placedWords[i] ? " filled" : "");
        zone.dataset.position = i;
        
        // Position number
        const posNum = document.createElement("div");
        posNum.className = "position-number";
        posNum.textContent = i + 1;
        zone.appendChild(posNum);
        
        // Content area
        const content = document.createElement("div");
        content.className = "drop-zone-content";
        
        if (placedWords[i]) {
            const wordEl = document.createElement("span");
            wordEl.className = "dropped-word";
            wordEl.textContent = placedWords[i];
            content.appendChild(wordEl);
        } else {
            const placeholder = document.createElement("span");
            placeholder.className = "drop-placeholder";
            placeholder.textContent = "Drop here";
            content.appendChild(placeholder);
        }
        
        zone.appendChild(content);
        
        // Remove button
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.innerHTML = "&times;";
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeWord(i);
        };
        zone.appendChild(removeBtn);
        
        // Drop events
        zone.addEventListener("dragover", handleDragOver);
        zone.addEventListener("dragleave", handleDragLeave);
        zone.addEventListener("drop", handleDrop);
        
        dropZonesContainer.appendChild(zone);
    }
}

// ==================== Drag and Drop Handlers ====================
function handleDragStart(e) {
    draggedElement = e.target;
    e.target.classList.add("dragging");
    e.dataTransfer.setData("text/plain", e.target.dataset.word);
    e.dataTransfer.effectAllowed = "move";
}

function handleDragEnd(e) {
    e.target.classList.remove("dragging");
    draggedElement = null;
    
    // Remove drag-over class from all zones
    document.querySelectorAll(".drop-zone").forEach(zone => {
        zone.classList.remove("drag-over");
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("drag-over");
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    
    const word = e.dataTransfer.getData("text/plain");
    const position = parseInt(e.currentTarget.dataset.position);
    
    placeWord(word, position);
}

// ==================== Touch Handlers for Mobile ====================
let touchClone = null;
let touchStartX, touchStartY;

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    draggedElement = e.target;
    draggedElement.classList.add("dragging");
    
    // Create clone for visual feedback
    touchClone = draggedElement.cloneNode(true);
    touchClone.style.position = "fixed";
    touchClone.style.pointerEvents = "none";
    touchClone.style.zIndex = "9999";
    touchClone.style.opacity = "0.8";
    touchClone.style.transform = "scale(1.1)";
    document.body.appendChild(touchClone);
    
    updateTouchClonePosition(touch.clientX, touch.clientY);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    
    if (touchClone) {
        updateTouchClonePosition(touch.clientX, touch.clientY);
    }
    
    // Highlight drop zone under touch
    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = elementUnderTouch?.closest(".drop-zone");
    
    document.querySelectorAll(".drop-zone").forEach(zone => {
        zone.classList.remove("drag-over");
    });
    
    if (dropZone) {
        dropZone.classList.add("drag-over");
    }
}

function handleTouchEnd(e) {
    if (touchClone) {
        touchClone.remove();
        touchClone = null;
    }
    
    if (draggedElement) {
        draggedElement.classList.remove("dragging");
        
        const touch = e.changedTouches[0];
        const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
        const dropZone = elementUnderTouch?.closest(".drop-zone");
        
        if (dropZone) {
            const position = parseInt(dropZone.dataset.position);
            const word = draggedElement.dataset.word;
            placeWord(word, position);
        }
        
        draggedElement = null;
    }
    
    document.querySelectorAll(".drop-zone").forEach(zone => {
        zone.classList.remove("drag-over");
    });
}

function updateTouchClonePosition(x, y) {
    if (touchClone) {
        const rect = touchClone.getBoundingClientRect();
        touchClone.style.left = (x - rect.width / 2) + "px";
        touchClone.style.top = (y - rect.height / 2) + "px";
    }
}

// ==================== Place Word ====================
function placeWord(word, position) {
    // If position already has a word, return it to available
    if (placedWords[position]) {
        availableWords.push(placedWords[position]);
    }
    
    // Remove word from available words
    const wordIndex = availableWords.indexOf(word);
    if (wordIndex > -1) {
        availableWords.splice(wordIndex, 1);
    }
    
    // Place the word
    placedWords[position] = word;
    
    updateDisplay();
    
    // Check if all positions are filled
    if (placedWords.every(w => w !== null)) {
        setTimeout(checkAnswer, 300);
    }
}

// ==================== Remove Word ====================
function removeWord(position) {
    if (placedWords[position]) {
        availableWords.push(placedWords[position]);
        placedWords[position] = null;
        updateDisplay();
    }
}

// ==================== Check Answer ====================
function checkAnswer() {
    totalAttempts++;
    
    const isCorrect = placedWords.every((word, index) => word === currentWordSet.correct[index]);
    
    if (isCorrect) {
        score++;
        showCorrectModal();
    } else {
        showWrongModal();
    }
    
    updateDisplay();
}

// ==================== Show Correct Modal ====================
function showCorrectModal() {
    const nextBtn = document.getElementById("nextBtnText");
    nextBtn.textContent = currentRound >= 10 ? "See Results" : "Next Round";
    correctModal.classList.add("show");
}

// ==================== Show Wrong Modal ====================
function showWrongModal() {
    document.getElementById("wrongMessage").textContent = "The words are not in the correct alphabetical order.";
    wrongModal.classList.add("show");
}

// ==================== Next Round ====================
function nextRound() {
    correctModal.classList.remove("show");
    
    if (currentRound >= 10) {
        endGame();
    } else {
        nextRoundSetup();
    }
}

// ==================== Try Again ====================
function tryAgain() {
    wrongModal.classList.remove("show");
    resetRound();
}

// ==================== Show Hint from Wrong Modal ====================
function showHintFromWrong() {
    wrongModal.classList.remove("show");
    showingHint = true;
    hintWord.textContent = currentWordSet.correct[0];
    hintBox.classList.remove("hidden");
    hintBtnText.textContent = "Hide Hint";
    resetRound();
}

// ==================== Toggle Hint ====================
function toggleHint() {
    showingHint = !showingHint;
    
    if (showingHint) {
        hintWord.textContent = currentWordSet.correct[0];
        hintBox.classList.remove("hidden");
        hintBtnText.textContent = "Hide Hint";
    } else {
        hintBox.classList.add("hidden");
        hintBtnText.textContent = "Show Hint";
    }
}

// ==================== Reset Round ====================
function resetRound() {
    // Return all placed words to available
    placedWords.forEach(word => {
        if (word) availableWords.push(word);
    });
    placedWords = [null, null, null, null];
    
    // Shuffle available words
    availableWords.sort(() => Math.random() - 0.5);
    
    updateDisplay();
}

// ==================== End Game ====================
function endGame() {
    correctModal.classList.remove("show");
    wrongModal.classList.remove("show");
    
    const accuracy = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;
    
    document.getElementById("finalScoreDisplay").textContent = accuracy + "%";
    document.getElementById("correctCount").textContent = score;
    document.getElementById("incorrectCount").textContent = totalAttempts - score;
    
    let message = "";
    if (accuracy >= 90) {
        message = "Amazing! You're a spelling champion!";
    } else if (accuracy >= 70) {
        message = "Great job! Keep practicing!";
    } else if (accuracy >= 50) {
        message = "Good effort! You're improving!";
    } else {
        message = "Keep trying! Practice makes perfect!";
    }
    
    document.getElementById("finalMessage").textContent = message;
    modal.classList.add("show");
}

// ==================== Restart Game ====================
function restart() {
    modal.classList.remove("show");
    startGame();
}

// ==================== Show Feedback ====================
function showFeedback(message, isCorrect) {
    feedbackEl.textContent = message;
    feedbackEl.className = "feedback-message show " + (isCorrect ? "correct" : "incorrect");
    
    setTimeout(() => {
        feedbackEl.classList.remove("show");
    }, 2000);
}
