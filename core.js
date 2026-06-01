(function (root) {
  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  const api = { formatTime };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.MeetCaptionsCore = api;
  }
})(typeof self !== 'undefined' ? self : this);
