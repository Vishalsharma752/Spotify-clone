console.log("Start JS");

let songs = [];
let audio = new Audio();
let currentIndex = 0;

// 🎧 get songs (same fetch)
async function getSongs() {
    let res = await fetch("http://127.0.0.1:5500/songs/");
    let data = await res.text();

    let div = document.createElement("div");
    div.innerHTML = data;

    let links = div.getElementsByTagName("a");

    songs = [];

    for (let link of links) {
        if (link.href.endsWith(".mp3")) {
            songs.push(link.href);
        }
    }
}

// 🎵 clean name
function cleanName(song) {
    return decodeURIComponent(
        song.split("/").pop().replace(".mp3", "")
    );
}

// ⏱️ format time
function formatTime(sec) {
    if (isNaN(sec)) return "00:00";
    let m = Math.floor(sec / 60);
    let s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" + s : s}`;
}

// ▶️ play song
function playSong(index) {
    if (songs.length === 0) return;

    currentIndex = index;
    audio.src = songs[index];
    audio.play();

    document.querySelector(".songinfo").innerText = cleanName(songs[index]);
    document.getElementById("playBtn2").src = "pause.svg";
}

// ⏯️ toggle play
function togglePlay() {
    let btn = document.getElementById("playBtn2");

    if (!audio.src) {
        playSong(0);
        return;
    }

    if (audio.paused) {
        audio.play();
        btn.src = "pause.svg";
    } else {
        audio.pause();
        btn.src = "play.png";
    }
}

// ⏭️ next
function nextSong() {
    currentIndex = (currentIndex + 1) % songs.length;
    playSong(currentIndex);
}

// ⏮️ prev
function prevSong() {
    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    playSong(currentIndex);
}

// 📃 show songs
function showSongs() {
    let ul = document.querySelector(".songList ul");
    ul.innerHTML = "";

    songs.forEach((song, i) => {
        let li = document.createElement("li");

        li.innerHTML = `
        <div class="songItem">
            <div class="leftPart">
                <img src="music.svg">
                <span>${cleanName(song)}</span>
            </div>
            <div class="rightPart">
                <img src="play.svg">
            </div>
        </div>`;

        li.addEventListener("click", () => playSong(i));
        ul.appendChild(li);
    });
}

// ⏱️ progress + time update
audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
        let percent = (audio.currentTime / audio.duration) * 100;
        document.querySelector(".progress").style.width = percent + "%";

        document.querySelector(".songtime").innerText =
            formatTime(audio.currentTime) + " / " + formatTime(audio.duration);
    }
});

// 🎯 seek
document.querySelector(".progressbar").addEventListener("click", (e) => {
    let percent = e.offsetX / e.currentTarget.clientWidth;
    audio.currentTime = percent * audio.duration;
});

// 🔄 auto next
audio.addEventListener("ended", nextSong);

// 🚀 main
async function main() {
    await getSongs();
    showSongs();

    document.getElementById("playBtn2").addEventListener("click", togglePlay);
    document.getElementById("nextBtn").addEventListener("click", nextSong);
    document.getElementById("prevBtn").addEventListener("click", prevSong);
}

main();

let wave = document.getElementById("wavePath");

audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
        let percent = (audio.currentTime / audio.duration) * 100;

        // width control (clip effect)
        wave.style.strokeDasharray = percent * 5 + ", 1000";
    }
});

let progressBar = document.querySelector(".progressbar");

let isDragging = false;

// mouse down = start drag
progressBar.addEventListener("mousedown", (e) => {
    isDragging = true;
    updateSeek(e);
});

// mouse move = dragging
document.addEventListener("mousemove", (e) => {
    if (isDragging) {
        updateSeek(e);
    }
});

// mouse up = stop drag
document.addEventListener("mouseup", () => {
    isDragging = false;
});

// function
function updateSeek(e) {
    let rect = progressBar.getBoundingClientRect();
    let offsetX = e.clientX - rect.left;

    let percent = offsetX / rect.width;

    // limit 0–1
    percent = Math.max(0, Math.min(1, percent));

    audio.currentTime = percent * audio.duration;
}

document.querySelectorAll(".big-play").forEach((btn, i) => {
    btn.addEventListener("click", (e) => {
        e.stopPropagation();

        // ✅ same song pe click
        if (currentIndex === i) {
            if (audio.paused) {
                audio.play();
                document.getElementById("playBtn2").src = "pause.svg";
                btn.classList.add("active");
            } else {
                audio.pause();
                document.getElementById("playBtn2").src = "play.svg";
                btn.classList.remove("active");
            }
        } 
        else {
            // ✅ new song
            playSong(i);

            stopOtherBigPlays(btn); // dusre remove
            btn.classList.add("active");
        }
    });
});