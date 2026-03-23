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

    if (mode === "custom") {
        try {
            selectedList = JSON.parse(localStorage.getItem("spellingcentral_selected_list") || "null");
        } catch (error) {
            selectedList = null;
        }
    }

    const selectedWords = Array.isArray(selectedList?.words) ? selectedList.words : [];
    const allLibraryWords = (dataSource.baseLibraries || []).flatMap((list) =>
        Array.isArray(list.words) ? list.words : []
    );

    const sourceWords = selectedWords.length >= 4 ? selectedWords : allLibraryWords;
    const normalized = uniqueNormalizedWords(sourceWords);

    if (normalized.length >= 4) {
        return normalized;
    }

    // Final fallback keeps the game playable even if storage data is missing.
    return uniqueNormalizedWords([
        ...allLibraryWords,
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
