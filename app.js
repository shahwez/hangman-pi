// --- FIREBASE INITIALIZATION ---
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

// --- GAME VARIABLES ---
const wordList = [
    "PI", "NETWORK", "BLOCKCHAIN", "CRYPTO", "MINING", "WALLET", "DIGITAL", 
    "TOKEN", "CURRENCY", "STREAK", "HANGMAN", "DEVELOPER", "BROWSER", 
    "SECURITY", "FIREBASE", "GITHUB", "STATION", "PIONEER", "MAINNET"
];

let selectedWord = "";
let guessedLetters = [];
let mistakes = 0;
const maxMistakes = 6;
let currentStreak = parseInt(localStorage.getItem('hangmanStreak')) || 0;
let piUsername = "Guest_Player";

// --- PI NETWORK AUTHENTICATION ---
const Pi = window.Pi;
Pi.init({ version: "2.0" });

async function authPiUser() {
    try {
        const scopes = ['username'];
        const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
        piUsername = auth.user.username;
        document.getElementById('user-display').innerText = "Playing as: " + piUsername;
    } catch (err) {
        console.error("Pi Auth failed:", err);
        document.getElementById('user-display').innerText = "Playing as Guest";
    }
}

function onIncompletePaymentFound(payment) {
    console.log("Incomplete payment found:", payment);
}

// --- CORE GAME LOGIC ---
function initGame() {
    // Pick a random word
    selectedWord = wordList[Math.floor(Math.random() * wordList.length)];
    guessedLetters = [];
    mistakes = 0;
    
    // Reset UI
    document.getElementById('message-display').innerText = "";
    document.getElementById('streak-count').innerText = currentStreak;
    document.getElementById('lives-count').innerText = maxMistakes - mistakes;
    
    renderWord();
    renderKeyboard();
}

function renderWord() {
    let displayString = "";
    for (let i = 0; i < selectedWord.length; i++) {
        let letter = selectedWord[i];
        if (guessedLetters.includes(letter)) {
            displayString += `<span class="letter">${letter}</span>`;
        } else {
            displayString += `<span class="letter">_</span>`;
        }
    }
    document.getElementById('word-display').innerHTML = displayString;
}

function renderKeyboard() {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let keyboardHTML = "";
    for (let i = 0; i < alphabet.length; i++) {
        let char = alphabet[i];
        keyboardHTML += `<button class="key" id="btn-${char}" onclick="makeGuess('${char}')">${char}</button>`;
    }
    document.getElementById('keyboard-container').innerHTML = keyboardHTML;
}

function makeGuess(letter) {
    if (guessedLetters.includes(letter)) return;

    guessedLetters.push(letter);
    const btn = document.getElementById(`btn-${letter}`);
    btn.disabled = true;

    if (selectedWord.includes(letter)) {
        btn.classList.add("correct");
        renderWord();
        checkWin();
    } else {
        btn.classList.add("wrong");
        mistakes++;
        document.getElementById('lives-count').innerText = maxMistakes - mistakes;
        if (mistakes >= maxMistakes) {
            handleGameOver();
        }
    }
}

function checkWin() {
    const currentDisplay = document.getElementById('word-display').innerText.replace(/\s/g, '');
    if (currentDisplay === selectedWord) {
        currentStreak++;
        localStorage.setItem('hangmanStreak', currentStreak);
        document.getElementById('message-display').innerText = "WINNER! 🎉";
        saveToLeaderboard();
        setTimeout(initGame, 2000);
    }
}

function handleGameOver() {
    document.getElementById('message-display').innerText = "GAME OVER! Word was: " + selectedWord;
    currentStreak = 0;
    localStorage.setItem('hangmanStreak', 0);
    saveToLeaderboard();
    setTimeout(initGame, 3000);
}

// --- LEADERBOARD SYNC ---
function saveToLeaderboard() {
    db.collection("leaderboard").doc(piUsername).set({
        username: piUsername,
        streak: currentStreak,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

// --- PI PAYMENT (HINT) ---
async function buyHint() {
    try {
        const payment = await Pi.createPayment({
            amount: 0.1, // You can set this to 1 or 0.1
            memo: "Buy a hint for Hangman",
            metadata: { type: "hint_purchase" },
        }, {
            onReadyForServerApproval: (id) => { console.log("Approval pending:", id); },
            onReadyForServerCompletion: (id, txid) => { 
                console.log("Payment Complete!");
                revealOneLetter();
            },
            onCancel: (id) => { console.log("Payment cancelled"); },
            onError: (error, id) => { console.error("Payment error", error); }
        });
    } catch (err) {
        console.error("Payment setup failed", err);
    }
}

function revealOneLetter() {
    for (let i = 0; i < selectedWord.length; i++) {
        if (!guessedLetters.includes(selectedWord[i])) {
            makeGuess(selectedWord[i]);
            break;
        }
    }
}

// --- MUSIC CONTROL ---
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

// Start everything
authPiUser();
initGame();
