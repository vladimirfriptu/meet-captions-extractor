(function () {
  const core = self.MeetCaptionsCore;

  const state = {
    t0: null,
    records: [],
    nodeToId: new WeakMap(),
    nextId: 1,
    container: null,
    observer: null,
    button: null,
  };

  function persist() {
    chrome.storage.local.set({
      meetTranscript: { t0: state.t0, records: state.records },
    });
  }

  function ingest() {
    if (!state.container) return;
    const rows = core.getCaptionRows(state.container);
    for (const row of rows) {
      const parsed = core.parseRow(row);
      if (!parsed) continue;
      if (state.nodeToId.has(row)) {
        const id = state.nodeToId.get(row);
        const rec = state.records.find((r) => r.id === id);
        if (rec) {
          rec.speaker = parsed.speaker;
          rec.text = parsed.text;
        }
      } else {
        const id = state.nextId++;
        state.nodeToId.set(row, id);
        const t = state.t0 === null ? 0 : Date.now() - state.t0;
        state.records.push({ id, speaker: parsed.speaker, text: parsed.text, t });
      }
    }
    persist();
    updateButton();
  }

  function tryAttach() {
    if (state.container && !document.contains(state.container)) {
      if (state.observer) state.observer.disconnect();
      state.container = null;
      state.observer = null;
    }
    if (state.container) return;

    const container = core.findCaptionsContainer(document);
    if (!container) return;

    state.container = container;
    if (state.t0 === null) state.t0 = Date.now();
    state.observer = new MutationObserver(() => ingest());
    state.observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    ingest();
  }

  function restore() {
    chrome.storage.local.get('meetTranscript', (data) => {
      const saved = data && data.meetTranscript;
      if (!saved) return;
      state.t0 = saved.t0;
      state.records = saved.records || [];
      state.nextId = state.records.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      updateButton();
    });
  }

  function download() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const participants = [...new Set(state.records.map((r) => r.speaker))];
    const text = core.buildTranscript(state.records, { date, participants });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const stamp = date.replace(/[: ]/g, '-');
    const a = document.createElement('a');
    a.href = url;
    a.download = `meet-transcript-${stamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function createButton() {
    const btn = document.createElement('button');
    btn.id = 'mce-download-btn';
    btn.textContent = '⬇ Transcript (0)';
    btn.addEventListener('click', download);
    document.body.appendChild(btn);
    return btn;
  }

  function updateButton() {
    if (!state.button) state.button = createButton();
    state.button.textContent = `⬇ Transcript (${state.records.length})`;
  }

  updateButton();
  restore();
  setInterval(tryAttach, 1000);

  self.__mceState = state;
  self.__mceIngest = ingest;
})();
