import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { marked } from 'marked';
import { prepareSources, validateSelection, validateDraft, renderDigest, generateDigest } from '../scripts/editorial.mjs';
import { markdownLinks } from '../scripts/shared.mjs';

const fixture = JSON.parse(await fs.readFile(new URL('./fixtures/editorial.json', import.meta.url), 'utf8'));
const fresh = () => structuredClone(fixture);
const sources = () => prepareSources(fixture.news, new Date(fixture.now));
const plan = () => validateSelection(fresh().selection, sources());
const response = value => new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] }));

test('renders facts, editorial interpretation, uncertainty and source timestamps in fixed order', () => {
  const article = renderDigest(plan(), fixture.draft, sources(), '2026-09-28');
  const headings = marked.lexer(article.body).filter(token => token.type === 'heading' && token.depth === 2).map(token => token.text);
  assert.deepEqual(headings, ['今日の要点', '1. AI評価ツールが公開、検証の選択肢に', '今日の見取り図', '参考リンク']);
  for (const label of ['確認できた事実', 'なぜ重要か', '影響を受ける人・分野', '考えられる影響', '未確定な点', '一次情報', '資料の公開日時', '取得時刻']) assert.ok(article.body.includes(label), label);
  const html = marked.parse(article.body);
  assert.ok(html.includes('2026.09.28'));
  assert.ok(html.includes('2026.09.29'));
  assert.ok(html.includes('説明会'));
  assert.ok(html.includes('1件'));
  assert.deepEqual([...new Set(markdownLinks(article.body))], [fixture.news[0].link]);
});

test('unknown source IDs and invented evidence are rejected', () => {
  const missing = fresh().selection;
  missing.stories[0].sourceIds = ['s999'];
  assert.throws(() => validateSelection(missing, sources()), /source/i);
  const invented = fresh().selection;
  invented.stories[0].facts[0].evidence = '実際の資料にはない引用';
  assert.throws(() => validateSelection(invented, sources()), /evidence/i);
});

test('event dates require a valid calendar date and matching source evidence', () => {
  for (const date of ['2026-02-30', '2026-09-28']) {
    const selection = fresh().selection;
    selection.stories[0].eventDate.date = date;
    assert.throws(() => validateSelection(selection, sources()), /date/i);
  }
});

test('unknown event dates stay unknown instead of using publication date', () => {
  const selection = fresh().selection;
  selection.stories[0].eventDate = { date: null, sourceId: null, evidence: null, label: null };
  const article = renderDigest(validateSelection(selection, sources()), fixture.draft, sources(), '2026-09-28');
  assert.ok(article.body.includes('出来事の日付：資料では確認できません'));
});

test('draft cannot omit or duplicate selected stories', () => {
  for (const stories of [[], [fixture.draft.stories[0], fixture.draft.stories[0]], [{ ...fixture.draft.stories[0], storyId: 'n999' }]]) {
    assert.throws(() => validateDraft({ ...fixture.draft, stories }, plan()), /stor/i);
  }
});

test('headlines cannot inject headings, HTML, or links into rendered content', () => {
  const draft = fresh().draft;
  draft.stories[0].headline = '<img src=x onerror=alert(1)> [偽リンク](https://evil.example)';
  const article = renderDigest(plan(), draft, sources(), '2026-09-28');
  const html = marked.parse(article.body);
  assert.ok(!html.includes('<img'));
  assert.deepEqual([...new Set(markdownLinks(article.body))], [fixture.news[0].link]);
});

test('selection limits unique stories and evidence source attribution', () => {
  const duplicate = fresh().selection;
  duplicate.stories.push(structuredClone(duplicate.stories[0]));
  assert.throws(() => validateSelection(duplicate, sources()), /duplicate/i);
  const foreign = fresh().selection;
  foreign.stories[0].facts[0].sourceId = 's2';
  assert.throws(() => validateSelection(foreign, sources()), /source/i);
  assert.throws(() => validateSelection({ stories: Array(6).fill(fixture.selection.stories[0]) }, sources()), /5|count|length/i);
});

test('selection then writing uses only selected sources, with no model-authored URLs', async t => {
  const original = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  t.after(() => { if (original === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = original; });
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return response(requests.length === 1 ? fixture.selection : fixture.draft);
  });
  const result = await generateDigest(fixture.news, { now: new Date(fixture.now) });
  assert.equal(requests.length, 2);
  assert.equal(requests[0].text.format.name, 'news_selection');
  assert.equal(requests[1].text.format.name, 'news_draft');
  assert.ok(!requests[1].input.includes('飲食店'));
  assert.ok(result.article.body.includes('未確定な点'));
  assert.equal(result.provenance.publicationDate, '2026-09-28');
});

test('no relevant AI news skips writing without inventing filler', async t => {
  const original = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  t.after(() => { if (original === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = original; });
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return response({ stories: [] }); });
  assert.equal(await generateDigest(fixture.news, { now: new Date(fixture.now) }), null);
  assert.equal(calls, 1);
});
