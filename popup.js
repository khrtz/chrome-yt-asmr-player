let player;
let currentPlayingTabId = null;
let currentPlayingVideoId = null;

function playVideo(videoId, tabId) {
  if (tabId) {
    // If a tab ID is passed, play the video in that tab
    chrome.scripting.executeScript({
      target: {tabId: tabId},
      files: ['content.js']
    }).then(() => {
      chrome.tabs.sendMessage(tabId, {command: 'play', videoId: videoId});
    }).catch((err) => {
      console.error(err);
    });
  } else {
    // Otherwise, find the first YouTube tab and play the video in that tab
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
      li.dataset.videoId = video.videoId;
      li.onclick = function() {
        playVideo(video.videoId, video.tabId);
      };
      
      const thumbnail = document.createElement('img');
      thumbnail.src = video.thumbnailUrl;
      thumbnail.alt = video.title;
      li.appendChild(thumbnail);

      const infoDiv = document.createElement('div');
      infoDiv.className = 'song-info';

      const titleElement = document.createElement('h3');
      titleElement.textContent = video.title;
      infoDiv.appendChild(titleElement);

      const progressElement = document.createElement('div');
      progressElement.className = 'video-progress';
      progressElement.textContent = '0:00 / 0:00';
      infoDiv.appendChild(progressElement);

      li.appendChild(infoDiv);

      const activateButton = document.createElement('button');
      activateButton.className = 'activate-button';
      activateButton.innerHTML = '<span class="material-icons icon-activate">open_in_new</span>';
      activateButton.onclick = function(e) {
        e.stopPropagation();
        chrome.tabs.update(video.tabId, {active: true});
      };
      li.appendChild(activateButton);

      playlist.appendChild(li);
    });

    // 進捗更新の開始
    setInterval(updateAllVideoProgress, 1000);
  });
}

function updateVideoProgress(videoId, tabId) {
  chrome.tabs.sendMessage(tabId, {command: 'getProgress'}, function(response) {
    if (response && response.currentTime !== undefined && response.duration !== undefined) {
      const progressElement = document.querySelector(`.song[data-video-id="${videoId}"] .video-progress`);
      if (progressElement) {
        const currentTime = formatTime(response.currentTime);
        const duration = formatTime(response.duration);
        progressElement.textContent = `${currentTime} / ${duration}`;
      }
    }
  });
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

function updateAllVideoProgress() {
  videos.forEach(video => {
    updateVideoProgress(video.videoId, video.tabId);
  });
}

document.addEventListener('DOMContentLoaded', createVideoPlaylist);
