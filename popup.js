let player;
let currentPlayingIndex = -1;
let isPlaying = false;

function playVideo(videoId, tabId) {
  if (tabId) {
    chrome.scripting.executeScript({
      target: {tabId: tabId},
      files: ['content.js']
    }).then(() => {
      chrome.tabs.sendMessage(tabId, {command: 'play', videoId: videoId}, (response) => {
        if (response && response.status === 'played') {
          currentPlayingIndex = videos.findIndex(v => v.videoId === videoId);
          updatePlayButtons();
        }
      });
    }).catch((err) => {
      console.error(err);
    });
  } else {
    chrome.tabs.query({currentWindow: true}, function(tabs) {
      const youtubeTab = tabs.find(function(tab) {
        return tab.url.includes('www.youtube.com');
      });

      if (youtubeTab) {
        chrome.scripting.executeScript({
          target: {tabId: youtubeTab.id},
          files: ['content.js']
        }).then(() => {
          chrome.tabs.sendMessage(youtubeTab.id, {command: 'play', videoId: videoId});
        }).catch((err) => {
          console.error(err);
        });
      } else {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        chrome.tabs.create({ url: youtubeUrl, active: true }, function(tab) {
          chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ['content.js']
          }).then(() => {
            chrome.tabs.sendMessage(tab.id, {command: 'play', videoId: videoId});
          }).catch((err) => {
            console.error(err);
          });
        });
      }
    });
  }
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
      const li = document.createElement('li');
      li.className = 'song';
      li.dataset.index = index;
      li.onclick = function() {
        if (currentPlayingIndex === index) {
          pauseVideo();
        } else {
          playVideo(video.videoId, video.tabId);
        }
      };

      const thumbnail = document.createElement('img');
      thumbnail.src = video.thumbnailUrl;
      thumbnail.alt = video.title;
      thumbnail.width = '64';
      thumbnail.height = '64';
      li.appendChild(thumbnail);

      const titleElement = document.createElement('h3');
      titleElement.textContent = video.title;
      li.appendChild(titleElement);

      const controlsElement = document.createElement('div');
      controlsElement.className = 'song-controls';

      const playButton = createControlButton('▶', () => togglePlay(index));
      playButton.id = `play-button-${index}`;
      const removeButton = createControlButton('×', () => removeSong(index));

      controlsElement.appendChild(playButton);
      // controlsElement.appendChild(removeButton);
      li.appendChild(controlsElement);

      playlist.appendChild(li);
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
    const li = document.querySelector(`.song[data-index="${index}"]`);
    if (index === currentPlayingIndex) {
      li.classList.add('playing');
    } else {
      li.classList.remove('playing');
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
    chrome.tabs.sendMessage(video.tabId, {command: 'pause'}, (response) => {
      if (response && response.status === 'paused') {
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

document.addEventListener('DOMContentLoaded', function() {
  createVideoPlaylist();
});
