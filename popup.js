function playVideo(videoId) {
  const player = document.createElement('iframe');
  player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  player.width = 'calc(100% - 240px)';

  player.height = '100%';
  player.frameborder = '0';
  player.allowFullscreen = true;

  const searchResults = document.getElementById('searchResults');
  searchResults.innerHTML = '';
  searchResults.appendChild(player);
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
        thumbnailUrl: thumbnailUrl
      };
    });

    // Add the videos to the playlist
    const playlist = document.getElementById('playlist');
    videos.forEach(function(video) {
      const li = document.createElement('li');
      li.className = 'song';
      li.onclick = function() {
        playVideo(video.videoId);
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


// Add bookmark button to each video
const bookmarkButton = document.createElement('button');
bookmarkButton.textContent = 'Bookmark';
bookmarkButton.onclick = function(event) {
  event.stopPropagation();
  addBookmark(video);
};
li.appendChild(bookmarkButton);

function addBookmark(video) {
  // Create a new bookmark folder or find an existing one
  chrome.bookmarks.search({title: 'YouTube Music Player'}, function(results) {
    if (results.length > 0) {
      const folder = results[0];
      addBookmarkToFolder(folder.id, video);
    } else {
      chrome.bookmarks.create({title: 'YouTube Music Player'}, function(newFolder) {
        addBookmarkToFolder(newFolder.id, video);
      });
    }
  });
}

function addBookmarkToFolder(folderId, video) {
  const bookmark = {
    title: video.title,
    url: `https://www.youtube.com/watch?v=${video.videoId}`
  };
  chrome.bookmarks.create({parentId: folderId, title: bookmark.title, url: bookmark.url}, function() {
    alert(`"${bookmark.title}" bookmarked!`);
  });
}
