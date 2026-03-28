// Get selected list from localStorage
let selectedList = JSON.parse(localStorage.getItem("spellingcentral_selected_list"));

// If a selected list exists, use its words, otherwise fallback to all default words
let words = [];

if (selectedList && Array.isArray(selectedList.words) && selectedList.words.length > 0) {
    words = selectedList.words.map(w => w.toUpperCase());
} else if (window.wordLibraryData && Array.isArray(window.wordLibraryData.baseLibraries)) {
    // Combine all words from default baseLibraries
    words = window.wordLibraryData.baseLibraries
        .flatMap(lib => lib.words)
        .map(w => String(w).toUpperCase())
        .filter(Boolean);
}

let current = 0;
let score = 0;
let total = 0;
let missingIndexes = [];
let gameDifficulty = selectedList && selectedList.difficulty ? selectedList.difficulty : "medium"; // Get difficulty from selected list
let hintsUsedThisRound = false;
let dragSourceBox = null; // Track which box is being dragged from
let dragSourceOption = null;
let gameStarted = false;

const startScreen = document.getElementById("startScreen");
const startGameBtn = document.getElementById("startGameBtn");
const gameContent = document.getElementById("gameContent");
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

const ML_TUTORIAL_STEPS = [
    {
        title: "The Goal",
        body: "Find the missing letters in each word. Fill every blank box, then submit your answer.",
        build: buildML1
    },
    {
        title: "Drag Letters into Blanks",
        body: "Drag a letter tile from the options row and drop it into an empty box. You can move letters between blank boxes if needed.",
        build: buildML2
    },
    {
        title: "Hints and Checking",
        body: "Use the hint button to reveal helpful letters when stuck. Submit checks your answer and shows immediate feedback.",
        build: buildML3
    },
    {
        title: "Scoring",
        body: "Your score updates as you play. You can skip words, keep practicing, and see your result when you end the game.",
        build: buildML4
    }
];

// ---------------------- Difficulty Configuration ----------------------
const difficultyConfig = {
    easy: {
        getMissingCount: (wordLen) => Math.max(2, Math.ceil(wordLen * 0.25)), // 25% of word
        hintRevealsCount: (wordLen) => Math.ceil(wordLen * 0.4) // Reveals more letters
    },
    medium: {
        getMissingCount: (wordLen) => Math.max(2, Math.ceil(wordLen * 0.4)), // 40% of word
        hintRevealsCount: (wordLen) => Math.ceil(wordLen * 0.25) // Reveals 25% of remaining
    },
    hard: {
        getMissingCount: (wordLen) => Math.max(3, Math.ceil(wordLen * 0.6)), // 60% of word
        hintRevealsCount: (wordLen) => Math.max(1, Math.ceil(wordLen * 0.15)) // Reveals only 15%
    }
};

// ---------------------- Get Missing Count Based on Difficulty ----------------------
function getMissingLetterCount(wordLength) {
    const config = difficultyConfig[gameDifficulty];
    return config.getMissingCount(wordLength);
}

