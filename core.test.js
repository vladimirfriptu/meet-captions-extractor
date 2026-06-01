const test = require('node:test');
const assert = require('node:assert');
const core = require('./core.js');

test('formatTime formats milliseconds as mm:ss', () => {
  assert.strictEqual(core.formatTime(0), '00:00');
  assert.strictEqual(core.formatTime(23000), '00:23');
  assert.strictEqual(core.formatTime(83000), '01:23');
  assert.strictEqual(core.formatTime(765000), '12:45');
});

const { JSDOM } = require('jsdom');

const CAPTIONS_HTML = `
<div role="region" aria-label="Captions">
  <div class="row">
    <div class="header">
      <img src="https://lh3.googleusercontent.com/a/x">
      <div><span>Oleksii Kuzmenko</span></div>
    </div>
    <div class="text">шли в рамках одного конекшену</div>
  </div>
  <div class="row">
    <div class="header">
      <img src="https://lh3.googleusercontent.com/a/y">
      <div><span>Viktor Morshch</span></div>
    </div>
    <div class="text">угу</div>
  </div>
  <div class="service"><button aria-label="Jump to bottom">x</button></div>
</div>`;

function buildDoc(html) {
  const dom = new JSDOM(html);
  return dom.window.document;
}

test('findCaptionsContainer finds region by aria-label', () => {
  const doc = buildDoc(CAPTIONS_HTML);
  const container = core.findCaptionsContainer(doc);
  assert.ok(container);
  assert.strictEqual(container.getAttribute('aria-label'), 'Captions');
});

test('findCaptionsContainer falls back to structure when label is localized', () => {
  const doc = buildDoc(CAPTIONS_HTML.replace('aria-label="Captions"', 'aria-label="Субтитри"'));
  const container = core.findCaptionsContainer(doc);
  assert.ok(container);
});

test('parseRow extracts speaker and text', () => {
  const doc = buildDoc(CAPTIONS_HTML);
  const container = core.findCaptionsContainer(doc);
  const firstRow = container.children[0];
  const parsed = core.parseRow(firstRow);
  assert.deepStrictEqual(parsed, {
    speaker: 'Oleksii Kuzmenko',
    text: 'шли в рамках одного конекшену',
  });
});

test('parseRow returns null for a row without avatar', () => {
  const doc = buildDoc(CAPTIONS_HTML);
  const container = core.findCaptionsContainer(doc);
  const serviceRow = container.querySelector('.service');
  assert.strictEqual(core.parseRow(serviceRow), null);
});

test('getCaptionRows returns only valid caption rows', () => {
  const doc = buildDoc(CAPTIONS_HTML);
  const container = core.findCaptionsContainer(doc);
  const rows = core.getCaptionRows(container);
  assert.strictEqual(rows.length, 2);
});

test('buildTranscript renders header and lines', () => {
  const records = [
    { id: 1, speaker: 'Oleksii Kuzmenko', text: 'hello', t: 0 },
    { id: 2, speaker: 'Viktor Morshch', text: 'world', t: 23000 },
  ];
  const meta = {
    date: '2026-06-01 14:32',
    participants: ['Oleksii Kuzmenko', 'Viktor Morshch'],
  };
  const out = core.buildTranscript(records, meta);
  assert.ok(out.includes('# Meet transcript — 2026-06-01 14:32'));
  assert.ok(out.includes('# Participants: Oleksii Kuzmenko, Viktor Morshch'));
  assert.ok(out.includes('[00:00] Oleksii Kuzmenko: hello'));
  assert.ok(out.includes('[00:23] Viktor Morshch: world'));
});

test('buildDownload builds a timestamped filename and transcript content', () => {
  const records = [
    { id: 1, speaker: 'Oleksii Kuzmenko', text: 'hello', t: 0 },
    { id: 2, speaker: 'Viktor Morshch', text: 'world', t: 23000 },
  ];
  const now = new Date(2026, 5, 1, 14, 32);
  const result = core.buildDownload(records, now);
  assert.strictEqual(result.filename, 'meet-transcript-2026-06-01-14-32.txt');
  assert.ok(result.content.includes('# Meet transcript — 2026-06-01 14:32'));
  assert.ok(result.content.includes('[00:00] Oleksii Kuzmenko: hello'));
});
