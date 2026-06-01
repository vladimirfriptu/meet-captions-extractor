## Install (no clone required)

1. Download the `meet-captions-extractor-*.zip` from the **Assets** below.
2. Unzip it — you get a `meet-captions-extractor/` folder.
3. Open `chrome://extensions`, enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the unzipped `meet-captions-extractor/` folder.

## Usage

1. Join a Google Meet call and turn on captions (CC). Recording starts automatically.
2. Click the extension icon in the toolbar to open the popup — it shows the latest recorded lines and updates live while open.
3. Press **Download .txt** to save `meet-transcript-<timestamp>.txt`, or **Clear** to reset before a new call.

The full transcript is kept in memory (and mirrored to `chrome.storage.local`), so lines Meet drops from the on-screen captions are still preserved in the file.