function ensureGameStarted() {
    if (gameStarted) return;
    gameStarted = true;
    if (startScreen) {
        startScreen.classList.add("hidden");
    }
    if (gameContent) {
        gameContent.classList.remove("hidden");
    }
    setupWord();
}

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

    const step = ML_TUTORIAL_STEPS[curStep];
    const totalSteps = ML_TUTORIAL_STEPS.length;

    tutStepLabel.textContent = `Step ${curStep + 1} of ${totalSteps}`;
    tutProgFill.style.width = `${((curStep + 1) / totalSteps) * 100}%`;
    stepNum.textContent = curStep + 1;
    stepOf.textContent = `of ${totalSteps}`;

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

    tutDots.innerHTML = ML_TUTORIAL_STEPS
        .map((_, i) => `<button class="tut-dot${i === curStep ? " active" : ""}" type="button" data-step="${i}" aria-label="Go to step ${i + 1}"></button>`)
        .join("");

    btnPrev.disabled = curStep === 0;
    btnNext.textContent = curStep === totalSteps - 1 ? "Start Game" : "Next →";

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
    if (curStep < ML_TUTORIAL_STEPS.length - 1) {
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
    const timer = setTimeout(() => {
        if (!cursorEl) return;
        cursorEl.classList.add("visible");
        cursorEl.style.left = `${x}px`;
        cursorEl.style.top = `${y}px`;
        if (cb) {
            const timer2 = setTimeout(cb, 560);
            cursorTimers.push(timer2);
        }
    }, delay);
    cursorTimers.push(timer);
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
            <div style="font-size:15px;font-weight:700;color:#1f3b2d;margin-bottom:12px">${sub}</div>
            <div class="demo-score">
                <div class="demo-score-box"><div class="demo-score-val" style="color:#3f6b43">${correct}</div><div class="demo-score-lbl">Correct</div></div>
                <div class="demo-score-box"><div class="demo-score-val" style="color:#7c2e25">${wrong}</div><div class="demo-score-lbl">Wrong</div></div>
                ${extra}
            </div>
        </div>
    </div>`;
}

function buildML1(container) {
    container.innerHTML = `
        <div class="demo-scene" style="max-width:340px">
            <div class="demo-screen">
                ${topbar("🧩 Missing Letters", "Score 0/0")}
                <div class="demo-content">
                    <div class="ml-word-row">
                        <div class="ml-box">P</div>
                        <div class="ml-box">L</div>
                        <div class="ml-box blank">_</div>
                        <div class="ml-box">N</div>
                        <div class="ml-box blank">_</div>
                        <div class="ml-box">T</div>
                    </div>
                    <div class="ml-options-row">
                        <div class="ml-opt">A</div>
                        <div class="ml-opt">E</div>
                        <div class="ml-opt">I</div>
                        <div class="ml-opt">O</div>
                        <div class="ml-opt">U</div>
                    </div>
                </div>
            </div>
        </div>`;
    return null;
}

function buildML2(container) {
    container.innerHTML = `
        <div class="demo-scene" style="max-width:360px">
            <div class="demo-screen">
                ${topbar("🧩 Fill the blanks")}
                <div class="demo-content">
                    <div class="ml-word-row">
                        <div class="ml-box">P</div>
                        <div class="ml-box">L</div>
                        <div class="ml-box blank" id="ml2b3">_</div>
                        <div class="ml-box">N</div>
                        <div class="ml-box blank" id="ml2b5">_</div>
                        <div class="ml-box">T</div>
                    </div>
                    <div class="ml-options-row" id="ml2-options">
                        <div class="ml-opt" id="ml2o-A">A</div>
                        <div class="ml-opt" id="ml2o-E">E</div>
                        <div class="ml-opt" id="ml2o-I">I</div>
                        <div class="ml-opt" id="ml2o-O">O</div>
                    </div>
                    <div id="ml2-msg" style="font-size:11px;font-weight:700;color:#486657;margin-top:8px;text-align:center;min-height:14px"></div>
                </div>
            </div>
        </div>`;

    const timers = [];

    function resetState() {
        const box3 = document.getElementById("ml2b3");
        const box5 = document.getElementById("ml2b5");
        if (box3) {
            box3.textContent = "_";
            box3.classList.remove("filled");
            box3.classList.add("blank");
        }
        if (box5) {
            box5.textContent = "_";
            box5.classList.remove("filled");
            box5.classList.add("blank");
        }
        ["A", "E", "I", "O"].forEach((letter) => {
            const chip = document.getElementById(`ml2o-${letter}`);
            if (chip) {
                chip.classList.remove("lifted", "placed");
            }
        });
        const msg = document.getElementById("ml2-msg");
        if (msg) msg.textContent = "";
    }

    function runPass() {
        resetState();
        const sequence = [
            { letter: "A", boxId: "ml2b3", at: 300 },
            { letter: "E", boxId: "ml2b5", at: 1700 }
        ];

        sequence.forEach((step) => {
            const chip = document.getElementById(`ml2o-${step.letter}`);
            const box = document.getElementById(step.boxId);
            if (!chip || !box) return;

            timers.push(setTimeout(() => {
                chip.classList.add("lifted");
                const p = centre(chip);
                moveCursor(p.x, p.y, null, 0);
            }, step.at));

            timers.push(setTimeout(() => {
                const p = centre(box);
                clickAt(p.x, p.y, 0, () => {
                    box.textContent = step.letter;
                    box.classList.remove("blank");
                    box.classList.add("filled");
                    chip.classList.remove("lifted");
                    chip.classList.add("placed");
                });
            }, step.at + 650));
        });

        timers.push(setTimeout(() => {
            const msg = document.getElementById("ml2-msg");
            if (msg) msg.textContent = "Word completed: PLANET";
            hideCursor();
        }, 3200));

        timers.push(setTimeout(runPass, 5600));
    }

    timers.push(setTimeout(runPass, 240));
    return () => {
        timers.forEach(clearTimeout);
        hideCursor();
    };
}

function buildML3(container) {
    container.innerHTML = `
        <div class="demo-scene" style="display:flex;flex-direction:column;gap:10px;max-width:370px">
            <div class="demo-screen">
                ${topbar("💡 Use Hint If Needed")}
                <div class="demo-content" style="text-align:center">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                        <span style="font-size:12px;color:#1f3b2d;font-weight:700">Score: 2 / 3</span>
                        <span style="font-size:20px">💡</span>
                    </div>
                    <div id="ml3-hint" style="display:none;background:#fff9eb;border:2px solid #d79c1f;border-radius:8px;padding:8px;font-size:12px;color:#1f3b2d;font-weight:700">Hint: A, E</div>
                </div>
            </div>
            <div class="demo-screen">
                ${topbar("✅ Submit to Check")}
                <div class="demo-content" style="text-align:center">
                    <div id="ml3-feedback" style="font-size:13px;font-weight:700;min-height:18px;color:#486657"></div>
                </div>
            </div>
        </div>`;

    const timers = [];

    function runPass() {
        const hint = document.getElementById("ml3-hint");
        const feedback = document.getElementById("ml3-feedback");
        if (!hint || !feedback) return;

        hint.style.display = "none";
        feedback.textContent = "";

        timers.push(setTimeout(() => {
            hint.style.display = "block";
        }, 700));

        timers.push(setTimeout(() => {
            feedback.style.color = "#7c2e25";
            feedback.textContent = "Incorrect! Correct: PLANET";
        }, 1900));

        timers.push(setTimeout(() => {
            feedback.style.color = "#3f6b43";
            feedback.textContent = "Correct!";
        }, 3300));

        timers.push(setTimeout(runPass, 5600));
    }

    timers.push(setTimeout(runPass, 300));
    return () => timers.forEach(clearTimeout);
}

function buildML4(container) {
    container.innerHTML = `<div class="demo-scene" style="max-width:340px">${finalScore("🏅", "🧩 Game Summary", "6 out of 8 correct", "6", "2", `<div class="demo-score-box"><div class="demo-score-val">75%</div><div class="demo-score-lbl">Accuracy</div></div>`)}</div>`;
    return null;
}

// ------------------ Word Setup ------------------
function setupWord() {
    if (words.length === 0) return;

    const word = words[current];
    const wordContainer = document.getElementById("word");
    const optionsContainer = document.getElementById("options");

    wordContainer.innerHTML = "";
    optionsContainer.innerHTML = "";
    missingIndexes = [];
    dragSourceBox = null; // Reset drag state for new word
    hintsUsedThisRound = false; // Reset hint for new word

    // Determine missing letters based on difficulty and word length
    const missingCount = getMissingLetterCount(word.length);
    
    while (missingIndexes.length < missingCount && missingIndexes.length < word.length) {
        let rand = Math.floor(Math.random() * word.length);
        if (!missingIndexes.includes(rand)) missingIndexes.push(rand);
    }

    // render word boxes
    word.split("").forEach((letter, i) => {
        const box = document.createElement("div");
        box.classList.add("letter-box");

        if (missingIndexes.includes(i)) {
            box.dataset.index = i;
            box.ondragover = (e) => e.preventDefault();
            box.ondrop = dropLetter;
            box.draggable = true;
            box.ondragstart = dragFromBox;
        } else {
            box.textContent = letter;
        }

        wordContainer.appendChild(box);
    });

    // generate draggable letter options
    let letters = missingIndexes.map(i => word[i]);
    while (letters.length < 5) {
        let randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        if (!letters.includes(randomLetter)) letters.push(randomLetter);
    }
    letters.sort(() => Math.random() - 0.5);

    letters.forEach((letter) => addOptionLetter(letter));
}

function addOptionLetter(letter) {
    const optionsContainer = document.getElementById("options");
    if (!optionsContainer) return;

    const div = document.createElement("div");
    div.classList.add("draggable");
    div.textContent = letter;
    div.draggable = true;
    div.ondragstart = dragLetter;
    optionsContainer.appendChild(div);
}

// ------------------ Drag & Drop ------------------
function dragLetter(e) {
    e.dataTransfer.setData("text", e.target.textContent);
    e.dataTransfer.setData("source", "option");
    dragSourceOption = e.target;
    dragSourceBox = null;
}

function dragFromBox(e) {
    if (e.target.textContent) {
        e.dataTransfer.setData("text", e.target.textContent);
        e.dataTransfer.setData("source", "box");
        dragSourceBox = e.target;
    }
}

function dropLetter(e) {
    e.preventDefault();
    const letter = e.dataTransfer.getData("text");
    const source = e.dataTransfer.getData("source");

    if (!letter) return;

    const targetBox = e.target;
    const targetExisting = targetBox.textContent || "";

    if (source === "box" && dragSourceBox) {
        if (dragSourceBox === targetBox) {
            dragSourceBox = null;
            dragSourceOption = null;
            return;
        }

        // Swap letters when dropping onto a filled box for consistent behavior.
        targetBox.textContent = letter;
        dragSourceBox.textContent = targetExisting;
    } else if (source === "option") {
        // If replacing a filled box with an option letter, return displaced letter back to options.
        if (targetExisting) {
            addOptionLetter(targetExisting);
        }
        targetBox.textContent = letter;

        if (dragSourceOption) {
            dragSourceOption.remove();
        }
    }

    dragSourceBox = null;
    dragSourceOption = null;
}

// ------------------ Feedback Message ------------------
function showFeedback(message, isCorrect) {
    const feedback = document.getElementById("feedback");
    feedback.textContent = message;
    feedback.classList.toggle("incorrect", !isCorrect);

    feedback.style.opacity = "1";

    setTimeout(() => {
        feedback.style.opacity = "0";
    }, 3000);
}

// ------------------ Hint System ------------------
function useHint() {
    if (hintsUsedThisRound) {
        showFeedback("You already used a hint for this word!", false);
        return;
    }

    const word = words[current];
    const boxes = document.querySelectorAll(".letter-box");
    
    // Find empty boxes (missing letters that haven't been filled in)
    let emptyMissingLetters = [];
    boxes.forEach((box, i) => {
        if (missingIndexes.includes(i) && !box.textContent) {
            emptyMissingLetters.push(word[i]);
        }
    });

    if (emptyMissingLetters.length === 0) {
        showFeedback("All letters are filled!", true);
        return;
    }
    
    // Get unique letters from unfilled positions
    const uniqueEmptyLetters = [...new Set(emptyMissingLetters)];
    
    // Show only half of the unfilled missing letters
    const hintCount = Math.ceil(uniqueEmptyLetters.length / 2);
    const shuffled = uniqueEmptyLetters.sort(() => Math.random() - 0.5);
    const hintLetters = shuffled.slice(0, hintCount).sort();
    
    hintsUsedThisRound = true;
    const hintBtn = document.getElementById("hintBtn");
    hintBtn.disabled = true;
    hintBtn.style.opacity = "0.5";
    
    showFeedback(`Hint: ${hintLetters.join(", ")}`, true);
}

// ------------------ Check Answer ------------------
function checkAnswer() {
    const word = words[current];
    const boxes = document.querySelectorAll(".letter-box");
    let correct = true;

    boxes.forEach((box, i) => {
        if (missingIndexes.includes(i) && box.textContent !== word[i]) correct = false;
    });

    total++;
    if (correct) {
        score++;
        showFeedback("Correct!", true);
    } else {
        showFeedback("Incorrect! Correct: " + word, false);
    }

    updateScore();
    nextWord();
}

// ------------------ Next Word ------------------
function nextWord() {
    current = (current + 1) % words.length;
    dragSourceBox = null; // Reset drag state
    
    // Re-enable hint button for next word
    const hintBtn = document.getElementById("hintBtn");
    hintBtn.disabled = false;
    hintBtn.style.opacity = "1";
    
    setupWord();
}

// ------------------ Update Score ------------------
function updateScore() {
    document.getElementById("score").textContent = score;
    document.getElementById("total").textContent = total;
}

// ------------------ End Game ------------------
function endGame() {
    const modal = document.getElementById("modal");
    const correct = score;
    const wrong = Math.max(0, total - score);
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

    document.getElementById("finalScoreText").textContent = `${correct} out of ${total} correct`;
    document.getElementById("finalCorrect").textContent = correct;
    document.getElementById("finalWrong").textContent = wrong;
    document.getElementById("finalAccuracy").textContent = `${accuracy}%`;

    let message = "Keep trying. Practice makes progress!";
    if (accuracy >= 90) {
        message = "Amazing work. You are a missing-letter champion!";
    } else if (accuracy >= 70) {
        message = "Great job. Your spelling is getting strong!";
    } else if (accuracy >= 50) {
        message = "Nice effort. You are improving round by round!";
    }
    document.getElementById("finalMessage").textContent = message;

    modal.style.display = "flex";
}

//------------------ Shuffle Words ------------------
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

shuffleArray(words);
// ------------------ Restart Game ------------------
function restart() {
    score = 0;
    total = 0;
    current = 0;
    dragSourceBox = null; // Reset drag state
    document.getElementById("modal").style.display = "none";
    
    // Reset hint button
    const hintBtn = document.getElementById("hintBtn");
    hintBtn.disabled = false;
    hintBtn.style.opacity = "1";
    
    updateScore();
    setupWord();
}

if (helpBtn) {
    helpBtn.addEventListener("click", openHelpModal);
}

if (startGameBtn) {
    startGameBtn.addEventListener("click", ensureGameStarted);
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

// ------------------ Initialize ------------------
if (startScreen) {
    startScreen.classList.remove("hidden");
}