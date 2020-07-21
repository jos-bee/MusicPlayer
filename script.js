let bodyElement = document.querySelector("body");
let musicContainer = document.getElementById("musicContainer");

//Buttons
let playBtn = document.getElementById("play");
let prevBtn = document.getElementById("prev");
let nextBtn = document.getElementById("next");
let repeatBtn = document.getElementById("repeat");
let randomBtn = document.getElementById("random");
let addBtn = document.getElementById("addBtn");
let removeBtn = document.getElementById("removeBtn");
let musicFiles = document.getElementById("files");
let modeBtn = document.querySelector(".pin3");
let listBtn = document.querySelector(".pin1");

//The Other elements
let progress = document.getElementById("runner");
let audio = document.getElementById("audio");
let title = document.getElementById("title");
let time = document.querySelector(".time");
let playList = document.getElementById("playList");

//Variables
let songs;
let songIndex = 0;
let randomOrderCount = 0;

//Set liseners to the buttons
playBtn.addEventListener("click", () => {
  let isPlaying = playBtn.classList.contains("active");

  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
});

prevBtn.addEventListener("click", prevSong);
nextBtn.addEventListener("click", nextSong);
repeatBtn.addEventListener("click", () => repeatBtn.classList.toggle("active"));
randomBtn.addEventListener("click", () => randomBtn.classList.toggle("active"));
removeBtn.addEventListener("click", cleanPlayList);
addBtn.addEventListener("click", () => musicFiles.click());
musicFiles.addEventListener("change", getFiles);
listBtn.addEventListener("click", () => playList.classList.toggle("active"));
modeBtn.addEventListener("click", darkLightMode);

//se listeners for audio element
audio.addEventListener("timeupdate", updateProgress);
audio.addEventListener("ended", repeatSongs);

progress.parentElement.addEventListener("click", setProgress);

//Functions
function getFiles() {
  //get audio files
  songs = musicFiles.files;

  //upload to audio element
  loadSong(songs[songIndex]);

  //set visualizer
  if (!audioCtx) {
    setVisualizer(audio);
  }

  //parse ID3 tags for play list
  parseTags();

  //add classes
  addBtn.classList.toggle("active");
  removeBtn.classList.toggle("active");
  playBtn.classList.add("ready");
}

function loadSong(song) {
  title.innerText = song.name;
  audio.src = URL.createObjectURL(song);
}

function createPlayList(parsed, index) {
  let item = document.createElement("li");
  item.setAttribute("id", `li${index}`);

  //Create divs for "li"
  item.innerHTML = `
  <div class="album-image">
    <img src="${parsed.picture}" >
  </div>

  <div class="info">
    <p>${parsed.title}</p>
    <p>${parsed.artist}</p>
  </div>

  <i class="fa fa-pause"></i>
  
  
  `;

  item.addEventListener("click", () => {
    songIndex = index;
    loadSong(songs[songIndex]);
    playSong();
  });

  playList.appendChild(item);
}

function parseTags() {
  for (let i = 0; i < songs.length; i++) {
    let url = songs[i].urn || songs[i].name;

    ID3.loadTags(
      url,
      function () {
        createObjectWithTags(url, i);
      },
      {
        tags: ["title", "artist", "album", "picture"],
        dataReader: ID3.FileAPIReader(songs[i]),
      }
    );
  }
}

function createObjectWithTags(url, index) {
  let tags = ID3.getAllTags(url);

  let newItem = {
    title: tags.title || url,
    artist: tags.artist || "Uknown artist",
    album: tags.album || "Uknown album",
    picture: "",
  };

  let image = tags.picture;
  if (image) {
    let base64String = "";
    for (let i = 0; i < image.data.length; i++) {
      base64String += String.fromCharCode(image.data[i]);
    }
    let base64 =
      "data:" + image.format + ";base64," + window.btoa(base64String);
    newItem.picture = base64;
  } else {
    newItem.picture = "images/cello.jpg";
  }

  createPlayList(newItem, index);
}

function playSong() {
  playBtn.classList.remove("fa-play");
  playBtn.classList.remove("ready");
  playBtn.classList.add("fa-pause");
  playBtn.classList.add("active");

  if (songs) {
    let activeSong = playList.querySelector("li i.active");

    if (activeSong) {
      activeSong.classList.remove("active");
    }

    playList.querySelector(`#li${songIndex} i`).classList.add("active");
    audio.play();
  }
}

function pauseSong() {
  playBtn.classList.remove("fa-pause");
  playBtn.classList.remove("active");
  playBtn.classList.add("fa-play");

  if (songs) {
    playBtn.classList.add("ready");
    playList.querySelector("li i.active").classList.remove("active");
  } else {
    playBtn.classList.remove("ready");
  }

  audio.pause();
}

function prevSong() {
  if (songs) {
    songIndex--;

    if (songIndex < 0) {
      songIndex = songs.length - 1;
    }

    loadSong(songs[songIndex]);
    playSong();
  }
}

function nextSong() {
  if (songs) {
    songIndex++;

    if (songIndex > songs.length - 1) {
      songIndex = 0;
    }

    loadSong(songs[songIndex]);
    playSong();
  }
}

function setTimer() {
  let seconds = Math.floor(audio.currentTime % 60);
  let minutes = Math.floor(audio.currentTime / 60);

  time.innerText =
    ("0" + minutes).substr(-2) + ":" + ("0" + seconds).substr(-2);
}

function updateProgress(event) {
  let { duration, currentTime } = event.srcElement;
  let progressPercent = (currentTime / duration) * 100;

  progress.style.width = `${progressPercent}%`;
  setTimer();
}

function setProgress(element) {
  let width = this.clientWidth;
  let clickX = element.offsetX;
  let duration = audio.duration;
  audio.currentTime = (clickX / width) * duration;
}

function randomOrderNextSong() {
  songIndex = Math.floor(Math.random() * songs.length - 1 + 1);
  console.log(songIndex);
  loadSong(songs[songIndex]);
  playSong();
}

function repeatSongs() {
  if (
    randomBtn.className.includes("active") &&
    !repeatBtn.className.includes("active")
  ) {
    randomOrderCount++;
    if (randomOrderCount >= songs.length) {
      pauseSong();
      randomOrderCount = 0;
    } else {
      randomOrderNextSong();
    }
  } else if (
    randomBtn.className.includes("active") &&
    repeatBtn.className.includes("active")
  ) {
    randomOrderNextSong();
  } else if (
    !repeatBtn.className.includes("active") &&
    songIndex === songs.length - 1
  ) {
    pauseSong();
  } else {
    nextSong();
  }
}

function cleanPlayList() {
  songs = null;
  pauseSong();
  title.innerText = "";
  audio.src = "";
  progress.style.width = "0%";
  playList.textContent = "";
  musicFiles.value = "";

  addBtn.classList.toggle("active");
  removeBtn.classList.toggle("active");
  playList.classList.remove("active");
}

function darkLightMode() {
  bodyElement.classList.toggle("light");

  if (bodyElement.className === "light") {
    modeBtn.querySelector(".fas").classList.remove("fa-moon");
    modeBtn.querySelector(".fas").classList.add("fa-sun");
    if (songs) {
      mainloop("rgba(176, 2, 2, 0.9)");
    }
  } else {
    modeBtn.querySelector(".fas").classList.remove("fa-sun");
    modeBtn.querySelector(".fas").classList.add("fa-moon");
    if (songs) {
      mainloop("rgba(0, 255, 255, 0.9)");
    }
  }
}
