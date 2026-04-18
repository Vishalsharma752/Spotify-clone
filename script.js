console.log("🎵 Spotify JS Loaded");

// ===== STATE =====
let songs = [];
let audio = new Audio();
let currentIndex = 0;
let isDragging = false;
let isShuffled = false;
let isRepeating = false;
let likedSongs = JSON.parse(localStorage.getItem("likedSongs") || "[]");

// ===== DOM =====
const playbar      = document.querySelector(".playbar");
const progress     = document.querySelector(".progress");
const songtime     = document.querySelector(".songtime");
const progressBar  = document.querySelector(".progressbar");
const volumeSlider = document.getElementById("volumeSlider");
const waves        = document.querySelectorAll(".volume-waves span");
const playBtn2     = document.getElementById("playBtn2");
const nextBtn      = document.getElementById("nextBtn");
const prevBtn      = document.getElementById("prevBtn");

// ===== FETCH SONGS =====
async function getSongs() {
    songs = [
        "songs/Bairan.mp3",
        "songs/Blue Eyes.mp3",
        "songs/Chatak Matak.mp3",
        "songs/Ghar Kab Aaoge.mp3",
        "songs/kya Baat Ay.mp3",
        "songs/Mohtarma.mp3",
        "songs/Roots.mp3",
        "songs/Sheesha.mp3",
        "songs/White Brown Black.mp3"
    ];
}

// ===== UTILS =====
function cleanName(song) {
    return decodeURIComponent(song.split("/").pop().replace(".mp3", ""));
}

function formatTime(sec) {
    if (isNaN(sec) || sec === Infinity) return "00:00";
    let m = Math.floor(sec / 60);
    let s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" + s : s}`;
}

