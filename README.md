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
2. Click the extension icon in the toolbar to open the popup — it shows the
   latest recorded lines and updates live while open.
3. Press **Download .txt** to save `meet-transcript-<timestamp>.txt`.
4. Press **Clear** to reset the buffer before a new call.

## Notes

- Captions carry no timestamp in Meet — times are measured from when
  recording started (`mm:ss`).
- The full transcript is kept in memory (and mirrored to
  `chrome.storage.local`), so lines Meet drops from the on-screen captions
  are preserved.
- Reloading the tab mid-call may duplicate the last few visible lines.
