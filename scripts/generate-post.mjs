import Parser from 'rss-parser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { marked } from 'marked';
import { validateEntry } from './validate-post.mjs';
import { SUPPORTED_LANGUAGES, assertArticle, assertSlug, parsePostsIndex, serializePostsIndex, japanDate, selectNewsItems } from './shared.mjs';
import { generateDigest as generateBlogPost, validCalendarDate } from './editorial.mjs';
import { writeAtomic } from './storage.mjs';
import { createGenerationState, saveGenerationState, loadGenerationState, completeTranslations } from './generation-state.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');
const FETCH_ONLY = process.argv.includes('--fetch-only');

// ---------------------------------------------------------------------------
// 1. RSS Feed Fetching
// ---------------------------------------------------------------------------

export async function fetchFeed(url, { timeoutMs = 15000 } = {}) {
  // rss-parser.parseURL rejects without closing failed/timed-out requests.
  // Fetch owns the network lifetime; rss-parser only handles the completed XML.
  const response = await fetch(url, {
    headers: { 'User-Agent': 'rss-parser', Accept: 'application/rss+xml, application/atom+xml, application/xml' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Status code ${response.status}`);
  }
  const charset = /charset=["']?([^;\s"']+)/i.exec(response.headers.get('content-type') || '')?.[1] || 'utf-8';
  const xml = new TextDecoder(charset).decode(await response.arrayBuffer());
  return new Parser().parseString(xml);
}

async function fetchAllFeeds() {
  const feedsConfig = JSON.parse(
    await fs.readFile(path.join(__dirname, 'rss-feeds.json'), 'utf-8')
  );
  const results = await Promise.allSettled(
    feedsConfig.feeds.map(async (feed) => {
      try {
        console.log(`  Fetching ${feed.name}...`);
        const data = await fetchFeed(feed.url);
        console.log(`  ${feed.name}: ${data.items.length} items`);
        return data.items.map((item) => ({
          title: item.title || '',
          link: item.link || '',
          snippet: (item.contentSnippet || item.content || '').slice(0, 1500),
          source: feed.name,
          sourceType: feed.sourceType || 'unknown',
          collectedAt: new Date().toISOString(),
          pubDate: item.isoDate || item.pubDate || '',
        }));
      } catch (err) {
        console.warn(`  Warning: Failed to fetch ${feed.name}: ${err.message}`);
        return [];
      }
    })
  );

  let items = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .filter((item) => item.title && item.link);

  console.log(`Total items from all feeds: ${items.length}`);

  if (!items.length) throw new Error('RSS feeds returned no usable items');
  return selectNewsItems(items);
}

// ---------------------------------------------------------------------------
// 2. Blog Post Generation via OpenAI API
// ---------------------------------------------------------------------------

function validateNewsItemCount(blogPost, minItems = 1) {
  if (typeof blogPost?.body !== 'string') return false;
  const sections = [];
  for (const token of marked.lexer(blogPost.body)) {
    if (token.type === 'heading' && token.depth === 2) sections.push({ heading: token.text.trim(), hasSource: false });
    else if (sections.length) marked.walkTokens([token], child => {
      if (child.type === 'link' && /^https?:\/\//.test(child.href)) sections.at(-1).hasSource = true;
    });
  }
  const headings = sections.map(section => section.heading);
  if ((!headings.includes('まとめ') && !headings.includes('今日の見取り図')) || !headings.includes('参考リンク')) return false;
  const count = sections.filter(section => !['今日の要点', '今日の見取り図', 'まとめ', '参考リンク'].includes(section.heading)
    && section.hasSource).length;
  return count >= minItems;
}

// ---------------------------------------------------------------------------
// 3. Post Index & Markdown File Update
// ---------------------------------------------------------------------------

async function updatePosts(translations, repoDir, options = {}) {
  const postsDir = path.join(repoDir, 'posts');
  const indexPath = path.join(postsDir, 'index.js');
  const original = await fs.readFile(indexPath, 'utf8');
  const posts = parsePostsIndex(original);
  const baseSlug = options.publicationDate || japanDate();
  if (!validCalendarDate(baseSlug)) throw new Error('Invalid publication date');
  if (options.generationId && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(options.generationId)) throw new Error('Invalid generation ID');
  const existing = options.generationId ? posts.find(post => post.generationId === options.generationId) : undefined;
  if (options.publishedSlug) {
    assertSlug(options.publishedSlug);
    if (!options.generationId || (existing && existing.slug !== options.publishedSlug)) throw new Error('Checkpoint publication identity mismatch');
  }
  let slug = existing?.slug || options.publishedSlug || baseSlug;
  let counter = 2;
  while (!existing && (posts.some(post => post.slug === slug) || await fs.stat(path.join(postsDir, 'ja', slug + '.md')).then(() => true, error => {
    if (error.code === 'ENOENT') return false;
    throw error;
  }))) {
    if (options.publishedSlug) throw new Error('Checkpoint slug is occupied by another article; refusing to overwrite');
    slug = baseSlug + '-' + counter++;
  }

  assertArticle(translations.ja);
  if (existing && (existing.title !== translations.ja.title || existing.summary !== translations.ja.summary || existing.date !== baseSlug.replaceAll('-', '.'))) {
    throw new Error('Published Japanese metadata differs from checkpoint; refusing to overwrite edits');
  }
  const entry = { ...existing, title: translations.ja.title, summary: translations.ja.summary,
    category: 'AI NEWS', date: baseSlug.replaceAll('-', '.'), thumbnail: '', slug };
  if (options.generationId) entry.generationId = options.generationId;
  for (const [lang, content] of Object.entries(translations)) {
    if (lang !== 'ja' && !Object.hasOwn(SUPPORTED_LANGUAGES, lang)) throw new Error('Unsupported language');
    assertArticle(content);
    if (lang !== 'ja') { entry['title_' + lang] = content.title; entry['summary_' + lang] = content.summary; }
  }
  const errors = validateEntry(entry);
  if (errors.length) throw new Error('Post validation failed: ' + errors.join('; '));
  const updated = serializePostsIndex(existing ? posts.map(post => post === existing ? entry : post) : [entry, ...posts]);
  const createdFiles = [];
  try {
    for (const [lang, content] of Object.entries(translations)) {
      await fs.mkdir(path.join(postsDir, lang), { recursive: true });
      const file = path.join(postsDir, lang, slug + '.md');
      if (existing) {
        const saved = await fs.readFile(file, 'utf8').catch(error => { if (error.code === 'ENOENT') return null; throw error; });
        if (saved !== null) {
          if (saved !== content.body) throw new Error(`Published ${lang} body differs from checkpoint; refusing to overwrite edits`);
          continue;
        }
      }
      const handle = await fs.open(file, 'wx');
      createdFiles.push(file);
      try { await handle.writeFile(content.body, 'utf8'); } finally { await handle.close(); }
    }
    // Publish the index only after all bodies have been saved.
    await writeAtomic(indexPath, updated);
  } catch (error) {
    await Promise.all(createdFiles.map(file => fs.unlink(file).catch(() => {})));
    throw error;
  }
  console.log('Saved post: ' + slug + ' (' + Object.keys(translations).join(', ') + ')');
  return slug;
}

// ---------------------------------------------------------------------------
// 4. Main
// ---------------------------------------------------------------------------

// Hard timeout: exit cleanly before GitHub Actions job timeout
const SCRIPT_TIMEOUT_MS = 24 * 60 * 1000;
let scriptTimer;

async function main() {
  const args = process.argv.slice(2);
  const resumeIndex = args.indexOf('--resume');
  const resumeFile = resumeIndex < 0 ? null : args[resumeIndex + 1];
  if (resumeIndex >= 0 && (!resumeFile || resumeFile.startsWith('--') || FETCH_ONLY)) throw new Error('Usage: --resume <checkpoint.json> [--dry-run]');
  const repoDir = process.env.REPO_DIR || path.resolve(__dirname, '..');
  console.log('=== AI News Editorial Pipeline ===');
  let state;
  let checkpoint;
  if (resumeFile) {
    checkpoint = path.resolve(resumeFile);
    state = await loadGenerationState(checkpoint);
    console.log('Resuming checkpoint: ' + checkpoint);
  } else {
    if (!FETCH_ONLY && !process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY environment variable is not set');
    const newsItems = await fetchAllFeeds();
    console.log('Found ' + newsItems.length + ' recent news candidates.');
    if (FETCH_ONLY) {
      newsItems.forEach(item => console.log(item.source + ': ' + item.title + '\n  ' + item.link));
      return;
    }
    if (!newsItems.length) { console.log('No recent news. Skipping publication.'); return; }
    const digest = await generateBlogPost(newsItems);
    if (!digest) { console.log('No relevant AI news selected. Skipping publication.'); return; }
    state = createGenerationState(digest);
    checkpoint = path.join(repoDir, 'output', 'generation', state.provenance.publicationDate + '-' + state.generationId + '.json');
    if (!DRY_RUN) {
      await saveGenerationState(checkpoint, state);
      console.log('Japanese article and evidence saved: ' + checkpoint);
    }
  }

  const missing = () => Object.keys(SUPPORTED_LANGUAGES).filter(lang => !state.translations[lang]);
  if (missing().length && !process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required for pending translations');
  await completeTranslations(state, DRY_RUN ? async () => {} : current => saveGenerationState(checkpoint, current));
  if (DRY_RUN) {
    console.log('--- DRY RUN (no file changes) ---');
    console.log(JSON.stringify(state.translations, null, 2));
    if (missing().length) throw new Error('Dry run has pending translations: ' + missing().join(', '));
    return;
  }

  state.publishedSlug = await updatePosts(state.translations, repoDir, {
    publicationDate: state.provenance.publicationDate, generationId: state.generationId, publishedSlug: state.publishedSlug,
  });
  await saveGenerationState(checkpoint, state);
  if (missing().length) {
    console.warn('Published with pending translations: ' + missing().join(', '));
    console.warn('Resume with: npm run generate -- --resume "' + checkpoint + '"');
  }
  console.log('Done. Checkpoint: ' + checkpoint);
}

export { generateBlogPost, validateNewsItemCount, updatePosts };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  dotenv.config({ quiet: true });
  scriptTimer = setTimeout(() => {
    console.error('FATAL: Script exceeded hard timeout.');
    process.exit(1);
  }, SCRIPT_TIMEOUT_MS);
  main().catch((err) => {
    clearTimeout(scriptTimer);
    console.error('');
    console.error('========== FATAL ERROR ==========');
    console.error(`Message: ${err.message}`);
    if (err.status) console.error(`Status: ${err.status}`);
    if (err.error) console.error(`Error detail: ${JSON.stringify(err.error)}`);
    console.error(`Stack: ${err.stack}`);
    console.error('=================================');
    process.exitCode = 1;
  }).finally(() => clearTimeout(scriptTimer));
}
