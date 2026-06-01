# Meet Captions Extractor

Chrome extension (Manifest V3) that records Google Meet live captions and
downloads them as a plain-text transcript for analysis.

## Install (unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this folder.

## Usage

1. Join a Google Meet call and turn on captions (CC).
2. Recording starts automatically; a floating **⬇ Transcript (N)** button
   appears bottom-right.
3. Click it to download `meet-transcript-<timestamp>.txt`.

## Notes

- Captions carry no timestamp in Meet — times are measured from when
  recording started (`mm:ss`).
- The full transcript is kept in memory (and mirrored to
  `chrome.storage.local`), so lines Meet drops from the DOM are preserved.
- Reloading the tab mid-call may duplicate the last few visible lines.
