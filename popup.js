let player;
let currentPlayingIndex = -1;
let isPlaying = false;

function playVideo(videoId, tabId) {
  chrome.tabs.sendMessage(tabId, {command: 'play', videoId: videoId}, function(response) {
    if (response && response.status === 'played') {
      isPlaying = true;
      currentPlayingIndex = videos.findIndex(v => v.videoId === videoId);
      updatePlayButtons();
    }
  });
}

function createVideoPlaylist() {
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    const youtubeTabs = tabs.filter(function(tab) {
      return tab.url.includes('www.youtube.com');
    });

    videos = youtubeTabs.map(function(tab) {
      const url = new URL(tab.url);
      const videoId = url.searchParams.get('v');
      let title = tab.title.split(' - YouTube')[0];
      title = title.replace(/^\(\d+\)\s+/, '');
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

      return {
        videoId: videoId,
        title: title,
        thumbnailUrl: thumbnailUrl,
        tabId: tab.id
      };
    });

    const playlist = document.getElementById('playlist');
    playlist.innerHTML = '';

    videos.forEach(function(video, index) {
      const songElement = document.createElement('div');
      songElement.className = 'song';

      const thumbnail = document.createElement('img');
      thumbnail.src = video.thumbnailUrl;
      thumbnail.alt = video.title;
      thumbnail.width = '64';
      thumbnail.height = '64';
      songElement.appendChild(thumbnail);

      const titleElement = document.createElement('h3');
      titleElement.textContent = video.title;
      songElement.appendChild(titleElement);

      const controlsElement = document.createElement('div');
      controlsElement.className = 'song-controls';

      const playButton = createControlButton('▶', () => togglePlay(index));
      playButton.id = `play-button-${index}`;
      const removeButton = createControlButton('×', () => removeSong(index));

      controlsElement.appendChild(playButton);
      // controlsElement.appendChild(removeButton);
      songElement.appendChild(controlsElement);

      playlist.appendChild(songElement);
    });

    updatePlayButtons();
  });
}

function createControlButton(text, onClick) {
  const button = document.createElement('button');
  button.className = 'song-control-button';
  button.textContent = text;
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return button;
}

function togglePlay(index) {
  if (currentPlayingIndex === index) {
    if (isPlaying) {
      pauseVideo();
    } else {
      resumeVideo();
    }
  } else {
    if (currentPlayingIndex !== -1) {
      stopVideo();
    }
    playVideo(videos[index].videoId, videos[index].tabId);
    currentPlayingIndex = index;
  }
}

function updatePlayButtons() {
  videos.forEach((video, index) => {
    const playButton = document.getElementById(`play-button-${index}`);
    if (index === currentPlayingIndex) {
      if (isPlaying) {
        playButton.textContent = '⏸️';
        playButton.classList.add('playing');
        playButton.classList.remove('paused');
      } else {
        playButton.textContent = '▶️';
        playButton.classList.add('paused');
        playButton.classList.remove('playing');
      }
    } else {
      playButton.textContent = '▶️';
      playButton.classList.remove('playing', 'paused');
    }
  });
}

function stopVideo() {
  if (currentPlayingIndex >= 0) {
    const video = videos[currentPlayingIndex];
    chrome.tabs.sendMessage(video.tabId, {command: 'stop'}, function(response) {
      if (response && response.status === 'stopped') {
        isPlaying = false;
        currentPlayingIndex = -1;
        updatePlayButtons();
      }
    });
  }
}

function pauseVideo() {
  if (currentPlayingIndex >= 0) {
    const video = videos[currentPlayingIndex];
    chrome.tabs.sendMessage(video.tabId, {command: 'pause'}, function(response) {
      if (response && response.status === 'paused') {
        isPlaying = false;
        updatePlayButtons();
      }
    });
  }
}

function resumeVideo() {
  if (currentPlayingIndex >= 0) {
    const video = videos[currentPlayingIndex];
    chrome.tabs.sendMessage(video.tabId, {command: 'play'}, function(response) {
      if (response && response.status === 'played') {
        isPlaying = true;
        updatePlayButtons();
      }
    });
  }
}

function removeSong(index) {
  videos.splice(index, 1);
  createVideoPlaylist();
}

document.addEventListener('DOMContentLoaded', createVideoPlaylist);
