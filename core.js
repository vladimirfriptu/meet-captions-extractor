(function (root) {
  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function parseRow(row) {
    const avatar = row.querySelector('img');
    if (!avatar) return null;
    const children = Array.from(row.children);
    const headerEl = children.find((c) => c.contains(avatar));
    const textEl = children.find((c) => !c.contains(avatar));
    const speakerEl = headerEl ? headerEl.querySelector('span') : null;
    const speaker = speakerEl ? speakerEl.textContent.trim() : '';
    const text = textEl ? textEl.textContent.trim() : '';
    if (!speaker || !text) return null;
    return { speaker, text };
  }

  function getCaptionRows(container) {
    return Array.from(container.children).filter((child) => parseRow(child) !== null);
  }

  function findCaptionsContainer(rootDoc) {
    const byLabel = rootDoc.querySelector('[aria-label="Captions"]');
    if (byLabel) return byLabel;
    const regions = rootDoc.querySelectorAll('[role="region"]');
    for (const region of regions) {
      if (getCaptionRows(region).length > 0) return region;
    }
    return null;
  }

  function buildTranscript(records, meta) {
    const headerLines = [
      `# Meet transcript — ${meta.date}`,
      `# Participants: ${meta.participants.join(', ')}`,
      '',
    ];
    const bodyLines = records.map(
      (r) => `[${formatTime(r.t)}] ${r.speaker}: ${r.text}`
    );
    return headerLines.concat(bodyLines).join('\n') + '\n';
  }

  const api = { formatTime, parseRow, getCaptionRows, findCaptionsContainer, buildTranscript };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.MeetCaptionsCore = api;
  }
})(typeof self !== 'undefined' ? self : this);
