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

// ------------------ Word Setup ------------------
function setupWord() {
    if (words.length === 0) return;

    const word = words[current];
    const wordContainer = document.getElementById("word");
    const optionsContainer = document.getElementById("options");

    wordContainer.innerHTML = "";
    optionsContainer.innerHTML = "";
    missingIndexes = [];

    // pick 2 missing letters (or less if word is short)
    while (missingIndexes.length < 3 && missingIndexes.length < word.length) {
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
}

function dropLetter(e) {
    const letter = e.dataTransfer.getData("text");
    e.target.textContent = letter;
}

// ------------------ Feedback Message ------------------
function showFeedback(message, isCorrect) {
    const feedback = document.getElementById("feedback");
    feedback.textContent = message;
    feedback.classList.toggle("incorrect", !isCorrect);

    feedback.style.opacity = "1";
    feedback.style.transform = "translateY(0)";

    setTimeout(() => {
        feedback.style.opacity = "0";
        feedback.style.transform = "translateY(-10px)";
    }, 3000);
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
    document.getElementById("modal").style.display = "none";
    updateScore();
    setupWord();
}

// ------------------ Initialize ------------------
setupWord();