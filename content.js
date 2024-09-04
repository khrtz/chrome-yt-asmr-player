let lastClickTime = 0;

function clickPlayButton() {
  const now = Date.now();
  if (now - lastClickTime > 500) {
    const playButton = document.querySelector('button.ytp-play-button');
    if (playButton) {
      playButton.click();
      lastClickTime = now;
    }
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  const video = document.querySelector('video');
  if (!video) {
    sendResponse({status: 'error', message: 'Video element not found'});
    return true;
  }

  switch (request.command) {
    case 'play':
      video.play();
      clickPlayButton();
      sendResponse({status: 'played'});
      break;
    case 'pause':
      video.pause();
      clickPlayButton();
      sendResponse({status: 'paused'});
      break;
    default:
      sendResponse({status: 'error', message: 'Unknown command'});
  }
  return true;
});
