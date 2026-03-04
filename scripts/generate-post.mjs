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

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise.then(
      val => { clearTimeout(timer); return val; },
      err => { clearTimeout(timer); throw err; }
    ),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms);
    }),
  ]);
}

async function fetchAllFeeds() {
  const feedsConfig = JSON.parse(
    await fs.readFile(path.join(__dirname, 'rss-feeds.json'), 'utf-8')
  );
  const parser = new Parser({ timeout: 10000 });

  const results = await Promise.allSettled(
    feedsConfig.feeds.map(async (feed) => {
      try {
        console.log(`  Fetching ${feed.name}...`);
        const data = await withTimeout(
          parser.parseURL(feed.url),
          15000,
          feed.name
        );
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

  const client = new Anthropic({
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
    timeout: 90_000,    // 90 seconds max per request
    maxRetries: 0,      // no SDK-level retries (script has its own 3-attempt loop)
  });

  const newsList = newsItems
    .map(
      (item, i) =>
        `${i + 1}. [${item.source}] ${item.title}\n   URL: ${item.link}\n   ${item.snippet}`
    )
    .join('\n\n');

  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

const preferredModel = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
const modelFallbacks = [
  preferredModel,
  'claude-haiku-4-5-20251001',  // 軽量・高速・低コスト
  'claude-sonnet-4-5',           // フォールバック
].filter((model, index, arr) => model && arr.indexOf(model) === index);

  const requestPayload = {
    max_tokens: 8000,
    system: `あなたは日本語テックブロガーです。AI初心者にもわかりやすく、読みやすい記事を書きます。

【重要】出力は必ず指定されたJSON形式のみで返してください。余計な形式やテキストを一切加えず、JSONオブジェクトのみを出力してください。マークダウンのコードブロック（\`\`\`）で囲まないでください。説明文や前置きも不要です。記事には必ず元記事へのリンクを含めてください。

【JSON形式の注意】bodyフィールドはMarkdown形式です。JSONとして有効な文字列にしてください。`,
    messages: [
      {
        role: 'user',
        content: `以下のニュース一覧から**AI（人工知能）に直接関連するニュースのみ**を選び、日本語のブログ記事を作成してください。

【重要】AI・機械学習・LLM・生成AI・ロボティクスなどに直接関係しないニュース（一般的なIT・ビジネス・半導体・セキュリティなど）は必ず除外してください。AI関連ニュースが少ない場合は、5件や10件でも構いません。無理にかき集めず、質を優先してください。

## ニュース選定基準:
- 多様性: 様々なソース・トピック（研究、ビジネス、製品、規制、個人の見解）をバランスよく
- 重要度: 業界への影響が大きいもの優先
- 鮮度: 最新のものを優先
- X投稿: Sam AltmanやDario Amodeiなどの業界リーダーの興味深い発言・見解を含める
- 日本視点: 日本のソースからのニュースも積極的に含める

## 要件:
- title: キャッチーな日本語タイトル（例：「今日のAI最前線：○○が話題に」）
- summary: 100文字以内の日本語サマリー
- body: Markdown形式の本文（以下の記法を使用: ##見出し, **太字**, *斜体*, ---, > 引用, - リスト, [テキスト](URL)）
  - 各ニュースを ## 見出し で区切る
  - 専門用語には括弧で簡単な説明を添える（例：LLM（大規模言語モデル））
  - 各ニュース解説の末尾に必ず元記事へのリンクを追加する
    例: [→ 元記事を読む（ソース名）](元記事URL)
  - 各ニュースの最後に「私たちの生活への影響」を一文で添える
  - ニュース間は --- で区切る
  - 最後に「まとめ」セクション（## まとめ）を入れる
  - 記事の最後に「参考リンク」セクション（## 参考リンク）を追加し、すべての元記事URLを番号付きリストで掲載する
    例: 1. [ソース名: 記事タイトル](URL)

## 出力形式:
【重要】以下のJSON形式のみで返してください。余計な説明、コードブロックは一切含めないでください。JSONオブジェクトのみを出力してください。

{"title":"記事タイトル","summary":"要約テキスト","body":"## 見出し\n\n本文...\n\n---\n\n## まとめ\n\n..."}

## 本日の日付: ${dateStr}

## ニュース一覧:
${newsList}`,
      },
    ],
  };

  let response;
  let lastError;
  for (const model of modelFallbacks) {
    try {
      console.log(`Calling Claude API model: ${model}`);
      response = await client.messages.create({
        model,
        ...requestPayload,
      });
      break;
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} failed: ${err.message}`);
      if (!String(err.message || '').toLowerCase().includes('model')) {
        throw err;
      }
    }
  }

  if (!response) {
    throw new Error(`Failed to call Claude API with all candidate models. Last error: ${lastError?.message || 'unknown error'}`);
  }

  console.log(`API response received. Usage: ${response.usage.input_tokens} input, ${response.usage.output_tokens} output tokens`);

  const text = response.content[0].text.trim();

  // Try to parse as JSON, with multi-step fallback extraction
  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.warn('Initial JSON parse failed, attempting fallback extraction...');
    console.warn(`Parse error: ${parseError.message}`);

    // Step A: extract from markdown code fence (```json ... ``` or ``` ... ```)
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      try {
        const extracted = JSON.parse(fenceMatch[1]);
        console.log('Successfully extracted JSON from markdown code fence');
        return extracted;
      } catch {
        console.warn('Failed to parse JSON inside markdown code fence, trying object regex...');
      }
    }

    // Step B: extract raw JSON object via greedy regex
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const extracted = JSON.parse(match[0]);
        console.log('Successfully extracted JSON from response');
        return extracted;
      } catch (innerErr) {
        console.error('Failed to parse extracted JSON block');
        console.error(`Extracted text (first 500 chars): ${match[0].slice(0, 500)}`);
      }
    }

    // Log the invalid response for debugging
    console.error('========== INVALID API RESPONSE ==========');
    console.error(`Full response (first 1000 chars):\n${text.slice(0, 1000)}`);
    console.error('==========================================');
    throw new Error(`Claude API response is not valid JSON. See logs above for details.`);
  }
}

// ---------------------------------------------------------------------------
// 2.5. Output Validation
// ---------------------------------------------------------------------------

function validateNewsItemCount(blogPost, minItems = 3) {
  const h2Matches = blogPost.body.match(/^## /gm);
  const h2Count = h2Matches ? h2Matches.length : 0;

  // ## headings include: news items + "まとめ" + "参考リンク"
  // So actual news items = h2Count - 2
  const newsItemCount = h2Count - 2;

  console.log(`  Validation: Found ${newsItemCount} news items (${h2Count} h2 tags total)`);

  if (newsItemCount < minItems) {
    console.warn(`  ✗ Insufficient items: expected ${minItems}+, got ${newsItemCount}`);
    return false;
  }

  console.log(`  ✓ Item count OK: ${newsItemCount} items`);
  return true;
}

// ---------------------------------------------------------------------------
// 2.5. Translation Provider Abstraction
// ---------------------------------------------------------------------------

const SUPPORTED_LANGUAGES = {
  en: { name: 'English', prompt: 'translate to natural English' },
  'zh-tw': { name: '繁體中文（Traditional Chinese）', prompt: 'translate to Traditional Chinese (繁體中文)' },
  'zh-cn': { name: '简体中文（Simplified Chinese）', prompt: 'translate to Simplified Chinese (简体中文)' },
  ko: { name: '한국어（Korean）', prompt: 'translate to Korean (한국어)' }
};

// Claude APIで翻訳
async function translate(text, targetLang) {
  return await translateWithClaude(text, targetLang);
}

// Claude API translation implementation
async function translateWithClaude(text, targetLang) {
  const langConfig = SUPPORTED_LANGUAGES[targetLang];

  const client = new Anthropic({
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
    timeout: 120_000,  // タイムアウトを60秒から120秒に増加
    maxRetries: 2,
  });

  console.log(`    Calling Claude API for ${targetLang} (${text.length} chars)...`);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,  // 4000から8192に増加
    system: `You are a professional translator. ${langConfig.prompt}.
- Keep technical terms accurate
- Preserve Markdown formatting exactly
- Do not add explanations or extra text
- Return only the translated text`,
    messages: [
      { role: 'user', content: text }
    ],
  });

  const translatedText = response.content[0].text;
  console.log(`    Translation received (${translatedText.length} chars)`);
  return translatedText;
}

// Translate article to all supported languages
async function translateArticleToAllLanguages(article) {
  const translations = {
    ja: { title: article.title, summary: article.summary, body: article.body }
  };

  const langCodes = Object.keys(SUPPORTED_LANGUAGES);

  for (const langCode of langCodes) {
    console.log(`  Translating to ${langCode}...`);
    try {
      translations[langCode] = {
        title: await translate(article.title, langCode),
        summary: await translate(article.summary, langCode),
        body: await translate(article.body, langCode)
      };
      console.log(`  ✓ ${langCode} translation complete`);
    } catch (err) {
      console.warn(`  ✗ ${langCode} translation failed: ${err.message}`);
      // エラー時は翻訳をスキップ（空文字列で次の言語へ）
    }
  }

  return translations;
}

// ---------------------------------------------------------------------------
// 3. Post Index & Markdown File Update
// ---------------------------------------------------------------------------

async function updatePosts(translations, repoDir) {
  const postsDir = path.join(repoDir, 'posts');
  const indexPath = path.join(postsDir, 'index.js');

  // Ensure posts/ directory exists
  await fs.mkdir(postsDir, { recursive: true });

  // Create language directories
  for (const lang of Object.keys(translations)) {
    await fs.mkdir(path.join(postsDir, lang), { recursive: true });
  }

  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
  const baseSlug = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Determine unique slug (handle multiple posts on the same day)
  let slug = baseSlug;
  let counter = 2;
  while (true) {
    try {
      await fs.access(path.join(postsDir, 'ja', `${slug}.md`));
      slug = `${baseSlug}-${counter}`;
      counter++;
    } catch {
      break; // File doesn't exist, slug is available
    }
  }

  // Step A: Write Markdown files to language directories
  const createdFiles = [];
  for (const [lang, content] of Object.entries(translations)) {
    const langDir = path.join(postsDir, lang);
    const mdPath = path.join(langDir, `${slug}.md`);
    await fs.writeFile(mdPath, content.body, 'utf-8');
    createdFiles.push(mdPath);
    console.log(`Created ${mdPath}`);
  }

  // Step B: Update posts/index.js metadata
  console.log(`Reading ${indexPath}...`);
  const original = await fs.readFile(indexPath, 'utf-8');

  const newEntry = `  {
    "title": ${JSON.stringify(translations.ja.title)},
    "title_en": ${JSON.stringify(translations.en?.title || '')},
    "title_zh-tw": ${JSON.stringify(translations['zh-tw']?.title || '')},
    "title_zh-cn": ${JSON.stringify(translations['zh-cn']?.title || '')},
    "title_ko": ${JSON.stringify(translations.ko?.title || '')},
    "category": "AI NEWS",
    "date": "${dateStr}",
    "thumbnail": "",
    "summary": ${JSON.stringify(translations.ja.summary)},
    "summary_en": ${JSON.stringify(translations.en?.summary || '')},
    "summary_zh-tw": ${JSON.stringify(translations['zh-tw']?.summary || '')},
    "summary_zh-cn": ${JSON.stringify(translations['zh-cn']?.summary || '')},
    "summary_ko": ${JSON.stringify(translations.ko?.summary || '')},
    "slug": "${slug}"
  }`;

  // Insert new entry right after "const posts = ["
  const marker = 'const posts = [';
  const insertPoint = original.indexOf(marker);
  if (insertPoint === -1) {
    throw new Error('Could not find "const posts = [" in posts/index.js');
  }

  const afterMarker = insertPoint + marker.length;
  const updated =
    original.slice(0, afterMarker) +
    '\n' +
    newEntry +
    ',' +
    original.slice(afterMarker);

  await fs.writeFile(indexPath, updated, 'utf-8');

  // Syntax validation
  try {
    execSync(`node --check "${indexPath}"`, { stdio: 'pipe' });
  } catch {
    // Rollback on syntax error
    await fs.writeFile(indexPath, original, 'utf-8');
    for (const file of createdFiles) {
      await fs.unlink(file).catch(() => {});
    }
    throw new Error('Generated posts/index.js has syntax errors, rolled back to original');
  }

  console.log(`Updated ${indexPath}`);
}

// ---------------------------------------------------------------------------
// 4. Main
// ---------------------------------------------------------------------------

// Hard timeout: exit cleanly before GitHub Actions job timeout
const SCRIPT_TIMEOUT_MS = 8 * 60 * 1000;
const scriptTimer = setTimeout(() => {
  console.error('FATAL: Script exceeded 8-minute hard timeout. Exiting.');
  process.exit(1);
}, SCRIPT_TIMEOUT_MS);

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

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY is not set. Skipping generation to avoid workflow failure.');
    clearTimeout(scriptTimer);
    process.exit(0);
  }

  console.log('Step 2: Generating blog post via Claude API...');
  let blogPost;
  const MAX_ATTEMPTS = 3;
  const MIN_NEWS_ITEMS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`Generation attempt ${attempt}/${MAX_ATTEMPTS}...`);

    try {
      blogPost = await withTimeout(generateBlogPost(newsItems), 120_000, 'generateBlogPost');

      if (validateNewsItemCount(blogPost, MIN_NEWS_ITEMS)) {
        console.log(`✓ Successfully generated blog post with ${MIN_NEWS_ITEMS}+ items`);
        break;
      } else {
        if (attempt < MAX_ATTEMPTS) {
          console.warn(`Attempt ${attempt} generated too few items. Retrying in 5s...`);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    } catch (err) {
      console.warn(`Attempt ${attempt} failed: ${err.message}`);
      if (attempt < MAX_ATTEMPTS) {
        console.warn('Retrying in 5s...');
        await new Promise((r) => setTimeout(r, 3000));
      } else {
        throw err;
      }
    }
  }

  if (!blogPost || !validateNewsItemCount(blogPost, MIN_NEWS_ITEMS)) {
    throw new Error(`Failed to generate blog post with ${MIN_NEWS_ITEMS}+ items after ${MAX_ATTEMPTS} attempts`);
  }

  console.log(`Generated: ${blogPost.title}\n`);

  // Step 2.5: Translate to all languages
  console.log('Step 2.5: Translating to all languages...');
  console.log(`  ANTHROPIC_API_KEY set: ${!!process.env.ANTHROPIC_API_KEY}`);

  // Ensure we have blogPost before translation
  if (!blogPost) {
    throw new Error('blogPost is not defined after Step 2');
  }

  let translatedPost;
  try {
    translatedPost = await translateArticleToAllLanguages(blogPost);
    console.log('✓ Translation complete');
    console.log(`  Translated languages: ${Object.keys(translatedPost).join(', ')}`);
  } catch (err) {
    console.warn(`Translation failed: ${err.message}`);
    console.warn(`  Error stack: ${err.stack}`);
    // Fallback: continue with Japanese only
    translatedPost = {
      ja: { title: blogPost.title, summary: blogPost.summary, body: blogPost.body }
    };
  }

  if (DRY_RUN) {
    console.log('--- DRY RUN (no file changes) ---');
    console.log(JSON.stringify(blogPost, null, 2));
    process.exit(0);
  }

  console.log('Step 3: Updating posts...');
  const repoDir = process.env.REPO_DIR || '.';
  await updatePosts(translatedPost, repoDir);
  clearTimeout(scriptTimer);
  console.log('\nDone!');
  process.exit(0);
}

main().catch((err) => {
  clearTimeout(scriptTimer);
  console.error('');
  console.error('========== FATAL ERROR ==========');
  console.error(`Message: ${err.message}`);
  if (err.status) console.error(`Status: ${err.status}`);
  if (err.error) console.error(`Error detail: ${JSON.stringify(err.error)}`);
  console.error(`Stack: ${err.stack}`);
  console.error('=================================');
  process.exit(1);
});
