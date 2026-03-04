import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

async function translateExistingPosts() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const postsDir = path.join(__dirname, '..', 'posts');
  const indexPath = path.join(postsDir, 'index.js');

  // posts/index.js を読み込み
  console.log('Reading posts/index.js...');
  const indexContent = await fs.readFile(indexPath, 'utf-8');

  // posts配列を抽出（evalは危険なので正規表現で）
  const match = indexContent.match(/const posts = \[([\s\S]*?)\];/);
  if (!match) {
    throw new Error('Could not parse posts/index.js');
  }

  const postsData = JSON.parse(`[${match[1]}]`);

  console.log(`Found ${postsData.length} posts in index.js`);

  // 日本語本文が存在する記事のみを対象にする
  const postsToTranslate = [];
  for (const post of postsData) {
    const jaPath = path.join(postsDir, 'ja', `${post.slug}.md`);
    try {
      await fs.access(jaPath);
      postsToTranslate.push(post);
    } catch {
      // 日本語ファイルが存在しない場合はスキップ
    }
  }

  console.log(`Found ${postsToTranslate.length} posts to translate`);

  if (postsToTranslate.length === 0) {
    console.log('No posts to translate.');
    return;
  }

  // 並列で翻訳
  console.log('Starting parallel translation...');

  for (const post of postsToTranslate) {
    console.log(`\nTranslating: ${post.slug}`);
    console.log(`  Title: ${post.title}`);

    const translations = {};

    // すべての言語を並列で翻訳
    const langPromises = Object.keys(SUPPORTED_LANGUAGES).map(async (lang) => {
      console.log(`  Translating to ${lang}...`);
      const result = await translateArticle(post, lang);
      if (result) {
        console.log(`  ✓ ${lang} translation complete`);
      }
      return { lang, result };
    });

    const results = await Promise.all(langPromises);

    // 翻訳をtranslationsに保存
    for (const { lang, result } of results) {
      if (result) {
        translations[lang] = result;
      }
    }

    // 各言語のファイルを保存
    for (const [lang, content] of Object.entries(translations)) {
      const langDir = path.join(postsDir, lang);
      await fs.mkdir(langDir, { recursive: true });
      const mdPath = path.join(langDir, `${post.slug}.md`);
      await fs.writeFile(mdPath, content.body, 'utf-8');
      console.log(`  Created: ${mdPath}`);
    }

    // posts/index.js を更新（各言語のタイトルとサマリーを追加）
    await updatePostInIndex(indexPath, indexContent, post, translations);
  }

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

  const entryString = match[0];

  // 各言語のフィールドを追加（存在しない場合のみ）
  let updatedEntry = entryString;

  // 各言語のtitleとsummaryフィールドを追加
  for (const lang of Object.keys(SUPPORTED_LANGUAGES)) {
    const titleField = `title_${lang}`;
    const summaryField = `summary_${lang}`;

    // フィールドが存在しない場合のみ追加
    if (!entryString.includes(`"${titleField}"`)) {
      // titleの後に追加
      updatedEntry = updatedEntry.replace(
        `("title": ${JSON.stringify(post.title)}`,
        `("title": ${JSON.stringify(post.title)},\n    "${titleField}": ${JSON.stringify(translations[lang]?.title || '')}`
      );
    }

    if (!updatedEntry.includes(`"${summaryField}"`)) {
      // summaryの後に追加
      updatedEntry = updatedEntry.replace(
        `("summary": ${JSON.stringify(post.summary)}`,
        `("summary": ${JSON.stringify(post.summary)},\n    "${summaryField}": ${JSON.stringify(translations[lang]?.summary || '')}`
      );
    }
  }

  // ファイルを更新
  await fs.writeFile(indexPath, updatedEntry, 'utf-8');
}

// 実行
translateExistingPosts().catch(err => {
  console.error('\n========== ERROR ==========');
  console.error(`Message: ${err.message}`);
  console.error(`Stack: ${err.stack}`);
  console.error('========================');
  process.exit(1);
});
