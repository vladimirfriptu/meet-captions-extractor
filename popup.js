const core = window.MeetCaptionsCore;
const MAX_PREVIEW = 30;

const statusEl = document.getElementById('status');
const listEl = document.getElementById('messages');
const downloadBtn = document.getElementById('download');
const clearBtn = document.getElementById('clear');

function getRecords(cb) {
  chrome.storage.local.get('meetTranscript', (data) => {
    const saved = data && data.meetTranscript;
    cb(saved && saved.records ? saved.records : []);
  });
}

function render(records) {
  const count = records.length;
  statusEl.textContent = count
    ? `${count} line${count === 1 ? '' : 's'} recorded`
    : 'Open captions (CC) in a Meet call to start recording.';
  downloadBtn.disabled = count === 0;
  clearBtn.disabled = count === 0;

  listEl.textContent = '';
  const recent = records.slice(-MAX_PREVIEW);
  for (const r of recent) {
    const li = document.createElement('li');

    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = core.formatTime(r.t);

    const speaker = document.createElement('span');
    speaker.className = 'speaker';
    speaker.textContent = r.speaker;

    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = r.text;

    li.append(time, speaker, text);
    listEl.appendChild(li);
  }
  listEl.scrollTop = listEl.scrollHeight;
}

function download() {
  getRecords((records) => {
    if (!records.length) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const participants = [...new Set(records.map((r) => r.speaker))];
    const text = core.buildTranscript(records, { date, participants });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const stamp = date.replace(/[: ]/g, '-');
    const a = document.createElement('a');
    a.href = url;
    a.download = `meet-transcript-${stamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function clearAll() {
  chrome.storage.local.remove('meetTranscript', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.id != null) {
        chrome.tabs.sendMessage(tab.id, { type: 'mce-reset' }, () => {
          void chrome.runtime.lastError;
        });
      }
      render([]);
    });
  });
}

downloadBtn.addEventListener('click', download);
clearBtn.addEventListener('click', clearAll);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.meetTranscript) return;
  const next = changes.meetTranscript.newValue;
  render(next && next.records ? next.records : []);
});

getRecords(render);
