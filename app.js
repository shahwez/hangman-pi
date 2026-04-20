// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyCsuU8vSH5qRfcm5E78Q7KFYHFJTOTKGDM",
    authDomain: "://firebaseapp.com",
    projectId: "hangman-pi",
    storageBucket: "://appspot.com",
    messagingSenderId: "681316672354",
    appId: "1:681316672354:web:98f18d8c086729416bc23b"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- CATEGORIES & WORDS ---
const gameData = {
    "Crypto": ["BITCOIN", "ETHEREUM", "BLOCKCHAIN", "WALLET", "MINING"],
    "Pi Network": ["PIONEER", "MAINNET", "BROWSER", "NODE", "SECURITY"],
    "Animals": ["ELEPHANT", "GIRAFFE", "TIGER", "KANGAROO", "PENGUIN"],
    "Countries": ["BRAZIL", "CANADA", "GERMANY", "JAPAN", "NIGERIA"]
};

let selectedWord = "";
let guessedLetters = [];
let mistakes = 0;
const maxMistakes = 6;
let currentStreak = parseInt(localStorage.getItem('hangmanStreak')) || 0;

// --- GAME ENGINE ---
function initGame() {
    // 1. Pick a random category
    const categories = Object.keys(gameData);
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    // 2. Pick a random word from that category
    const words = gameData[category];
    selectedWord = words[Math.floor(Math.random() * words.length)];
    
    guessedLetters = [];
    mistakes = 0;

    // 3. Update UI
    document.getElementById('category-name').innerText = "Category: " + category;
    document.getElementById('streak-count').innerText = currentStreak;
    document.getElementById('lives-count').innerText = maxMistakes - mistakes;
    document.getElementById('message-display').innerText = "";

    renderWord();
    renderKeyboard();
}

function renderWord() {
    const display = selectedWord.split("").map(l => 
        `<span class="letter">${guessedLetters.includes(l) ? l : "_"}</span>`
    ).join("");
    document.getElementById('word-display').innerHTML = display;
}

function renderKeyboard() {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const kb = alphabet.split("").map(l => 
        `<button class="key" id="btn-${l}" onclick="makeGuess('${l}')">${l}</button>`
    ).join("");
    document.getElementById('keyboard-container').innerHTML = kb;
}

function makeGuess(letter) {
    if (guessedLetters.includes(letter) || mistakes >= maxMistakes) return;
    guessedLetters.push(letter);
    const btn = document.getElementById(`btn-${letter}`);
    if (btn) btn.disabled = true;

    if (selectedWord.includes(letter)) {
        if (btn) btn.style.background = "#4CAF50";
        renderWord();
        if (document.getElementById('word-display').innerText.replace(/\s/g, '') === selectedWord) win();
    } else {
        if (btn) btn.style.background = "#f44336";
        mistakes++;
        document.getElementById('lives-count').innerText = maxMistakes - mistakes;
        if (mistakes >= maxMistakes) lose();
    }
}

function win() {
    currentStreak++;
    localStorage.setItem('hangmanStreak', currentStreak);
    document.getElementById('message-display').innerText = "WINNER! 🎉";
    setTimeout(initGame, 2000);
}

function lose() {
    document.getElementById('message-display').innerText = "Word was: " + selectedWord;
    currentStreak = 0;
    localStorage.setItem('hangmanStreak', 0);
    setTimeout(initGame, 3000);
}

// --- MUSIC FIX ---
const music = document.getElementById('bg-music');
function toggleMusic() {
    // Browsers block music until a user clicks something
    if (music.paused) {
        music.play().catch(err => alert("Please interact with the page first to play music!"));
        document.getElementById('music-btn').innerText = "🔇 Stop Music";
    } else {
        music.pause();
        document.getElementById('music-btn').innerText = "🎵 Play Music";
    }
}

// Start Game
initGame();
