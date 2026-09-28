import test from 'node:test';
import assert from 'node:assert/strict';
import { generateBlogPost, validateNewsItemCount, updatePosts } from '../scripts/generate-post.mjs';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const fixture = JSON.parse(await readFile(new URL('./fixtures/editorial.json', import.meta.url), 'utf8'));
const news = fixture.news;
const article = { title: 'AI news', summary: 'Summary', body: '## AI news\n\nNews. [Source](https://example.com/news)\n\n## まとめ\n\nSummary\n\n## 参考リンク\n\n[Source](https://example.com/news)' };
const response = (value, extra = {}) => new Response(JSON.stringify({
  status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: typeof value === 'string' ? value : JSON.stringify(value) }] }], ...extra,
}));

test('a quiet news day with one sourced item is valid', () => {
  assert.equal(validateNewsItemCount(article), true);
});

test('a non-news introduction does not count as a sourced news item', () => {
  assert.equal(validateNewsItemCount({ ...article, body: '## Intro\nhello\n## まとめ\nsummary\n## 参考リンク\nlinks' }), false);
});

test('headings and links inside a code example are not news sections', () => {
  assert.equal(validateNewsItemCount({ ...article, body: '```md\n## Fake news\n[link](https://example.com/news)\n```\n## まとめ\nSummary\n## 参考リンク\nLinks' }), false);
});

test('reference-style source links count as actual news links', () => {
  const body = '## News\n\n[Source][source]\n\n## まとめ\n\nSummary\n\n## 参考リンク\n\n[source]: https://example.com/news';
  assert.equal(validateNewsItemCount({ ...article, body }), true);
});

test('source URLs with balanced parentheses survive both generation stages', async t => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  t.after(() => { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous; });
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => response(++calls === 1 ? fixture.selection : fixture.draft));
  const result = await generateBlogPost(news);
  assert.ok(result.article.body.includes('https://example.com/news_(AI)'));
  assert.equal(validateNewsItemCount(result.article), true);
  assert.equal(calls, 2);
});

test('generation retries incomplete selection and increases output budget', async t => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  t.after(() => { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous; });
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    requests.push(JSON.parse(options.body));
    if (requests.length === 1) return response('{"stories":', { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } });
    return response(requests.length === 2 ? fixture.selection : fixture.draft);
  });
  const result = await generateBlogPost(news);
  assert.ok(result.article.body.includes('未確定な点'));
  assert.equal(requests.length, 3);
  assert.ok(requests[1].max_output_tokens > requests[0].max_output_tokens);
  assert.equal(requests[2].text.format.name, 'news_draft');
});

test('invalid metadata is rejected before any files are written', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'ai-blog-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'posts/ja'), { recursive: true });
  await writeFile(path.join(dir, 'posts/index.js'), 'const posts = [];\n');
  await assert.rejects(updatePosts({ ja: { ...article, title: 'bad\ntitle' } }, dir));
  assert.deepEqual(await readdir(path.join(dir, 'posts/ja')), []);
  assert.equal(await readFile(path.join(dir, 'posts/index.js'), 'utf8'), 'const posts = [];\n');
});
