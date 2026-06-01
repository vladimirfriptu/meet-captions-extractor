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
2. While captions are on, a round **CC** button (with a line-count badge)
   appears in the Meet control bar next to the captions button. Click it to
   open a panel showing the latest recorded lines, with **Download .txt** and
   **Clear** (reset before a new call).
3. The extension icon in the toolbar opens the same controls as a popup.

## Notes

- Captions carry no timestamp in Meet — times are measured from when
  recording started (`mm:ss`).
- The full transcript is kept in memory (and mirrored to
  `chrome.storage.local`), so lines Meet drops from the on-screen captions
  are preserved.
- Reloading the tab mid-call may duplicate the last few visible lines.
