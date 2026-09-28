import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createGenerationState, saveGenerationState } from '../scripts/generation-state.mjs';
import { prepareSources, validateSelection, renderDigest } from '../scripts/editorial.mjs';
import { SUPPORTED_LANGUAGES, applyTitlePrefix, parsePostsIndex } from '../scripts/shared.mjs';

const fixture = JSON.parse(await fs.readFile(new URL('./fixtures/editorial.json', import.meta.url), 'utf8'));
const command = fileURLToPath(new URL('../scripts/generate-post.mjs', import.meta.url));

test('completed checkpoint dry-run writes nothing; publication and repeated resume create exactly one post', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-blog-cli-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.mkdir(path.join(dir, 'posts'));
  const index = path.join(dir, 'posts/index.js');
  await fs.writeFile(index, 'const posts = [];');
  const sources = prepareSources(fixture.news, new Date(fixture.now));
  const plan = validateSelection(fixture.selection, sources);
  const article = renderDigest(plan, fixture.draft, sources, '2026-09-28');
  const state = createGenerationState({ article, provenance: { publicationDate: '2026-09-28', createdAt: fixture.now, sources, plan, draft: fixture.draft } });
  for (const lang of Object.keys(SUPPORTED_LANGUAGES)) state.translations[lang] = { ...article, title: applyTitlePrefix('Example', lang) };
  const file = path.join(dir, 'checkpoint.json');
  await saveGenerationState(file, state);
  const before = await fs.readFile(file, 'utf8');
  const run = args => execFileSync(process.execPath, [command, '--resume', file, ...args], {
    cwd: dir, env: { ...process.env, OPENAI_API_KEY: '', REPO_DIR: dir }, encoding: 'utf8', timeout: 5000,
  });
  assert.ok(run(['--dry-run']).includes('今日の要点'));
  assert.equal(await fs.readFile(index, 'utf8'), 'const posts = [];');
  assert.equal(await fs.readFile(file, 'utf8'), before);
  assert.deepEqual(await fs.readdir(path.join(dir, 'posts')), ['index.js']);
  run([]);
  run([]);
  const posts = parsePostsIndex(await fs.readFile(index, 'utf8'));
  assert.equal(posts.length, 1);
  assert.equal(posts[0].date, '2026.09.28');
  assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).publishedSlug, posts[0].slug);
});
