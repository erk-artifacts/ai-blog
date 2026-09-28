import test from 'node:test';
import assert from 'node:assert/strict';
import * as data from '../scripts/shared.mjs';

test('metadata parser handles braces inside strings without executing JavaScript', () => {
  assert.equal(typeof data.parsePostsIndex, 'function');
  const posts = [{ slug: '2026-09-28', title: 'A { strange } title' }];
  assert.deepEqual(data.parsePostsIndex(`// comment\nconst posts = ${JSON.stringify(posts)};\n`), posts);
  assert.throws(() => data.parsePostsIndex('const posts = []; globalThis.pwned = true;'));
  assert.throws(() => data.parsePostsIndex('const posts = [(() => { throw Error("executed"); })()];'));
});

test('metadata slugs cannot escape the posts directory', () => {
  assert.equal(typeof data.parsePostsIndex, 'function');
  assert.throws(() => data.parsePostsIndex('const posts = [{"slug":"../../.env"}];'));
});
