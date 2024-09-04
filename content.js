let lastClickTime = 0;

function clickPlayButton() {
  const now = Date.now();
  if (now - lastClickTime > 500) {
    const playButton = document.querySelector('button.ytp-play-button');
    if (playButton) {
      console.log("click!!");
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
      sendResponse({status: 'played'});
      break;
    case 'pause':
      video.pause();
      sendResponse({status: 'paused'});
      break;
    case 'stop':
      video.pause();
      video.currentTime = 0;
      sendResponse({status: 'stopped'});
      break;
    default:
      sendResponse({status: 'error', message: 'Unknown command'});
  }
  return true; // 非同期レスポンスのために必要
});
