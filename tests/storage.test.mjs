import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import * as storage from '../scripts/storage.mjs';
import { parsePostsIndex } from '../scripts/shared.mjs';
import { updatePosts } from '../scripts/generate-post.mjs';

async function workspace(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-blog-storage-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.mkdir(path.join(dir, 'posts/ja'), { recursive: true });
  return dir;
}

test('translation update preserves entries and braces within metadata strings', async t => {
  assert.equal(typeof storage.updatePostInIndex, 'function');
  const dir = await workspace(t);
  const file = path.join(dir, 'posts/index.js');
  const original = 'const posts = [{"slug":"sample","title":"A { title }","summary":"old"},{"slug":"other","title":"Other"}];';
  await fs.writeFile(file, original);
  await storage.updatePostInIndex(file, original, { slug: 'sample' }, { en: { title: 'Title', summary: 'Summary', body: 'Body' } });
  const posts = parsePostsIndex(await fs.readFile(file, 'utf8'));
  assert.equal(posts[0].title, 'A { title }');
  assert.equal(posts[0].title_en, 'AI Frontier Today：Title');
  assert.deepEqual(posts[1], { slug: 'other', title: 'Other' });
});

test('save handles a repository path containing shell metacharacters and preserves existing posts', async t => {
  const root = await workspace(t);
  const dir = path.join(root, 'repo & special');
  await fs.mkdir(path.join(dir, 'posts'), { recursive: true });
  await fs.writeFile(path.join(dir, 'posts/index.js'), 'const posts = [{"slug":"old","title":"old"}];');
  const article = { title: '今日のAI最前線：Test', summary: 'Summary', body: 'Body' };
  const slug = await updatePosts({ ja: article }, dir);
  assert.equal(await fs.readFile(path.join(dir, 'posts/ja', slug + '.md'), 'utf8'), 'Body');
  assert.equal(parsePostsIndex(await fs.readFile(path.join(dir, 'posts/index.js'), 'utf8'))[1].slug, 'old');
});

test('a save collision rolls back new bodies without deleting preexisting files', async t => {
  const dir = await workspace(t);
  const { japanDate } = await import('../scripts/shared.mjs');
  const slug = japanDate();
  await fs.mkdir(path.join(dir, 'posts/en'), { recursive: true });
  const existing = path.join(dir, 'posts/en', slug + '.md');
  await fs.writeFile(existing, 'Existing translation');
  await fs.writeFile(path.join(dir, 'posts/index.js'), 'const posts = [];');
  await assert.rejects(updatePosts({
    ja: { title: '今日のAI最前線：Test', summary: 'Summary', body: 'Body' },
    en: { title: 'AI Frontier Today：Test', summary: 'Summary', body: 'Body' },
  }, dir), { code: 'EEXIST' });
  assert.deepEqual(await fs.readdir(path.join(dir, 'posts/ja')), []);
  assert.equal(await fs.readFile(existing, 'utf8'), 'Existing translation');
  assert.equal(await fs.readFile(path.join(dir, 'posts/index.js'), 'utf8'), 'const posts = [];');
});
