import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// .envファイルを読み込み
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const SUPPORTED_LANGUAGES = {
  en: { name: 'English', prompt: 'translate to natural English' },
  'zh-tw': { name: '繁體中文（Traditional Chinese）', prompt: 'translate to Traditional Chinese (繁體中文)' },
  'zh-cn': { name: '简体中文（Simplified Chinese）', prompt: 'translate to Simplified Chinese (简体中文)' },
  ko: { name: '한국어（Korean）', prompt: 'translate to Korean (한국어)' }
};

async function translateWithClaude(text, targetLang) {
  const langConfig = SUPPORTED_LANGUAGES[targetLang];

  const client = new Anthropic({
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
    timeout: 120_000,
    maxRetries: 2,
  });

  console.log(`    Translating to ${targetLang} (${text.length} chars)...`);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
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

async function translateArticle(article, targetLang) {
  try {
    return {
      title: await translateWithClaude(article.title, targetLang),
      summary: await translateWithClaude(article.summary, targetLang),
      body: await translateWithClaude(article.body, targetLang)
    };
  } catch (err) {
    console.warn(`  ✗ ${targetLang} translation failed: ${err.message}`);
    return null;
  }
}

async function translateSingleFile(slug) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
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
    posts = JSON.parse(indexContent);
  } catch (err) {
    console.error(`Failed to parse index.js: ${err.message}`);
    console.error(`First 200 chars of index.js:\n${indexContent.slice(0, 200)}`);
    throw new Error(`Could not parse posts/index.js as JSON`);
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

  // 各言語のファイルを保存
  for (const [lang, content] of Object.entries(translations)) {
    const langDir = path.join(postsDir, lang);
    await fs.mkdir(langDir, { recursive: true });
    const mdPath = path.join(langDir, `${slug}.md`);
    await fs.writeFile(mdPath, content.body, 'utf-8');
    console.log(`Created: ${mdPath}`);
  }

  // posts/index.js に各言語のメタデータを追加
  await updatePostInIndex(indexPath, indexContent, post, translations);

  console.log('\n=== Translation complete ===');
}

async function updatePostInIndex(indexPath, originalContent, post, translations) {
  // エントリを探す
  const entryPattern = new RegExp(`\\{\\s*"slug":\\s*"${post.slug}"[\\s\\S]*?\\}`, 'g');
  const match = originalContent.match(entryPattern);

  if (!match) {
    console.warn(`  Could not find entry for ${post.slug} in index.js`);
    return;
  }

  let entryString = match[0];

  // 各言語のtitleとsummaryフィールドを追加（存在しない場合のみ）
  for (const lang of Object.keys(SUPPORTED_LANGUAGES)) {
    const titleField = `title_${lang}`;
    const summaryField = `summary_${lang}`;

    // titleフィールドが存在しない場合のみ追加
    if (!entryString.includes(`"${titleField}"`)) {
      // titleの後に追加
      const titlePattern = `("title": ${JSON.stringify(post.title)}`;
      if (entryString.includes(titlePattern)) {
        entryString = entryString.replace(
          titlePattern,
          `${titlePattern},\n    "${titleField}": ${JSON.stringify(translations[lang]?.title || '')}`
        );
      }
    }

    // summaryフィールドが存在しない場合のみ追加
    if (!entryString.includes(`"${summaryField}"`)) {
      // summaryの後に追加
      const summaryPattern = `("summary": ${JSON.stringify(post.summary)}`;
      if (entryString.includes(summaryPattern)) {
        entryString = entryString.replace(
          summaryPattern,
          `${summaryPattern},\n    "${summaryField}": ${JSON.stringify(translations[lang]?.summary || '')}`
        );
      }
    }
  }

  // ファイルを更新
  await fs.writeFile(indexPath, entryString, 'utf-8');
  console.log(`Updated ${indexPath}`);
}

// 実行
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
