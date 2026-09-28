import test from 'node:test';
import assert from 'node:assert/strict';
import * as shared from '../scripts/shared.mjs';
const now = Date.parse('2026-09-28T00:00:00Z');
const item = (id, age, source = 'A') => ({ title: `AI ${id}`, link: `https://example.com/${id}`, source, pubDate: new Date(now - age).toISOString() });

test('RSS selection rejects stale, future and unsafe URLs and deduplicates links', () => {
  assert.equal(typeof shared.selectNewsItems, 'function');
  const recent = item('recent', 1000);
  const items = [recent, recent, item('old', 72 * 3600000), item('future', -3600000), { ...recent, link: 'javascript:alert(1)' }];
  assert.deepEqual(shared.selectNewsItems(items, now), [recent]);
});

test('one busy feed cannot crowd out every other source', () => {
  assert.equal(typeof shared.selectNewsItems, 'function');
  const items = [...Array.from({ length: 25 }, (_, i) => item(i, i * 1000)), item('other', 3600000, 'B')];
  const selected = shared.selectNewsItems(items, now);
  assert.ok(selected.some(entry => entry.source === 'B'));
  assert.ok(selected.filter(entry => entry.source === 'A').length <= 5);
});

test('publication date is Japan time even on a UTC runner', () => {
  assert.equal(shared.japanDate(new Date('2026-09-27T16:00:00Z')), '2026-09-28');
});
