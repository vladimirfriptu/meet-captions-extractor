(function () {
  const core = self.MeetCaptionsCore;
  const BUTTON_ID = 'mce-cc-download';

  const state = {
    t0: null,
    records: [],
    nodeToId: new WeakMap(),
    nextId: 1,
    container: null,
    observer: null,
    toolbarBtn: null,
    countEl: null,
  };

  let persistTimer = null;

  function flushPersist() {
    chrome.storage.local.set(
      { meetTranscript: { t0: state.t0, records: state.records } },
      () => {
        if (chrome.runtime.lastError) {
          console.warn('[mce] persist failed:', chrome.runtime.lastError.message);
        }
      }
    );
  }

  function persist() {
    if (persistTimer !== null) return;
    persistTimer = setTimeout(() => {
      persistTimer = null;
      flushPersist();
    }, 1000);
  }

  function triggerDownload(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadTranscript() {
    if (!state.records.length) return;
    const download = core.buildDownload(state.records, new Date());
    triggerDownload(download.filename, download.content);
  }

  // The captions toggle in the bottom bar carries a "closed_caption" material
  // symbol; its glyph name is language-independent, unlike the aria-label.
  function findCaptionsToggle() {
    const icons = document.querySelectorAll('button i');
    for (const icon of icons) {
      if (icon.textContent.trim() === 'closed_caption') return icon.closest('button');
    }
    return null;
  }

  function buildToolbarButton() {
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button';
    btn.title = 'Download captions transcript';
    btn.innerHTML =
      '<span class="mce-cc-badge">CC</span>' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">' +
      '<path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 2h14v2H5z"/></svg>' +
      '<span class="mce-cc-count">0</span>';
    btn.addEventListener('click', downloadTranscript);
    return btn;
  }

  function injectStyles() {
    if (document.getElementById('mce-styles')) return;
    const style = document.createElement('style');
    style.id = 'mce-styles';
    style.textContent =
      `#${BUTTON_ID}{display:inline-flex;align-items:center;gap:6px;height:40px;` +
      `margin:0 6px;padding:0 12px;border:none;border-radius:20px;` +
      `background:rgba(255,255,255,.10);color:#e8eaed;cursor:pointer;` +
      `font:500 13px/1 'Google Sans',Roboto,Arial,sans-serif;}` +
      `#${BUTTON_ID}:hover{background:rgba(255,255,255,.18);}` +
      `#${BUTTON_ID} .mce-cc-badge{font-weight:700;font-size:11px;letter-spacing:.5px;` +
      `padding:2px 4px;border:1.5px solid currentColor;border-radius:4px;line-height:1;}` +
      `#${BUTTON_ID} .mce-cc-count{min-width:14px;font-variant-numeric:tabular-nums;}` +
      `#${BUTTON_ID} svg{display:block;}`;
    document.documentElement.appendChild(style);
  }

  function injectToolbarButton() {
    const existing = document.getElementById(BUTTON_ID);
    if (existing) {
      state.toolbarBtn = existing;
      state.countEl = existing.querySelector('.mce-cc-count');
      return;
    }
    const toggle = findCaptionsToggle();
    if (!toggle) return;
    const wrapper =
      toggle.closest('div[tooltip-id]') || toggle.closest('.juFBl') || toggle.parentElement;
    const parent = wrapper && wrapper.parentElement;
    if (!parent) return;

    const btn = buildToolbarButton();
    parent.insertBefore(btn, wrapper.nextSibling);
    state.toolbarBtn = btn;
    state.countEl = btn.querySelector('.mce-cc-count');
  }

  function removeToolbarButton() {
    const existing = document.getElementById(BUTTON_ID);
    if (existing) existing.remove();
    state.toolbarBtn = null;
    state.countEl = null;
  }

  function updateCount() {
    if (state.countEl) state.countEl.textContent = String(state.records.length);
  }

  function syncToolbar() {
    if (!state.container) {
      removeToolbarButton();
      return;
    }
    if (!state.toolbarBtn || !document.contains(state.toolbarBtn)) {
      injectToolbarButton();
    }
    updateCount();
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
    syncToolbar();
  }

  function tryAttach() {
    if (state.container && !document.contains(state.container)) {
      if (state.observer) state.observer.disconnect();
      state.container = null;
      state.observer = null;
    }

    if (!state.container) {
      const container = core.findCaptionsContainer(document);
      if (container) {
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
    }

    syncToolbar();
  }

  function restore() {
    chrome.storage.local.get('meetTranscript', (data) => {
      const saved = data && data.meetTranscript;
      if (!saved) return;
      state.t0 = saved.t0;
      state.records = saved.records || [];
      state.nextId = state.records.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      updateCount();
    });
  }

  function reset() {
    state.records = [];
    state.nodeToId = new WeakMap();
    state.nextId = 1;
    state.t0 = state.container ? Date.now() : null;
    flushPersist();
    updateCount();
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'mce-reset') reset();
  });

  injectStyles();
  restore();
  setInterval(tryAttach, 1000);

  // Debug handles for manual inspection from the DevTools console.
  self.__mceState = state;
  self.__mceIngest = ingest;
})();