// ===== TOAST NOTIFICATION =====
function showToast(msg) {
    let toast = document.createElement("div");
    toast.innerText = msg;
    toast.style.cssText = `
        position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
        background: #1db954; color: #000; font-weight: 600;
        padding: 10px 20px; border-radius: 999px;
        font-size: 13px; z-index: 9999;
        animation: fadeInOut 2.5s ease forwards;
        white-space: nowrap;
    `;
    if (!document.getElementById("toastStyle")) {
        let style = document.createElement("style");
        style.id = "toastStyle";
        style.innerHTML = `
            @keyframes fadeInOut {
                0%   { opacity: 0; transform: translateX(-50%) translateY(10px); }
                15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
                80%  { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
}

// ===== PLAY SONG =====
function playSong(index) {
    if (!songs.length) return;

    currentIndex = index;
    audio.src = songs[index];
    audio.play();

    playbar.classList.add("active");
    playBtn2.src = "pause.svg";

    document.querySelector(".songinfo").innerText = cleanName(songs[index]);

    setActiveSong(index);
    updateCardButtons(index);
    updateLikeBtn();
    showToast("▶ " + cleanName(songs[index]));

    // 💾 Save last played
    localStorage.setItem("lastPlayed", JSON.stringify({ index, src: songs[index] }));

    // 🎵 Start visualizer
    startVisualizer();
}

// ===== TOGGLE PLAY =====
function togglePlay() {
    if (!audio.src && songs.length) {
        playSong(0);
        return;
    }
    if (audio.paused) {
        audio.play();
        playBtn2.src = "pause.svg";
        startVisualizer();
    } else {
        audio.pause();
        playBtn2.src = "play.png";
    }
}

// ===== NEXT / PREV =====
function nextSong() {
    if (!songs.length) return;
    if (isShuffled) {
        let next;
        do { next = Math.floor(Math.random() * songs.length); }
        while (next === currentIndex && songs.length > 1);
        playSong(next);
    } else {
        playSong((currentIndex + 1) % songs.length);
    }
}

function prevSong() {
    if (!songs.length) return;
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    playSong((currentIndex - 1 + songs.length) % songs.length);
}

// ===== 🔀 SHUFFLE =====
function toggleShuffle() {
    isShuffled = !isShuffled;
    let btn = document.getElementById("shuffleBtn");
    if (btn) {
        btn.style.color      = isShuffled ? "#1db954" : "#fff";
        btn.style.textShadow = isShuffled ? "0 0 8px #1db954" : "none";
    }

}

// ===== 🔁 REPEAT =====
function toggleRepeat() {
    isRepeating = !isRepeating;
    let btn = document.getElementById("repeatBtn");
    if (btn) {
        btn.style.color      = isRepeating ? "#1db954" : "#fff";
        btn.style.textShadow = isRepeating ? "0 0 8px #1db954" : "none";
    }

}

// ===== 💚 LIKE SONG =====
function toggleLike(songName) {
    if (likedSongs.includes(songName)) {
        likedSongs = likedSongs.filter(s => s !== songName);
        showToast("💔 Removed from Liked Songs");
    } else {
        likedSongs.push(songName);
        showToast("💚 Added to Liked Songs");
    }
    localStorage.setItem("likedSongs", JSON.stringify(likedSongs));
    updateLikeBtn();
    showSongs();
}

function updateLikeBtn() {
    let btn = document.getElementById("likeCurrentBtn");
    if (!btn || !songs.length) return;
    btn.innerText = likedSongs.includes(cleanName(songs[currentIndex])) ? "💚" : "🤍";
}

// ===== 🔍 SEARCH =====
function filterSongs(query) {
    document.querySelectorAll(".songList li").forEach(li => {
        let name = li.querySelector("span") ? li.querySelector("span").innerText.toLowerCase() : "";
        li.style.display = name.includes(query.toLowerCase()) ? "" : "none";
    });
}

// ===== SHOW SONGS IN LIBRARY =====
function showSongs() {
    let ul = document.querySelector(".songList ul");
    ul.innerHTML = "";

    songs.forEach((song, i) => {
        let name = cleanName(song);
        let isLiked = likedSongs.includes(name);
        let li = document.createElement("li");
        li.innerHTML = `
        <div class="songItem">
            <div class="leftPart">
                <img src="music.svg">
                <span>${name}</span>
            </div>
            <div class="rightPart">
                <span class="likeBtn" data-name="${name}"
                    style="cursor:pointer; font-size:15px; user-select:none;">
                    ${isLiked ? "💚" : "🤍"}
                </span>
                <img src="play.svg" class="songPlayIcon">
            </div>
        </div>`;

        li.querySelector(".likeBtn").addEventListener("click", (e) => {
            e.stopPropagation();
            toggleLike(name);
        });

        li.addEventListener("click", () => playSong(i));
        ul.appendChild(li);
    });
}

// ===== HIGHLIGHT ACTIVE SONG =====
function setActiveSong(index) {
    document.querySelectorAll(".songItem").forEach((el, i) => {
        el.classList.toggle("active", i === index);
    });
}

// ===== UPDATE CARD PLAY BUTTONS =====
function updateCardButtons(activeIndex) {
    document.querySelectorAll(".big-play").forEach((btn, i) => {
        btn.innerHTML = i === activeIndex && !audio.paused ? "⏸" : "▶";
        btn.classList.toggle("active", i === activeIndex && !audio.paused);
    });
}

// ===== PROGRESS BAR =====
audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    let percent = (audio.currentTime / audio.duration) * 100;
    progress.style.width = percent + "%";
    songtime.innerText = formatTime(audio.currentTime) + " / " + formatTime(audio.duration);
});

progressBar.addEventListener("click", (e) => {
    if (!audio.duration) return;
    audio.currentTime = (e.offsetX / progressBar.clientWidth) * audio.duration;
});

progressBar.addEventListener("mousedown", (e) => { isDragging = true; updateSeek(e); });
document.addEventListener("mousemove",    (e) => { if (isDragging) updateSeek(e); });
document.addEventListener("mouseup",      ()  => { isDragging = false; });

function updateSeek(e) {
    if (!audio.duration) return;
    let rect = progressBar.getBoundingClientRect();
    let percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = percent * audio.duration;
}

// ===== AUTO NEXT / REPEAT =====
audio.addEventListener("ended", () => {
    if (isRepeating) { audio.currentTime = 0; audio.play(); }
    else nextSong();
});

audio.addEventListener("play",  () => { updateCardButtons(currentIndex); playBtn2.src = "pause.svg"; });
audio.addEventListener("pause", () => { updateCardButtons(currentIndex); playBtn2.src = "play.png";  });

// ===== VOLUME =====
volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
    waves.forEach(wave => {
        wave.style.transform = `scaleY(${Math.max(0.3, audio.volume) * 2})`;
        wave.style.opacity   = audio.volume == 0 ? "0.2" : "1";
    });
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener("keydown", (e) => {
    if (document.activeElement.tagName === "INPUT") return;
    switch (e.code) {
        case "Space":      e.preventDefault(); togglePlay(); break;
        case "ArrowRight": nextSong();  break;
        case "ArrowLeft":  prevSong();  break;
        case "ArrowUp":
            audio.volume = Math.min(1, audio.volume + 0.1);
            volumeSlider.value = audio.volume;
            break;
        case "ArrowDown":
            audio.volume = Math.max(0, audio.volume - 0.1);
            volumeSlider.value = audio.volume;
            break;
        case "KeyS": toggleShuffle(); break;
        case "KeyR": toggleRepeat();  break;
        case "KeyL": if (songs.length) toggleLike(cleanName(songs[currentIndex])); break;
    }
});

// ===== CARD PLAY BUTTONS =====
document.querySelectorAll(".big-play").forEach((btn, i) => {
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentIndex === i && !audio.paused) audio.pause();
        else playSong(i);
    });
});

// ===== 🎵 VISUALIZER =====
let audioCtx, analyser, dataArray, animFrameId;

function startVisualizer() {
    let canvas = document.getElementById("visualizer");
    if (!canvas) return;
    let ctx = canvas.getContext("2d");

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let source = audioCtx.createMediaElementSource(audio);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    }

    if (audioCtx.state === "suspended") audioCtx.resume();
    if (animFrameId) cancelAnimationFrame(animFrameId);

    function draw() {
        animFrameId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let barWidth = (canvas.width / dataArray.length) * 2;
        let x = 0;
        dataArray.forEach(val => {
            let barHeight = (val / 255) * canvas.height;
            let g = Math.floor((val / 255) * 100 + 100);
            ctx.fillStyle = `rgb(29,${g},84)`;
            ctx.beginPath();
            ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, 3);
            ctx.fill();
            x += barWidth;
        });
    }
    draw();
}

// ===== 👤 LOGIN MODAL =====
function showLoginModal() {
    if (document.getElementById("loginModal")) {
        document.getElementById("loginModal").style.display = "flex";
        return;
    }
    let modal = document.createElement("div");
    modal.id = "loginModal";
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.85);
        display:flex;align-items:center;justify-content:center;
        z-index:99999;backdrop-filter:blur(10px);`;
    modal.innerHTML = `
        <div style="background:#121212;border:1px solid rgba(255,255,255,0.1);
            border-radius:16px;padding:40px 36px;width:320px;
            display:flex;flex-direction:column;gap:14px;
            box-shadow:0 20px 60px rgba(0,0,0,0.8);">
            <h2 style="color:#fff;text-align:center;font-size:22px;">Log in to Spotify</h2>
            <input id="loginEmail" type="email" placeholder="Email address"
                style="background:#2a2a2a;border:1px solid #444;color:#fff;
                padding:12px 16px;border-radius:8px;font-size:14px;outline:none;"
                onfocus="this.style.borderColor='#1db954'" onblur="this.style.borderColor='#444'">
            <input id="loginPass" type="password" placeholder="Password"
                style="background:#2a2a2a;border:1px solid #444;color:#fff;
                padding:12px 16px;border-radius:8px;font-size:14px;outline:none;"
                onfocus="this.style.borderColor='#1db954'" onblur="this.style.borderColor='#444'">
            <button onclick="handleLogin()"
                style="background:#1db954;color:#000;font-weight:700;font-size:15px;
                padding:13px;border-radius:999px;border:none;cursor:pointer;"
                onmouseover="this.style.background='#1ed760'"
                onmouseout="this.style.background='#1db954'">Log In</button>
            <p style="color:#aaa;text-align:center;font-size:13px;">
                Don't have an account?
                <span onclick="showSignupModal()" style="color:#1db954;cursor:pointer;font-weight:600;">Sign up</span>
            </p>
            <button onclick="document.getElementById('loginModal').style.display='none'"
                style="background:transparent;border:none;color:#aaa;cursor:pointer;font-size:13px;">Cancel</button>
        </div>`;
    document.body.appendChild(modal);
}

function handleLogin() {
    let email = document.getElementById("loginEmail").value.trim();
    let pass  = document.getElementById("loginPass").value.trim();
    if (!email || !pass) { showToast("⚠️ Please fill all fields"); return; }
    localStorage.setItem("loggedInUser", email);
    document.getElementById("loginModal").style.display = "none";
    showToast("✅ Logged in as " + email.split("@")[0]);
    updateAuthButtons();
}

// ===== 📝 SIGNUP MODAL =====
function showSignupModal() {
    let lm = document.getElementById("loginModal");
    if (lm) lm.style.display = "none";
    let old = document.getElementById("signupModal");
    if (old) old.remove();

    let modal = document.createElement("div");
    modal.id = "signupModal";
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.85);
        display:flex;align-items:center;justify-content:center;
        z-index:99999;backdrop-filter:blur(10px);`;
    modal.innerHTML = `
        <div style="background:#121212;border:1px solid rgba(255,255,255,0.1);
            border-radius:16px;padding:40px 36px;width:320px;
            display:flex;flex-direction:column;gap:14px;
            box-shadow:0 20px 60px rgba(0,0,0,0.8);">
            <h2 style="color:#fff;text-align:center;font-size:22px;">Sign up for free</h2>
            <input id="signupName" type="text" placeholder="Your name"
                style="background:#2a2a2a;border:1px solid #444;color:#fff;
                padding:12px 16px;border-radius:8px;font-size:14px;outline:none;"
                onfocus="this.style.borderColor='#1db954'" onblur="this.style.borderColor='#444'">
            <input id="signupEmail" type="email" placeholder="Email address"
                style="background:#2a2a2a;border:1px solid #444;color:#fff;
                padding:12px 16px;border-radius:8px;font-size:14px;outline:none;"
                onfocus="this.style.borderColor='#1db954'" onblur="this.style.borderColor='#444'">
            <input id="signupPass" type="password" placeholder="Create password"
                style="background:#2a2a2a;border:1px solid #444;color:#fff;
                padding:12px 16px;border-radius:8px;font-size:14px;outline:none;"
                onfocus="this.style.borderColor='#1db954'" onblur="this.style.borderColor='#444'">
            <button onclick="handleSignup()"
                style="background:#1db954;color:#000;font-weight:700;font-size:15px;
                padding:13px;border-radius:999px;border:none;cursor:pointer;"
                onmouseover="this.style.background='#1ed760'"
                onmouseout="this.style.background='#1db954'">Create Account</button>
            <button onclick="document.getElementById('signupModal').remove()"
                style="background:transparent;border:none;color:#aaa;cursor:pointer;font-size:13px;">Cancel</button>
        </div>`;
    document.body.appendChild(modal);
}

function handleSignup() {
    let name  = document.getElementById("signupName").value.trim();
    let email = document.getElementById("signupEmail").value.trim();
    let pass  = document.getElementById("signupPass").value.trim();
    if (!name || !email || !pass) { showToast("⚠️ Please fill all fields"); return; }
    localStorage.setItem("loggedInUser", email);
    document.getElementById("signupModal").remove();
    showToast("🎉 Welcome, " + name + "!");
    updateAuthButtons();
}

// ===== AUTH BUTTON UPDATE =====
function updateAuthButtons() {
    let user      = localStorage.getItem("loggedInUser");
    let loginBtn  = document.querySelector(".login");
    let signupBtn = document.querySelector(".signup");
    if (user && loginBtn) {
        loginBtn.innerText = "👤 " + user.split("@")[0];
        loginBtn.onclick = () => {
            localStorage.removeItem("loggedInUser");
            loginBtn.innerText = "Log in";
            loginBtn.onclick = showLoginModal;
            if (signupBtn) signupBtn.style.display = "";
            showToast("👋 Logged out");
        };
        if (signupBtn) signupBtn.style.display = "none";
    }
}

// ===== INJECT EXTRA UI =====
function injectUI() {

    // 🔍 Search bar
    let library = document.querySelector(".library");
    if (library && !document.getElementById("searchInput")) {
        let wrap = document.createElement("div");
        wrap.style.cssText = "padding:8px 8px 4px;";
        wrap.innerHTML = `<input id="searchInput" type="text" placeholder="🔍 Search songs..."
            style="width:100%;background:#2a2a2a;border:1px solid #333;color:#fff;
            padding:9px 14px;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;"
            onfocus="this.style.borderColor='#1db954'"
            onblur="this.style.borderColor='#333'">`;
        library.prepend(wrap);
        document.getElementById("searchInput").addEventListener("input", (e) => filterSongs(e.target.value));
    }

    // 🔀 Shuffle + 🔁 Repeat buttons
    let songbuttons = document.querySelector(".songbuttons");
    if (songbuttons && !document.getElementById("shuffleBtn")) {
        let mkBtn = (id, emoji, title, fn) => {
            let s = document.createElement("span");
            s.id = id; s.innerText = emoji; s.title = title;
            s.style.cssText = "cursor:pointer;font-size:17px;user-select:none;transition:transform 0.2s,color 0.2s;color:#fff;";
            s.addEventListener("click", fn);
            s.addEventListener("mouseover", () => s.style.transform = "scale(1.2)");
            s.addEventListener("mouseout",  () => s.style.transform = "scale(1)");
            return s;
        };
        songbuttons.prepend(mkBtn("shuffleBtn", "", "Shuffle (S)", toggleShuffle));
        songbuttons.appendChild(mkBtn("repeatBtn",  "", "Repeat (R)",  toggleRepeat));
    }

    // 🎵 Visualizer canvas in playbar background
    let playbarEl = document.querySelector(".playbar");
    if (playbarEl && !document.getElementById("visualizer")) {
        let canvas = document.createElement("canvas");
        canvas.id = "visualizer";
        canvas.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;
            border-radius:14px;opacity:0.12;pointer-events:none;z-index:0;`;
        playbarEl.prepend(canvas);
    }

    // 💚 Like button next to song name in playbar
    let songinfo = document.querySelector(".songinfo");
    if (songinfo && !document.getElementById("likeCurrentBtn")) {
        let like = document.createElement("span");
        like.id = "likeCurrentBtn";
        like.innerText = "🤍";
        like.title = "Like (L)";
        like.style.cssText = "cursor:pointer;font-size:16px;margin-left:8px;user-select:none;";
        like.addEventListener("click", () => {
            if (songs.length) toggleLike(cleanName(songs[currentIndex]));
        });
        songinfo.appendChild(like);
    }
}

// ===== MAIN =====
async function main() {
    await getSongs();
    showSongs();
    injectUI();
    updateAuthButtons();

    playBtn2.addEventListener("click", togglePlay);
    nextBtn.addEventListener("click",  nextSong);
    prevBtn.addEventListener("click",  prevSong);

    // Login / Signup buttons
    let loginBtnEl  = document.querySelector(".login");
    let signupBtnEl = document.querySelector(".signup");
    if (loginBtnEl && !localStorage.getItem("loggedInUser")) {
        loginBtnEl.addEventListener("click", showLoginModal);
    }
    if (signupBtnEl) {
        signupBtnEl.addEventListener("click", showSignupModal);
    }

    // 💾 Restore last played song name
    let lastPlayed = JSON.parse(localStorage.getItem("lastPlayed") || "null");
    if (lastPlayed && songs[lastPlayed.index]) {
        currentIndex = lastPlayed.index;
        document.querySelector(".songinfo").innerText = "▶ Last: " + cleanName(songs[currentIndex]);
        updateLikeBtn();
    }
}

main();