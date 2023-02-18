let lastClickTime = 0;

function clickPlayButton() {
  const now = Date.now();
  if (now - lastClickTime > 1000) {
    const playButton = document.querySelector('button.ytp-play-button');
    if (playButton) {
      console.log("click!!");
      playButton.click();
      lastClickTime = now;
    }
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
if (request.command === 'play') {
    document.querySelector('video').addEventListener('loadeddata', function() {
    if (this.paused) {
        this.play();
        console.log("play!!")

        chrome.runtime.sendMessage({command: 'played'});
    } else {
        console.log("pause!!")
        this.pause();
        chrome.runtime.sendMessage({command: 'paused'});
    }
    });
    clickPlayButton();
}
});
  