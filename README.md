# Meet Captions Extractor

Chrome extension (Manifest V3) that records Google Meet live captions and
downloads them as a plain-text transcript for analysis.

## Install (unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this folder.

## Usage

1. Join a Google Meet call and turn on captions (CC). Recording starts
   automatically.
2. While captions are on, a **CC ⬇ (N)** button appears in the Meet control
   bar next to the captions button — `N` is the number of recorded lines.
   Click it to download `meet-transcript-<timestamp>.txt` directly.
3. The extension icon in the toolbar opens a popup with a live preview of the
   latest lines, plus **Download .txt** and **Clear** (reset before a new call).

## Notes

- Captions carry no timestamp in Meet — times are measured from when
  recording started (`mm:ss`).
- The full transcript is kept in memory (and mirrored to
  `chrome.storage.local`), so lines Meet drops from the on-screen captions
  are preserved.
- Reloading the tab mid-call may duplicate the last few visible lines.
