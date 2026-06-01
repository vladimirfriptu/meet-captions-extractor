const test = require('node:test');
const assert = require('node:assert');
const core = require('./core.js');

test('formatTime formats milliseconds as mm:ss', () => {
  assert.strictEqual(core.formatTime(0), '00:00');
  assert.strictEqual(core.formatTime(23000), '00:23');
  assert.strictEqual(core.formatTime(83000), '01:23');
  assert.strictEqual(core.formatTime(765000), '12:45');
});
