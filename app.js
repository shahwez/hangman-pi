// Pi SDK Initialization
const Pi = window.Pi;
Pi.init({ version: "2.0" });

// Your Firebase Config
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

const words = ["PI", "NETWORK", "CRYPTO", "BLOCKCHAIN", "HANGMAN", "WEB3", "MINING", "WALLET"];
let selectedWord = "";
let guessedLetters = [];
let mistakes = 0;
const maxMistakes = 6;
let streak = parseInt(localStorage.getItem('hangmanStreak')) || 0;

const wordDisplay = document.getElementById('word-display');
const keyboard = document.getElementById('keyboard');
const message = document.getElementById('message-display');
const streakDisplay = document.getElementById('streak');
const music = document.getElementById('bg-music');

function initGame() {
    selectedWord = words[Math.floor(Math.random() * words.length)];
    guessedLetters = [];
    mistakes = 0;
    message.innerText = "";
    streakDisplay.innerText = streak;
    renderWord();
    renderKeyboard();
}

function renderWord() {
    wordDisplay.innerHTML = selectedWord.split("").map(letter => 
        `<span class="letter">${guessedLetters.includes(letter) ? letter : "_"}</span>`
    ).join("");
}

function renderKeyboard() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    keyboard.innerHTML = letters.split("").map(l => 
        `<button class="key" onclick="handleGuess('${l}')" id="key-${l}">${l}</button>`
    ).join("");
}

function handleGuess(letter) {
    if (guessedLetters.includes(letter) || mistakes >= maxMistakes) return;
    guessedLetters.push(letter);
    document.getElementById(`key-${letter}`).disabled = true;

    if (selectedWord.includes(letter)) {
        renderWord();
        if (!wordDisplay.innerText.includes("_")) {
            streak++;
            localStorage.setItem('hangmanStreak', streak);
            message.innerText = "You Won! 🎉";
            syncToFirebase();
            setTimeout(initGame, 2000);
        }
    } else {
        mistakes++;
        if (mistakes >= maxMistakes) {
            message.innerText = `Game Over! Word: ${selectedWord}`;
            streak = 0;
            localStorage.setItem('hangmanStreak', 0);
            syncToFirebase();
            setTimeout(initGame, 3000);
        }
    }
}

function syncToFirebase() {
    // Attempt to get real Pi Username, fallback to Player_ID
    Pi.authenticate(['username'], (payment) => {}).then(function(auth) {
        const username = auth.user.username;
        db.collection("leaderboard").doc(username).set({
            username: username,
            streak: streak,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }).catch(function(error) {
        const fallback = "Player_" + Math.floor(Math.random() * 1000);
        db.collection("leaderboard").doc(fallback).set({
            username: fallback,
            streak: streak
        }, { merge: true });
    });
}

function handleMusic() {
    if (music.paused) {
        music.play().catch(e => console.log("Music blocked by browser"));
        document.getElementById('music-btn').innerText = "🔇 Mute";
    } else {
        music.pause();
        document.getElementById('music-btn').innerText = "🎵 Play Music";
    }
}

initGame();
