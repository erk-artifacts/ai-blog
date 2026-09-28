import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { validateEntry } from '../scripts/validate-post.mjs';

test('importing validation has no CLI side effects', () => {
  const output = execFileSync(process.execPath, ['--input-type=module', '-e',
    'await import("./scripts/validate-post.mjs")'], { encoding: 'utf8' });
  assert.equal(output, '');
});

test('invalid field types produce validation errors instead of throwing', () => {
  assert.ok(validateEntry({ title: 123, summary: {}, slug: '../secret', date: 'bad', category: 'AI NEWS' }).length);
});
