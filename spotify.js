function sectoMins(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "invalid input";
    }
    const minutes = Math.floor(seconds / 60);
    const remsecs = Math.floor(seconds % 60);

    const formatMins = String(minutes).padStart(2, '0');
    const formatSecs = String(remsecs).padStart(2, '0');

    return `${formatMins}:${formatSecs}`;
}

let songs = [];
let currFolder = "songs/ncs"; 

async function getSongs(folder) {
    try {
        currFolder = folder;
        let response = await fetch(`http://127.0.0.1:5500/${folder}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let text = await response.text();

        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");

        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href);
            }
        }
        return songs;
    } catch (error) {
        console.error("Failed to fetch songs:", error);
        return [];
    }
}

function extractArtistName(url) {
    let startIndex = url.indexOf("songs") + "songs/".length + 4;
    let endIndex = url.indexOf('_', startIndex);
    if (endIndex === -1) {
        endIndex = url.indexOf('-', startIndex);
    }
    if (startIndex === -1 || endIndex === -1) {
        return '';
    }
    let artistName = url.substring(startIndex, endIndex);
    return artistName.replaceAll('%20', ' ');
}

let currentAudio = null;
let currentTrackUrl = null;
let currentIcon = null;

function playMusic(trackUrl, icon) {
    let songName = trackUrl.substring(trackUrl.lastIndexOf('-') + 1).replaceAll('%20', ' ').replace('.mp3', '');
    let artistName = extractArtistName(trackUrl);

    if (currentAudio) {
        if (currentTrackUrl === trackUrl) {
            if (currentAudio.paused) {
                currentAudio.play();
                icon.classList.remove('fa-play');
                icon.classList.add('fa-pause', 'pause-icon');
                document.querySelector('#play').innerHTML = '<i class="fa-solid fa-circle-pause playbar-playbtn"></i>';
            } else {
                currentAudio.pause();
                icon.classList.remove('fa-pause', 'pause-icon');
                icon.classList.add('fa-play');
                document.querySelector('#play').innerHTML = '<i class="fa-solid fa-circle-play playbar-playbtn"></i>';
            }
            return;
        } else {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentIcon.classList.remove('fa-pause', 'pause-icon');
            currentIcon.classList.add('fa-play');
            document.querySelector('#play').innerHTML = '<i class="fa-solid fa-circle-play playbar-playbtn"></i>';
        }
    }

    currentAudio = new Audio(trackUrl);
    currentTrackUrl = trackUrl;
    currentIcon = icon;
    currentAudio.play();
    icon.classList.remove('fa-play');
    icon.classList.add('fa-pause', 'pause-icon');
    document.querySelector('#play').innerHTML = '<i class="fa-solid fa-circle-pause playbar-playbtn"></i>';

    document.querySelector(".song-name1").innerText = songName;
    document.querySelector(".artist-name1").innerText = artistName;

    currentAudio.addEventListener("loadeddata", () => {
        currentAudio.addEventListener("timeupdate", () => {
            const currentTime = currentAudio.currentTime;
            const duration = currentAudio.duration;
            const percentage = (currentTime / duration) * 100;
            document.querySelector(".songtime").innerHTML = `${sectoMins(currentTime)}/${sectoMins(duration)}`;
            document.querySelector(".circle").style.left = percentage + "%";
            document.querySelector(".filled-bar").style.width = percentage + "%";
        });
    });

    currentAudio.addEventListener("ended", () => {
        icon.classList.remove('fa-pause', 'pause-icon');
        icon.classList.add('fa-play');
        document.querySelector('#play').innerHTML = '<i class="fa-solid fa-circle-play playbar-playbtn"></i>';
        document.querySelector(".circle").style.left = "0%";
        document.querySelector(".filled-bar").style.width = "0%";
    });
}

async function renderSongList(folder) {
    songs = await getSongs(folder); // Use current folder
    console.log(songs);

    let songUl = document.querySelector(".songList ul");
    songUl.innerHTML = ''; // Clear previous list items

    for (const song of songs) {
        var songName = song.substring(song.lastIndexOf('-') + 1);
        songName = songName.replaceAll('%20', ' ').replace('.mp3', '');
        var artistName = extractArtistName(song);

        songUl.innerHTML += `<li data-url="${song}">
                <div class="musicImg"><i class="fa-solid fa-music"></i></div>
                <div class="info">
                    <div class="song-name">${songName}</div>
                    <div class="artist-name">${artistName}</div>
                </div>
                <div class="playImg"><i class="fa-solid fa-play"></i></div>
            </li>`;
    }

    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            let trackUrl = e.getAttribute("data-url");
            let icon = e.querySelector('.playImg i');
            console.log(trackUrl);
            playMusic(trackUrl, icon);
        });
    });
}

async function main() {
    await renderSongList(currFolder); // Render the default folder

    let playButton = document.querySelector('#play'); // Ensure this selector matches your HTML structure
    playButton.addEventListener('click', () => {
        if (currentAudio) {
            if (currentAudio.paused) {
                currentAudio.play();
                currentIcon.classList.remove('fa-play');
                currentIcon.classList.add('fa-pause');
                playButton.innerHTML = '<i class="fa-solid fa-circle-pause playbar-playbtn"></i>';
            } else {
                currentAudio.pause();
                currentIcon.classList.remove('fa-pause');
                currentIcon.classList.add('fa-play');
                playButton.innerHTML = '<i class="fa-solid fa-circle-play playbar-playbtn"></i>';
            }
        } else if (songs.length > 0) {
            let firstSongElement = document.querySelector(".songList li");
            let firstTrackUrl = firstSongElement.getAttribute("data-url");
            let firstIcon = firstSongElement.querySelector('.playImg i');
            playMusic(firstTrackUrl, firstIcon);
        }
    });

    document.querySelector(".seek-bar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        document.querySelector(".filled-bar").style.width = percent + "%";
        if (currentAudio) {
            currentAudio.currentTime = (currentAudio.duration * percent) / 100;
        }
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
        document.querySelector(".fa-arrow-left").style.left = "360px";
        document.querySelector(".fa-arrow-left").style.color = "white";
    });

    document.querySelector(".fa-arrow-left").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
        document.querySelector(".fa-arrow-left").style.left = "-90%";
    });

    document.querySelector(".forward").addEventListener("click", () => {
        console.log("forward");
        if (currentAudio) {
            let currentSrc = currentAudio.src.split('/').pop(); // Get the file name
            let currentIndex = songs.findIndex(song => song.endsWith(currentSrc));
            console.log("Current index:", currentIndex);

            if (currentIndex !== -1 && currentIndex < songs.length - 1) {
                let nextTrackUrl = songs[currentIndex + 1];
                let nextIcon = document.querySelector(`li[data-url="${nextTrackUrl}"] .playImg i`);
                playMusic(nextTrackUrl, nextIcon);
            }
        }
    });

    document.querySelector(".backward").addEventListener("click", () => {
        console.log("backward");
        if (currentAudio) {
            let currentSrc = currentAudio.src.split('/').pop(); // Get the file name
            let currentIndex = songs.findIndex(song => song.endsWith(currentSrc));
            console.log("Current index:", currentIndex);

            if (currentIndex > 0) {
                let prevTrackUrl = songs[currentIndex - 1];
                let prevIcon = document.querySelector(`li[data-url="${prevTrackUrl}"] .playImg i`);
                playMusic(prevTrackUrl, prevIcon);
            }
        }
    });

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            let folder = item.currentTarget.dataset.folder;
            await renderSongList(`songs/${folder}`);
        });
    });
}

main();
