import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('importing generation does not fetch, validate, write or start a timer', () => {
  const output = execFileSync(process.execPath, ['--input-type=module', '-e',
    'await import("./scripts/generate-post.mjs")'], { encoding: 'utf8', timeout: 1000 });
  assert.equal(output, '');
});
