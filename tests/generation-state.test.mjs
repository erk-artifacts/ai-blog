import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prepareSources, validateSelection, renderDigest } from '../scripts/editorial.mjs';
import { createGenerationState, saveGenerationState, loadGenerationState, completeTranslations } from '../scripts/generation-state.mjs';
import { updatePosts } from '../scripts/generate-post.mjs';
import { parsePostsIndex } from '../scripts/shared.mjs';

const fixture = JSON.parse(await fs.readFile(new URL('./fixtures/editorial.json', import.meta.url), 'utf8'));
function digest() {
  const sources = prepareSources(fixture.news, new Date(fixture.now));
  const plan = validateSelection(fixture.selection, sources);
  return { article: renderDigest(plan, fixture.draft, sources, '2026-09-28'), provenance: {
    publicationDate: '2026-09-28', createdAt: fixture.now, sources, plan, draft: fixture.draft,
  } };
}
async function workspace(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-blog-resume-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.mkdir(path.join(dir, 'posts'), { recursive: true });
  await fs.writeFile(path.join(dir, 'posts/index.js'), 'const posts = [];');
  return dir;
}
function key(t) {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  t.after(() => { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous; });
}
const response = article => new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(article) }] }] }));

test('checkpoint resumes only missing translations and retains source evidence', async t => {
  key(t);
  const dir = await workspace(t);
  const file = path.join(dir, 'checkpoint.json');
  const state = createGenerationState(digest());
  await saveGenerationState(file, state);
  let failKorean = true;
  const languages = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const payload = JSON.parse(options.body);
    languages.push(payload.instructions);
    if (failKorean && payload.instructions.includes('Korean')) return new Response('{}', { status: 401 });
    return response({ ...state.article, title: 'Translated title' });
  });
  await completeTranslations(state, current => saveGenerationState(file, current));
  const saved = await loadGenerationState(file);
  assert.equal(saved.translations.ko, undefined);
  assert.ok(saved.translations.en);
  assert.ok(saved.translations['zh-tw']);
  assert.ok(saved.translations['zh-cn']);
  assert.equal(saved.provenance.plan.stories[0].facts[0].evidence, fixture.selection.stories[0].facts[0].evidence);
  languages.length = 0;
  failKorean = false;
  await completeTranslations(saved, current => saveGenerationState(file, current));
  assert.equal(languages.length, 1);
  assert.ok(languages[0].includes('Korean'));
  assert.equal(Object.keys((await loadGenerationState(file)).translations).length, 5);
});

test('resuming publication updates the original slug without duplicating the post', async t => {
  const dir = await workspace(t);
  const state = createGenerationState(digest());
  const options = { publicationDate: state.provenance.publicationDate, generationId: state.generationId };
  const slug = await updatePosts(state.translations, dir, options);
  state.translations.en = { ...state.translations.ja, title: 'AI Frontier Today：Translated' };
  assert.equal(await updatePosts(state.translations, dir, options), slug);
  const posts = parsePostsIndex(await fs.readFile(path.join(dir, 'posts/index.js'), 'utf8'));
  assert.equal(posts.length, 1);
  assert.equal(posts[0].date, '2026.09.28');
  assert.equal(posts[0].title_en, state.translations.en.title);
  assert.equal(await fs.readFile(path.join(dir, 'posts/en', slug + '.md'), 'utf8'), state.article.body);
});

test('a checkpoint with edited Japanese content is rejected instead of silently publishing it', async t => {
  const dir = await workspace(t);
  const file = path.join(dir, 'checkpoint.json');
  const state = createGenerationState(digest());
  state.article.body += '\nInvented statement';
  await fs.writeFile(file, JSON.stringify(state));
  await assert.rejects(loadGenerationState(file), /article|content/i);
});

test('checkpoint from an unpushed job can recover its article in a fresh checkout', async t => {
  const dir = await workspace(t);
  const state = createGenerationState(digest());
  const options = { publicationDate: '2026-09-28', generationId: state.generationId, publishedSlug: '2026-09-28' };
  const slug = await updatePosts(state.translations, dir, options);
  assert.equal(slug, '2026-09-28');
  assert.equal(parsePostsIndex(await fs.readFile(path.join(dir, 'posts/index.js'), 'utf8')).length, 1);
});

test('publication uses the frozen publication day and never overwrites later edits', async t => {
  const dir = await workspace(t);
  const state = createGenerationState(digest());
  const options = { publicationDate: '2026-01-02', generationId: state.generationId };
  const slug = await updatePosts(state.translations, dir, options);
  assert.equal(slug, '2026-01-02');
  const file = path.join(dir, 'posts/ja', slug + '.md');
  await fs.writeFile(file, 'Manually edited');
  await assert.rejects(updatePosts(state.translations, dir, options), /refusing to overwrite/);
  assert.equal(await fs.readFile(file, 'utf8'), 'Manually edited');
});

test('checkpoint write failures are fatal rather than reported as translation failures', async t => {
  key(t);
  const state = createGenerationState(digest());
  t.mock.method(globalThis, 'fetch', async () => response({ ...state.article, title: 'Translated' }));
  await assert.rejects(completeTranslations(state, async () => { throw new Error('Disk full'); }), /Disk full/);
});
