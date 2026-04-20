// Firebase Config - Use your actual keys
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

// Game Logic
const words = ["PI", "NETWORK", "BLOCKCHAIN", "CRYPTO", "MINING", "WALLET"];
let selectedWord = "", guessedLetters = [], mistakes = 0, streak = parseInt(localStorage.getItem('hangmanStreak')) || 0;
const maxMistakes = 6, music = document.getElementById('bg-music');

// Pi Authentication
let currentUser = "Anonymous";
Pi.authenticate(['username'], (payment) => { /* handle incomplete */ }).then(res => {
    currentUser = res.user.username;
    document.getElementById('user-welcome').innerText = `Hello, ${currentUser}!`;
});

function initGame() {
    selectedWord = words[Math.floor(Math.random() * words.length)];
    guessedLetters = []; mistakes = 0;
    document.getElementById('message-display').innerText = "";
    document.getElementById('streak').innerText = streak;
    document.getElementById('lives-display').innerText = `Lives: ${maxMistakes}`;
    renderWord(); renderKeyboard();
}

function renderWord() {
    document.getElementById('word-display').innerHTML = selectedWord.split("").map(l => 
        `<span class="letter">${guessedLetters.includes(l) ? l : "_"}</span>`).join("");
}

function renderKeyboard() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    document.getElementById('keyboard').innerHTML = letters.split("").map(l => 
        `<button class="key" onclick="handleGuess('${l}')" id="key-${l}">${l}</button>`).join("");
}

function handleGuess(l) {
    if (guessedLetters.includes(l) || mistakes >= maxMistakes) return;
    guessedLetters.push(l); document.getElementById(`key-${l}`).disabled = true;
    if (selectedWord.includes(l)) { 
        renderWord(); if (!document.getElementById('word-display').innerText.includes("_")) win(); 
    } else { 
        mistakes++; document.getElementById('lives-display').innerText = `Lives: ${maxMistakes - mistakes}`;
        if (mistakes >= maxMistakes) lose(); 
    }
}

function win() {
    streak++; localStorage.setItem('hangmanStreak', streak);
    document.getElementById('message-display').innerText = "Winner! 🎉";
    syncLeaderboard(); setTimeout(initGame, 2000);
}

function lose() {
    streak = 0; localStorage.setItem('hangmanStreak', 0);
    document.getElementById('message-display').innerText = `Over! Word: ${selectedWord}`;
    syncLeaderboard(); setTimeout(initGame, 3000);
}

function syncLeaderboard() {
    db.collection("leaderboard").doc(currentUser).set({
        username: currentUser, streak: streak, lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

// Pi Payment for Hint
function requestHint() {
    Pi.createPayment({
        amount: 1,
        memo: "Purchase one letter hint for Hangman",
        metadata: { type: "hint" }
    }, {
        onReadyForServerApproval: (id) => { /* call your server to approve */ },
        onReadyForServerCompletion: (id, txid) => { revealHint(); },
        onCancel: () => {},
        onError: (e) => {}
    });
}

function revealHint() {
    const hidden = selectedWord.split("").filter(l => !guessedLetters.includes(l));
    if (hidden.length > 0) handleGuess(hidden[0]);
}

function handleMusic() {
    if (music.paused) { music.play(); document.getElementById('music-btn').innerText = "🔇 Mute"; }
    else { music.pause(); document.getElementById('music-btn').innerText = "🎵 Play Music"; }
}

initGame();
