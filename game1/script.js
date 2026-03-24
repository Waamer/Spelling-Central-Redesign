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

    letters.forEach(letter => {
        const div = document.createElement("div");
        div.classList.add("draggable");
        div.textContent = letter;
        div.draggable = true;
        div.ondragstart = dragLetter;
        optionsContainer.appendChild(div);
    });
}

// ------------------ Drag & Drop ------------------
function dragLetter(e) {
    e.dataTransfer.setData("text", e.target.textContent);
    e.dataTransfer.setData("source", "option");
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
    const letter = e.dataTransfer.getData("text");
    const source = e.dataTransfer.getData("source");
    
    // Set the letter in the destination box
    e.target.textContent = letter;
    
    // If dragging from another box, clear it
    if (source === "box" && dragSourceBox && dragSourceBox !== e.target) {
        dragSourceBox.textContent = "";
    }
    
    dragSourceBox = null;
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
    modal.style.display = "flex";
    document.getElementById("finalScore").textContent =
        `You got ${score} out of ${total}`;
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

// ------------------ Initialize ------------------
setupWord();