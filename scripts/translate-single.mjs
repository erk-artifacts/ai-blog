import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { SUPPORTED_LANGUAGES, translateArticle as translateStructuredArticle, parsePostsIndex, assertSlug } from './shared.mjs';
import { updatePostInIndex, writeAtomic } from './storage.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function translateArticle(article, targetLang) {
  try {
    return await translateStructuredArticle(article, targetLang);
  } catch (err) {
    console.warn(`  ✗ ${targetLang} translation failed: ${err.message}`);
    return null;
  }
}

async function translateSingleFile(slug) {
  assertSlug(slug);
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const postsDir = path.join(__dirname, '..', 'posts');
  const indexPath = path.join(postsDir, 'index.js');

  // 日本語ファイルを読み込み
  const jaPath = path.join(postsDir, 'ja', `${slug}.md`);
  console.log(`Reading ${jaPath}...`);

  const body = await fs.readFile(jaPath, 'utf-8');

  // posts/index.js から記事のメタデータを取得
  console.log(`Reading ${indexPath}...`);
  let indexContent;
  try {
    indexContent = await fs.readFile(indexPath, 'utf-8');
  } catch (err) {
    console.error(`Failed to read index.js: ${err.message}`);
    throw new Error(`Could not read posts/index.js`);
  }

  let posts;
  try {
    posts = parsePostsIndex(indexContent);
  } catch (err) {
    console.error(`Failed to parse index.js: ${err.message}`);
    console.error(`First 200 chars of index.js:\n${indexContent.slice(0, 200)}`);
    throw new Error(`Could not parse posts/index.js`);
  }

  const post = posts.find(p => p.slug === slug);

  if (!post) {
    throw new Error(`Post with slug '${slug}' not found in posts/index.js`);
  }

  console.log(`Found post: ${post.title}`);

  // 日本語の記事データ
  const article = {
    title: post.title,
    summary: post.summary,
    body: body
  };

  // 並列で翻訳
  console.log(`\nTranslating to ${Object.keys(SUPPORTED_LANGUAGES).length} languages in parallel...`);

  const translationPromises = Object.keys(SUPPORTED_LANGUAGES).map(async (lang) => {
    console.log(`  Translating to ${lang}...`);
    const result = await translateArticle(article, lang);
    if (result) {
      console.log(`  ✓ ${lang} translation complete`);
    }
    return { lang, result };
  });

  const results = await Promise.all(translationPromises);

  const translations = {};
  for (const { lang, result } of results) {
    if (result) {
      translations[lang] = result;
    }
  }

  if (!Object.keys(translations).length) throw new Error('All translations failed');

  // 各言語のファイルを保存
  for (const [lang, content] of Object.entries(translations)) {
    const langDir = path.join(postsDir, lang);
    await fs.mkdir(langDir, { recursive: true });
    const mdPath = path.join(langDir, `${slug}.md`);
    await writeAtomic(mdPath, content.body);
    console.log(`Created: ${mdPath}`);
  }

  // posts/index.js に各言語のメタデータを追加
  await updatePostInIndex(indexPath, indexContent, post, translations);

  console.log('\n=== Translation complete ===');
}

// CLI only: importing this module has no side effects.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  dotenv.config({ quiet: true });
  const slug = process.argv[2];

  if (!slug) {
    console.error('Usage: npm run translate:single -- <slug>');
    console.error('Example: npm run translate:single -- 2026-03-04-2');
    process.exit(1);
  }

  translateSingleFile(slug).catch(err => {
    console.error('\n========== ERROR ==========');
    console.error(`Message: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
    console.error('========================');
    process.exit(1);
  });

}
