// 1. DATA & SDK
Pi.init({ version: "2.0", sandbox: false });

const categories = {
    countries: { 
        easy: ["india", "usa", "china", "japan", "france", "brazil", "spain", "mexico", "egypt", "thailand"], 
        medium: ["norway", "sweden", "canada", "turkey", "vietnam", "poland", "greece", "chile", "peru", "belgium"], 
        hard: ["kazakhstan", "azerbaijan", "uzbekistan", "kyrgyzstan", "lithuania", "cambodia", "paraguay", "suriname", "eritrea", "vanuatu"] 
    },
    cities: { 
        easy: ["dubai", "paris", "rome", "london", "tokyo", "mumbai", "delhi", "sydney", "berlin", "seoul"], 
        medium: ["istanbul", "jakarta", "manila", "madrid", "vienna", "zurich", "lisbon", "athens", "prague", "milan"], 
        hard: ["reykjavik", "luxembourg", "wellington", "bratislava", "vladivostok", "kathmandu", "ashgabat", "podgorica", "ljubljana"] 
    },
    soccer: { 
        easy: ["messi", "ronaldo", "pele", "maradona", "kaka", "salah", "halland", "kane", "puyol", "beckham"], 
        medium: ["modric", "xavi", "iniesta", "benzema", "suarez", "aguero", "ramos", "neuer", "buffon", "hazard"], 
        hard: ["donnarumma", "ibrahimovic", "maldini", "totti", "pirlo", "seedorf", "gullit", "yashin", "puskas", "eusebio"] 
    },
    cricket: { 
        easy: ["kohli", "dhoni", "sachin", "rohit", "babar", "smith", "root", "stokes", "abd", "bumrah"], 
        medium: ["lara", "warne", "ponting", "kallis", "dravid", "akram", "steyn", "gilchrist", "amla", "vettori"], 
        hard: ["muralitharan", "sangakkara", "gavaskar", "imran khan", "border", "richards", "sobers", "mcgrath", "ambrose"] 
    },
    hollywood: { 
        easy: ["jaws", "rocky", "avatar", "titanic", "frozen", "batman", "joker", "avengers", "shrek", "alien"], 
        medium: ["matrix", "thor", "inception", "deadpool", "ironman", "mulan", "hercules", "cinderella", "toy story", "predator"], 
        hard: ["interstellar", "pulp fiction", "goodfellas", "gladiator", "godfather", "fight club", "memento", "whiplash", "parasite"] 
    },
    bollywood: { 
        easy: ["sholay", "dangal", "don", "pk", "war", "sultan", "pathaan", "wanted", "jawan", "brahmastra"], 
        medium: ["lagaan", "barfi", "jawan", "badshah", "kal ho naa ho", "chak de india", "hera pheri", "tamasha", "queen"], 
        hard: ["tamasha", "andhadhun", "rockstar", "drishyam", "gangs of wasseypur", "madaari", "haider", "swades", "devdas"] 
    }
};

const firebaseConfig = {
    apiKey: "AIzaSyCsuU8vSH5qRfcm5E78Q7KFYHFJTOTKGDM",
    authDomain: "://firebaseapp.com",
    projectId: "hangman-pi",
    storageBucket: "hangman-pi.firebasestorage.app",
    messagingSenderId: "681316672354",
    appId: "1:681316672354:web:98f18d8c086729416bc23b"
};

let db, currentUser = null, selectedWord = "", guessed = [], attempts = 6, score = 0, streak = 0;
const canvas = document.getElementById("hangmanCanvas");
const ctx = canvas.getContext("2d");

window.onload = () => {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        loadScores();
    }
    document.getElementById('playerStatus').innerText = "GUEST MODE";
    drawHangman(6);
};

// 2. PI AUTH (STRICT HANDSHAKE)
async function authPi() {
    try {
        const auth = await Pi.authenticate(['username', 'payments'], (p) => {});
        currentUser = auth.user.username;
        document.getElementById('playerStatus').innerText = "AGENT: " + currentUser.toUpperCase();
        document.getElementById('loginBtn').style.display = 'none';
    } catch (err) {
        alert("Domain Handshake Error! Verify your URL in Pi Portal matches your browser address bar exactly.");
    }
}

// 3. HINT (0.01 PI)
async function buyHint() {
    if (!currentUser) return alert("Login first!");
    Pi.createPayment({ amount: 0.01, memo: "Elite Hint", metadata: { type: "hint" } }, 
    { onReadyForServerApproval: (id) => {}, onReadyForServerCompletion: (id, tx) => {
        const untried = selectedWord.split("").filter(l => !guessed.includes(l.toLowerCase()) && l !== " ");
        if (untried.length > 0) { guessed.push(untried[0].toLowerCase()); renderWord(); }
    }, onCancel: (id) => {}, onError: (e) => {} });
}

