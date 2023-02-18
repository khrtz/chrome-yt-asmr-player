let player;

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
  // Get all the tabs that are currently open
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    // Filter the tabs to those that have a YouTube URL
    const youtubeTabs = tabs.filter(function(tab) {
      return tab.url.includes('www.youtube.com');
    });

    // Extract the video information from the YouTube tabs
    const videos = youtubeTabs.map(function(tab) {
      // Extract the video ID from the URL
      const url = new URL(tab.url);
      const videoId = url.searchParams.get('v');

      // Extract the video title and thumbnail from the page metadata
      let title = tab.title.split(' - YouTube')[0];
      // Remove the number at the start of the title
      title = title.replace(/^\(\d+\)\s+/, '');
      const thumbnailUrl = tab.favIconUrl.replace('s16', 's88');

      // Return the video object
      return {
        videoId: videoId,
        title: title,
        thumbnailUrl: thumbnailUrl,
        tabId: tab.id
      };
    });

    // Add the videos to the playlist
    const playlist = document.getElementById('playlist');
    videos.forEach(function(video) {
      const li = document.createElement('li');
      li.className = 'song';
      li.onclick = function() {
        playVideo(video.videoId, video.tabId);
      };
      const thumbnail = document.createElement('img');
      thumbnail.src = video.thumbnailUrl;
      thumbnail.width = '64';
      thumbnail.height = '64';
      li.appendChild(thumbnail);
      const titleElement = document.createElement('h3');
      titleElement.textContent = video.title;
      li.appendChild(titleElement);
      playlist.appendChild(li);
    });

  });
}



document.addEventListener('DOMContentLoaded', function() {
  createVideoPlaylist();
});

// window.addEventListener('beforeunload', function(e) {
//   if (player) {
//     e.preventDefault();
//     e.returnValue = '';
//     window.removeEventListener('unload', stopPlayer);
//   }
// });

// window.onbeforeunload = function () {
//   return;
// };
