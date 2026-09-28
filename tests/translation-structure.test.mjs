import test from 'node:test';
import assert from 'node:assert/strict';
import * as shared from '../scripts/shared.mjs';

const original = { title: 'News', summary: 'Summary', body: '## Facts\n2026.09.28 [source](https://example.com)\n\n## Uncertainty\nUnknown' };
test('translation preserves source URLs, section count and absolute dates', () => {
  assert.equal(typeof shared.assertTranslation, 'function');
  assert.doesNotThrow(() => shared.assertTranslation(original, { ...original, title: 'Translated', body: original.body.replace('Facts', '事実') }));
  for (const body of [original.body.replace('https://example.com', 'https://evil.example'), original.body.replace('## Uncertainty', 'Uncertainty'), original.body.replace('2026.09.28', '2026.09.29')]) {
    assert.throws(() => shared.assertTranslation(original, { ...original, body }));
  }
});

test('translation preserves each source citation even when the URL also appears in references', () => {
  const article = { ...original, body: '## Facts\n2026.09.28 [source](<https://example.com>)\n\n## References\n[source](<https://example.com>)' };
  const broken = article.body.replace('[source](<https://example.com>)', '[source](<https://example.com>）');
  assert.throws(() => shared.assertTranslation(article, { ...article, body: broken }), /source URLs/);
  assert.throws(() => shared.assertTranslation(article, { ...article, body: article.body + '\n[source](<https://example.com>)' }), /source URLs/);
  assert.doesNotThrow(() => shared.assertTranslation(article, { ...article, body: article.body.replaceAll('[source]', '[出典]') }));
});