// 4. GAME ENGINE
function startGame() {
    if (!currentUser) return alert("Identify yourself! (Login with Pi)");
    const cat = document.getElementById("category").value;
    const diff = document.getElementById("difficulty").value;
    setupGame(categories[cat][diff]);
}

function startDailyQuiz() {
    if (!currentUser) return alert("Login with Pi first!");
    const allHard = [];
    Object.keys(categories).forEach(c => allHard.push(...categories[c].hard));
    setupGame(allHard);
    document.getElementById("status").textContent = "📅 DAILY CHALLENGE ACTIVE";
}

function setupGame(wordList) {
    document.getElementById("bgmusic").play().catch(() => {});
    selectedWord = wordList[Math.floor(Math.random() * wordList.length)];
    guessed = []; attempts = 6;
    document.getElementById("letters").innerHTML = "";
    document.getElementById("status").textContent = "";
    drawHangman(6); createButtons(); renderWord();
}

function createButtons() {
    "abcdefghijklmnopqrstuvwxyz".split("").forEach(l => {
        let btn = document.createElement("button");
        btn.textContent = l.toUpperCase();
        btn.onclick = () => {
            btn.disabled = true;
            if (selectedWord.toLowerCase().includes(l)) { guessed.push(l); } 
            else { attempts--; drawHangman(attempts); }
            renderWord();
            if (attempts <= 0) {
                document.getElementById("status").textContent = "TERMINATED. WORD: " + selectedWord.toUpperCase();
                streak = 0; updateStats();
                document.querySelectorAll(".keyboard button").forEach(b => b.disabled = true);
            }
        };
        document.getElementById("letters").appendChild(btn);
    });
}

function renderWord() {
    let display = selectedWord.split("").map(l => (l === " " ? " " : (guessed.includes(l.toLowerCase()) ? l : "_"))).join(" ");
    document.getElementById("word").textContent = display.toUpperCase();
    if (!display.includes("_") && selectedWord !== "") {
        document.getElementById("status").textContent = "MISSION ACCOMPLISHED! 🎉";
        
        // STREAK BONUS LOGIC
        let baseWin = 50;
        let bonus = Math.min(streak * 10, 50); // Max 50% bonus
        score += baseWin + (baseWin * (bonus / 100));
        
        streak++;
        updateStats();
        saveScore();
    }
}

function drawHangman(rem) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#00f2fe"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(40, 140); ctx.lineTo(160, 140); ctx.moveTo(60, 140); ctx.lineTo(60, 20);
    ctx.lineTo(120, 20); ctx.lineTo(120, 40); ctx.stroke();
    if (rem < 6) { ctx.beginPath(); ctx.arc(120, 52, 12, 0, Math.PI*2); ctx.stroke(); }
    if (rem < 5) { ctx.beginPath(); ctx.moveTo(120, 64); ctx.lineTo(120, 100); ctx.stroke(); }
    if (rem < 4) { ctx.beginPath(); ctx.moveTo(120, 75); ctx.lineTo(100, 95); ctx.stroke(); }
    if (rem < 3) { ctx.beginPath(); ctx.moveTo(120, 75); ctx.lineTo(140, 95); ctx.stroke(); }
    if (rem < 2) { ctx.beginPath(); ctx.moveTo(120, 100); ctx.lineTo(105, 130); ctx.stroke(); }
    if (rem < 1) { ctx.beginPath(); ctx.moveTo(120, 100); ctx.lineTo(135, 130); ctx.stroke(); }
}

function updateStats() {
    document.getElementById("score").textContent = Math.floor(score);
    document.getElementById("streak").textContent = streak;
    let bonus = Math.min(streak * 10, 50);
    document.getElementById("bonusText").innerText = streak > 0 ? `+${bonus}% BONUS` : "";
}

function saveScore() {
    if(db && currentUser) db.collection("scores").add({ name: currentUser, score: score, date: new Date() });
    setTimeout(loadScores, 2000);
}

function loadScores() {
    if(!db) return;
    db.collection("scores").orderBy("score","desc").limit(10).get().then(snap => {
        const list = document.getElementById("scores"); list.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data(); const li = document.createElement("li");
            li.innerHTML = `<span>${d.name}</span> <strong>${Math.floor(d.score)}</strong>`; list.appendChild(li);
        });
    });
}

function toggleMute() {
    const m = document.getElementById("bgmusic");
    m.muted = !m.muted;
    document.getElementById("muteBtn").textContent = m.muted ? "🔇" : "🔊";
}
