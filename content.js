(function () {
  const core = self.MeetCaptionsCore;
  const BUTTON_ID = 'mce-cc-btn';
  const PANEL_ID = 'mce-panel';
  const PANEL_WIDTH = 340;
  const PREVIEW_LIMIT = 30;

  const state = {
    t0: null,
    records: [],
    nodeToId: new WeakMap(),
    nextId: 1,
    container: null,
    observer: null,
    toolbarBtn: null,
    countEl: null,
    panel: null,
    panelOpen: false,
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

  function clearTranscript() {
    state.records = [];
    state.nodeToId = new WeakMap();
    state.nextId = 1;
    state.t0 = state.container ? Date.now() : null;
    flushPersist();
    updateCount();
    renderPanel();
  }

  // ---- in-page panel ---------------------------------------------------

  function buildPanel() {
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML =
      '<header><h1>Meet Captions Extractor</h1>' +
      '<span class="mce-status"></span></header>' +
      '<ul class="mce-list"></ul>' +
      '<div class="mce-actions">' +
      '<button class="mce-btn" data-act="clear">Clear</button>' +
      '<button class="mce-btn mce-btn--primary" data-act="download">Download .txt</button>' +
      '</div>';
    const downloadBtn = panel.querySelector('[data-act="download"]');
    const clearBtn = panel.querySelector('[data-act="clear"]');
    downloadBtn.addEventListener('click', downloadTranscript);
    clearBtn.addEventListener('click', clearTranscript);
    return panel;
  }

  function renderPanel() {
    const panel = state.panel;
    if (!panel || !state.panelOpen) return;
    const records = state.records;
    const count = records.length;

    const status = panel.querySelector('.mce-status');
    status.textContent = count
      ? `${count} line${count === 1 ? '' : 's'} recorded`
      : 'Open captions (CC) to start recording.';

    const downloadBtn = panel.querySelector('[data-act="download"]');
    const clearBtn = panel.querySelector('[data-act="clear"]');
    downloadBtn.disabled = count === 0;
    clearBtn.disabled = count === 0;

    const list = panel.querySelector('.mce-list');
    list.textContent = '';
    const recent = records.slice(-PREVIEW_LIMIT);
    for (const r of recent) {
      const li = document.createElement('li');

      const time = document.createElement('span');
      time.className = 'mce-time';
      time.textContent = core.formatTime(r.t);

      const speaker = document.createElement('span');
      speaker.className = 'mce-speaker';
      speaker.textContent = r.speaker;

      const text = document.createElement('span');
      text.className = 'mce-text';
      text.textContent = r.text;

      li.append(time, speaker, text);
      list.appendChild(li);
    }
    list.scrollTop = list.scrollHeight;
  }

  function positionPanel() {
    if (!state.panel || !state.toolbarBtn) return;
    const rect = state.toolbarBtn.getBoundingClientRect();
    const maxLeft = window.innerWidth - PANEL_WIDTH - 8;
    const wanted = rect.left + rect.width / 2 - PANEL_WIDTH / 2;
    const left = Math.max(8, Math.min(wanted, maxLeft));
    state.panel.style.left = `${left}px`;
    state.panel.style.bottom = `${window.innerHeight - rect.top + 8}px`;
  }

  function openPanel() {
    if (!state.panel) {
      state.panel = buildPanel();
      document.body.appendChild(state.panel);
    }
    state.panel.style.display = 'flex';
    state.panelOpen = true;
    positionPanel();
    renderPanel();
  }

  function closePanel() {
    if (state.panel) state.panel.style.display = 'none';
    state.panelOpen = false;
  }

  function togglePanel() {
    if (state.panelOpen) closePanel();
    else openPanel();
  }

  // ---- toolbar button --------------------------------------------------

  // The captions toggle carries a "closed_caption" material symbol; its glyph
  // name is language-independent, unlike the localized aria-label.
  function findCaptionsToggle() {
    const icons = document.querySelectorAll('button i');
    for (const icon of icons) {
      if (icon.textContent.trim() === 'closed_caption') return icon.closest('button');
    }
    return null;
  }

  function buildToolbarButton(size) {
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button';
    btn.title = 'Meet Captions Extractor';
    btn.style.width = `${size}px`;
    btn.style.height = `${size}px`;
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">' +
      '<path d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z"/>' +
      '</svg><span class="mce-cc-count" hidden>0</span>';
    btn.addEventListener('click', togglePanel);
    return btn;
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

    const size = toggle.offsetHeight || 48;
    const btn = buildToolbarButton(size);
    parent.insertBefore(btn, wrapper.nextSibling);
    state.toolbarBtn = btn;
    state.countEl = btn.querySelector('.mce-cc-count');
  }

  function removeToolbarButton() {
    const existing = document.getElementById(BUTTON_ID);
    if (existing) existing.remove();
    state.toolbarBtn = null;
    state.countEl = null;
    closePanel();
  }

  function updateCount() {
    if (!state.countEl) return;
    const count = state.records.length;
    state.countEl.textContent = String(count);
    state.countEl.hidden = count === 0;
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
    renderPanel();
  }

  function injectStyles() {
    if (document.getElementById('mce-styles')) return;
    const style = document.createElement('style');
    style.id = 'mce-styles';
    style.textContent = [
      `#${BUTTON_ID}{position:relative;display:inline-flex;align-items:center;`,
      `justify-content:center;margin:0 4px;padding:0;border:none;border-radius:50%;`,
      `background:rgba(255,255,255,.10);color:#e8eaed;cursor:pointer;box-sizing:border-box;}`,
      `#${BUTTON_ID}:hover{background:rgba(255,255,255,.18);}`,
      `#${BUTTON_ID} svg{display:block;width:24px;height:24px;}`,
      `#${BUTTON_ID} .mce-cc-count{position:absolute;top:-2px;right:-2px;min-width:18px;`,
      `height:18px;padding:0 4px;border-radius:9px;background:#1a73e8;color:#fff;`,
      `font:600 11px/18px Roboto,Arial,sans-serif;text-align:center;box-sizing:border-box;}`,
      `#${BUTTON_ID} .mce-cc-count[hidden]{display:none;}`,

      `#${PANEL_ID}{position:fixed;z-index:2147483647;width:${PANEL_WIDTH}px;max-height:60vh;`,
      `display:flex;flex-direction:column;background:#202124;color:#e8eaed;border-radius:12px;`,
      `box-shadow:0 4px 24px rgba(0,0,0,.5);overflow:hidden;`,
      `font:13px/1.4 Roboto,Arial,sans-serif;}`,
      `#${PANEL_ID} header{padding:12px 14px 8px;border-bottom:1px solid #3c4043;}`,
      `#${PANEL_ID} h1{margin:0;font-size:14px;font-weight:500;}`,
      `#${PANEL_ID} .mce-status{display:block;margin-top:2px;font-size:11px;color:#9aa0a6;}`,
      `#${PANEL_ID} .mce-list{list-style:none;margin:0;padding:8px 14px;overflow-y:auto;flex:1;}`,
      `#${PANEL_ID} .mce-list:empty::after{content:"No captions recorded yet.";`,
      `color:#9aa0a6;font-style:italic;}`,
      `#${PANEL_ID} .mce-list li{padding:4px 0;border-bottom:1px solid #2a2b2e;word-break:break-word;}`,
      `#${PANEL_ID} .mce-list li:last-child{border-bottom:none;}`,
      `#${PANEL_ID} .mce-time{margin-right:6px;color:#9aa0a6;font-variant-numeric:tabular-nums;}`,
      `#${PANEL_ID} .mce-speaker{margin-right:4px;font-weight:500;}`,
      `#${PANEL_ID} .mce-speaker::after{content:":";}`,
      `#${PANEL_ID} .mce-actions{display:flex;gap:8px;padding:10px 14px;border-top:1px solid #3c4043;}`,
      `#${PANEL_ID} .mce-btn{flex:1;padding:8px 10px;border:1px solid #5f6368;border-radius:6px;`,
      `background:transparent;color:#8ab4f8;font:inherit;font-weight:500;cursor:pointer;}`,
      `#${PANEL_ID} .mce-btn:hover{background:rgba(255,255,255,.06);}`,
      `#${PANEL_ID} .mce-btn:disabled{color:#5f6368;cursor:default;background:transparent;}`,
      `#${PANEL_ID} .mce-btn--primary{background:#1a73e8;border-color:#1a73e8;color:#fff;}`,
      `#${PANEL_ID} .mce-btn--primary:hover{background:#1b66c9;}`,
      `#${PANEL_ID} .mce-btn--primary:disabled{background:#3c4043;border-color:#3c4043;color:#9aa0a6;}`,
    ].join('');
    document.documentElement.appendChild(style);
  }

  // ---- recording -------------------------------------------------------

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

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'mce-reset') clearTranscript();
  });

  document.addEventListener(
    'click',
    (e) => {
      if (!state.panelOpen) return;
      if (state.panel && state.panel.contains(e.target)) return;
      if (state.toolbarBtn && state.toolbarBtn.contains(e.target)) return;
      closePanel();
    },
    true
  );

  window.addEventListener('resize', () => {
    if (state.panelOpen) positionPanel();
  });

  injectStyles();
  restore();
  setInterval(tryAttach, 1000);

  // Debug handles for manual inspection from the DevTools console.
  self.__mceState = state;
  self.__mceIngest = ingest;
})();
