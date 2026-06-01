## Install (no clone required)

1. Download the `meet-captions-extractor-*.zip` from the **Assets** below.
2. Unzip it — you get a `meet-captions-extractor/` folder.
3. Open `chrome://extensions`, enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the unzipped `meet-captions-extractor/` folder.

## Usage

1. Join a Google Meet call and turn on captions (CC). Recording starts automatically.
2. While captions are on, a **CC ⬇ (N)** button appears in the Meet control bar next to the captions button — click it to download `meet-transcript-<timestamp>.txt` directly.
3. The extension icon in the toolbar opens a popup with a live preview, plus **Download .txt** and **Clear** (reset before a new call).

The full transcript is kept in memory (and mirrored to `chrome.storage.local`), so lines Meet drops from the on-screen captions are still preserved in the file.
