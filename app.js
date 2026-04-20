// --- 1. FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyCsuU8vSH5qRfcm5E78Q7KFYHFJTOTKGDM",
    authDomain: "://firebaseapp.com",
    projectId: "hangman-pi",
    storageBucket: "://appspot.com",
    messagingSenderId: "681316672354",
    appId: "1:681316672354:web:98f18d8c086729416bc23b"
};

// Initialize Firebase with Error Catching
try {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
} catch (e) {
    console.log("Firebase not ready yet");
}

// --- 2. GAME VARIABLES ---
const wordList = ["PI", "NETWORK", "BLOCKCHAIN", "CRYPTO", "MINING", "WALLET", "DIGITAL", "TOKEN"];
let selectedWord = "";
let guessedLetters = [];
let mistakes = 0;
const maxMistakes = 6;
let currentStreak = parseInt(localStorage.getItem('hangmanStreak')) || 0;
let piUsername = "Guest_" + Math.floor(Math.random() * 1000);

// --- 3. PI SDK ---
try {
    const Pi = window.Pi;
    Pi.init({ version: "2.0" });
    Pi.authenticate(['username'], (payment) => {}).then(res => {
        piUsername = res.user.username;
        document.getElementById('user-display').innerText = "Player: " + piUsername;
    });
} catch (e) {
    console.log("Not in Pi Browser");
}

// --- 4. THE GAME ENGINE (CRITICAL) ---
function initGame() {
    console.log("Game Initializing...");
    selectedWord = wordList[Math.floor(Math.random() * wordList.length)];
    guessedLetters = [];
    mistakes = 0;

    // Force Update UI
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
        checkWin();
    } else {
        if (btn) btn.style.background = "#f44336";
        mistakes++;
        document.getElementById('lives-count').innerText = maxMistakes - mistakes;
        if (mistakes >= maxMistakes) gameOver();
    }
}

function checkWin() {
    const currentText = document.getElementById('word-display').innerText.replace(/\s/g, '');
    if (currentText === selectedWord) {
        currentStreak++;
        localStorage.setItem('hangmanStreak', currentStreak);
        document.getElementById('message-display').innerText = "WINNER! 🎉";
        saveScore();
        setTimeout(initGame, 2000);
    }
}

function gameOver() {
    document.getElementById('message-display').innerText = "Game Over! Word: " + selectedWord;
    currentStreak = 0;
    localStorage.setItem('hangmanStreak', 0);
    saveScore();
    setTimeout(initGame, 3000);
}

function saveScore() {
    if (db) {
        db.collection("leaderboard").doc(piUsername).set({
            username: piUsername,
            streak: currentStreak,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
}

// Payment/Hint Logic
async function buyHint() {
    try {
        await Pi.createPayment({
            amount: 0.1,
            memo: "Buy Hint",
            metadata: { type: "hint" }
        }, {
            onReadyForServerApproval: (id) => {},
            onReadyForServerCompletion: (id, txid) => {
                const remaining = selectedWord.split("").filter(l => !guessedLetters.includes(l));
                if (remaining.length > 0) makeGuess(remaining[0]);
            },
            onCancel: () => {},
            onError: () => {}
        });
    } catch (e) { alert("Payment only works in Pi Browser"); }
}

const music = document.getElementById('bg-music');
function toggleMusic() {
    if (music.paused) {
        music.play();
        document.getElementById('music-btn').innerText = "🔇 Mute";
    } else {
        music.pause();
        document.getElementById('music-btn').innerText = "🎵 Music";
    }
}

// START THE GAME MANUALLY
initGame();
