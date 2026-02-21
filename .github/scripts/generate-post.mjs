import Anthropic from '@anthropic-ai/sdk';
import Parser from 'rss-parser';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');
const FETCH_ONLY = process.argv.includes('--fetch-only');

// ---------------------------------------------------------------------------
// 1. RSS Feed Fetching
// ---------------------------------------------------------------------------

async function fetchAllFeeds() {
  const feedsConfig = JSON.parse(
    await fs.readFile(path.join(__dirname, 'rss-feeds.json'), 'utf-8')
  );
  const parser = new Parser({ timeout: 10000 });

  const results = await Promise.allSettled(
    feedsConfig.feeds.map(async (feed) => {
      try {
        console.log(`  Fetching ${feed.name}...`);
        const data = await parser.parseURL(feed.url);
        console.log(`  ${feed.name}: ${data.items.length} items`);
        return data.items.map((item) => ({
          title: item.title || '',
          link: item.link || '',
          snippet: (item.contentSnippet || item.content || '').slice(0, 300),
          source: feed.name,
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

  // Filter to last 24 hours, expand to 48h if too few
  const now = Date.now();
  const h24 = items.filter(
    (item) => item.pubDate && now - new Date(item.pubDate).getTime() < 86400000
  );

  if (h24.length >= 5) {
    items = h24;
  } else {
    const h48 = items.filter(
      (item) =>
        item.pubDate && now - new Date(item.pubDate).getTime() < 172800000
    );
    items = h48.length > 0 ? h48 : items;
  }

  // Sort by date (newest first) and cap at 20
  items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  return items.slice(0, 20);
}

// ---------------------------------------------------------------------------
// 2. Blog Post Generation via Claude API
// ---------------------------------------------------------------------------

async function generateBlogPost(newsItems) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic();

  const newsList = newsItems
    .map(
      (item, i) =>
        `${i + 1}. [${item.source}] ${item.title}\n   URL: ${item.link}\n   ${item.snippet}`
    )
    .join('\n\n');

  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

  console.log(`Calling Claude API (claude-haiku-4-5-20251001)...`);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system:
      'あなたは日本語テックブロガーです。AI初心者にもわかりやすく、読みやすい記事を書きます。出力は必ず指定されたJSON形式のみで返してください。マークダウンのコードブロックで囲まないでください。',
    messages: [
      {
        role: 'user',
        content: `以下のAI関連ニュースから5-8件を選び、日本語のブログ記事を作成してください。

## 要件:
- title: キャッチーな日本語タイトル（例：「今日のAI最前線：○○が話題に」）
- summary: 100文字以内の日本語サマリー
- body: HTML形式の本文（以下のタグのみ使用: h2, p, strong, ul, li, blockquote, hr, em）
  - 各ニュースを <h2> で区切る
  - 専門用語には括弧で簡単な説明を添える（例：LLM（大規模言語モデル））
  - 各ニュースの最後に「私たちの生活への影響」を一文で添える
  - 最後に「まとめ」セクションを入れる

## 出力形式（このJSON形式のみ、余計なテキストなしで返してください）:
{"title":"記事タイトル","summary":"要約テキスト","body":"<h2>...</h2><p>...</p>..."}

## 本日の日付: ${dateStr}

## ニュース一覧:
${newsList}`,
      },
    ],
  });

  console.log(`API response received. Usage: ${response.usage.input_tokens} input, ${response.usage.output_tokens} output tokens`);

  const text = response.content[0].text.trim();

  // Try to parse as JSON, with fallback extraction
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error(`Claude API response is not valid JSON:\n${text.slice(0, 500)}`);
  }
}

// ---------------------------------------------------------------------------
// 3. posts.js Update
// ---------------------------------------------------------------------------

async function updatePostsJs(newPost, repoDir) {
  const postsJsPath = path.join(repoDir, 'posts.js');
  console.log(`Reading ${postsJsPath}...`);

  const original = await fs.readFile(postsJsPath, 'utf-8');

  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

  // Escape backticks and template expressions in body for template literal
  const escapedBody = newPost.body
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');

  const newEntry = `  {
    title: ${JSON.stringify(newPost.title)},
    category: "AI NEWS",
    date: "${dateStr}",
    thumbnail: "",
    summary: ${JSON.stringify(newPost.summary)},
    body: \`${escapedBody}\`
  }`;

  // Insert new entry right after "const posts = ["
  const marker = 'const posts = [';
  const insertPoint = original.indexOf(marker);
  if (insertPoint === -1) {
    throw new Error('Could not find "const posts = [" in posts.js');
  }

  const afterMarker = insertPoint + marker.length;
  const updated =
    original.slice(0, afterMarker) +
    '\n' +
    newEntry +
    ',' +
    original.slice(afterMarker);

  await fs.writeFile(postsJsPath, updated, 'utf-8');

  // Syntax validation
  try {
    execSync(`node --check "${postsJsPath}"`, { stdio: 'pipe' });
  } catch {
    // Rollback on syntax error
    await fs.writeFile(postsJsPath, original, 'utf-8');
    throw new Error('Generated posts.js has syntax errors, rolled back to original');
  }

  console.log(`Updated ${postsJsPath}`);
}

// ---------------------------------------------------------------------------
// 4. Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== AI News Blog Post Generator ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`REPO_DIR: ${process.env.REPO_DIR || '(not set, using ".")'}`);
  console.log(`DRY_RUN: ${DRY_RUN}`);
  console.log(`FETCH_ONLY: ${FETCH_ONLY}`);
  console.log('');

  console.log('Step 1: Fetching RSS feeds...');
  const newsItems = await fetchAllFeeds();

  if (newsItems.length === 0) {
    console.log('No recent news items found. Skipping generation.');
    process.exit(0);
  }

  console.log(`Found ${newsItems.length} news items.\n`);

  if (FETCH_ONLY) {
    console.log('--- Fetched News Items ---');
    newsItems.forEach((item, i) => {
      console.log(`${i + 1}. [${item.source}] ${item.title}`);
      console.log(`   ${item.link}`);
      console.log(`   ${item.pubDate}`);
      console.log();
    });
    process.exit(0);
  }

  console.log('Step 2: Generating blog post via Claude API...');
  let blogPost;
  try {
    blogPost = await generateBlogPost(newsItems);
  } catch (err) {
    console.warn(`First attempt failed: ${err.message}`);
    console.warn('Retrying in 5s...');
    await new Promise((r) => setTimeout(r, 5000));
    blogPost = await generateBlogPost(newsItems);
  }

  console.log(`Generated: ${blogPost.title}\n`);

  if (DRY_RUN) {
    console.log('--- DRY RUN (no file changes) ---');
    console.log(JSON.stringify(blogPost, null, 2));
    process.exit(0);
  }

  console.log('Step 3: Updating posts.js...');
  const repoDir = process.env.REPO_DIR || '.';
  await updatePostsJs(blogPost, repoDir);
  console.log('\nDone!');
}

main().catch((err) => {
  console.error('');
  console.error('========== FATAL ERROR ==========');
  console.error(`Message: ${err.message}`);
  if (err.status) console.error(`Status: ${err.status}`);
  if (err.error) console.error(`Error detail: ${JSON.stringify(err.error)}`);
  console.error(`Stack: ${err.stack}`);
  console.error('=================================');
  process.exit(1);
});
