// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCsuU8vSH5qRfcm5E78Q7KFYHFJTOTKGDM",
    authDomain: "://firebaseapp.com",
    projectId: "hangman-pi",
    storageBucket: "://appspot.com",
    messagingSenderId: "681316672354",
    appId: "1:681316672354:web:98f18d8c086729416bc23b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Game Variables
const words = ["PI", "NETWORK", "CRYPTO", "BLOCKCHAIN", "HANGMAN", "WEB3", "MINING", "WALLET", "DIGITAL", "TOKEN"];
let selectedWord = "";
let guessedLetters = [];
let mistakes = 0;
const maxMistakes = 6;
let streak = parseInt(localStorage.getItem('hangmanStreak')) || 0;

// UI Elements
const wordDisplay = document.getElementById('word-display');
const keyboard = document.getElementById('keyboard');
const message = document.getElementById('message-display');
const streakDisplay = document.getElementById('streak');
const livesDisplay = document.getElementById('lives-display');
const music = document.getElementById('bg-music');

// Start Game
function initGame() {
    selectedWord = words[Math.floor(Math.random() * words.length)];
    guessedLetters = [];
    mistakes = 0;
    message.innerText = "";
    streakDisplay.innerText = streak;
    livesDisplay.innerText = `Lives: ${maxMistakes - mistakes}`;
    renderWord();
    renderKeyboard();
}

// Show the underscores and guessed letters
function renderWord() {
    wordDisplay.innerHTML = selectedWord.split("").map(letter => 
        `<span class="letter">${guessedLetters.includes(letter) ? letter : "_"}</span>`
    ).join("");
}

// Create the A-Z buttons
function renderKeyboard() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    keyboard.innerHTML = letters.split("").map(l => 
        `<button class="key" onclick="handleGuess('${l}')" id="key-${l}">${l}</button>`
    ).join("");
}

// Check if guessed letter is correct
function handleGuess(letter) {
    if (guessedLetters.includes(letter) || mistakes >= maxMistakes) return;
    
    guessedLetters.push(letter);
    const keyButton = document.getElementById(`key-${letter}`);
    keyButton.disabled = true;

    if (selectedWord.includes(letter)) {
        keyButton.style.backgroundColor = "#4CAF50"; // Green for correct
        renderWord();
        checkWin();
    } else {
        keyButton.style.backgroundColor = "#f44336"; // Red for wrong
        mistakes++;
        livesDisplay.innerText = `Lives: ${maxMistakes - mistakes}`;
        if (mistakes >= maxMistakes) gameOver();
    }
}

// Check for win
function checkWin() {
    if (!wordDisplay.innerText.includes("_")) {
        streak++;
        localStorage.setItem('hangmanStreak', streak);
        message.innerText = "You Won! 🎉";
        syncToFirebase();
        setTimeout(initGame, 2000);
    }
}

// Check for game over
function gameOver() {
    message.innerText = `Game Over! The word was: ${selectedWord}`;
    streak = 0;
    localStorage.setItem('hangmanStreak', 0);
    syncToFirebase(); // Sync the reset streak
    setTimeout(initGame, 3000);
}

// Save score to World Ranking
function syncToFirebase() {
    // Uses a placeholder name if Pi SDK isn't signed in
    const username = localStorage.getItem('piUsername') || "Player_" + Math.floor(Math.random() * 1000);
    
    db.collection("leaderboard").doc(username).set({
        username: username,
        streak: streak,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => console.log("Score synced!"))
    .catch((error) => console.error("Error syncing score: ", error));
}

// Audio Control
function handleMusic() {
    if (music.paused) {
        music.play();
        document.getElementById('music-btn').innerText = "🔇 Mute";
    } else {
        music.pause();
        document.getElementById('music-btn').innerText = "🎵 Play Music";
    }
}

// Run game on load
initGame();
