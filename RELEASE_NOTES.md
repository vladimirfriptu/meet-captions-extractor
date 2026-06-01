## Install (no clone required)

1. Download the `meet-captions-extractor-*.zip` from the **Assets** below.
2. Unzip it — you get a `meet-captions-extractor/` folder.
3. Open `chrome://extensions`, enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the unzipped `meet-captions-extractor/` folder.

## Usage

1. Join a Google Meet call and turn on captions (CC).
2. Recording starts automatically; a floating **⬇ Transcript (N)** button appears bottom-right.
3. Click it to download `meet-transcript-<timestamp>.txt`.

The full transcript is kept in memory (and mirrored to `chrome.storage.local`), so lines Meet drops from the on-screen captions are still preserved in the file.
