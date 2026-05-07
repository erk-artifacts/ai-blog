import { GoogleGenAI } from '@google/genai';
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

// 固定タイトルプレフィックス
const TITLE_PREFIXES = {
  ja: '今日のAI最前線',
  en: 'AI Frontier Today',
  'zh-tw': '今日 AI 前沿',
  'zh-cn': '今日 AI 前沿',
  ko: '오늘의 AI 최전선',
};

// タイトルに固定プレフィックスを付与する
function applyTitlePrefix(title, lang) {
  const prefix = TITLE_PREFIXES[lang];
  if (!prefix) return title;
  if (title.startsWith(prefix)) return title;
  return `${prefix}：${title}`;
}

async function translateWithGemini(text, targetLang) {
  const langConfig = SUPPORTED_LANGUAGES[targetLang];

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const MAX_RETRIES = 3;
  const model = 'gemini-2.5-flash';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`    Translating to ${targetLang} (${text.length} chars, attempt ${attempt}/${MAX_RETRIES})...`);

      const response = await ai.models.generateContent({
        model,
        contents: text,
        config: {
          systemInstruction: `You are a professional translator. ${langConfig.prompt}.
- Keep technical terms accurate
- Preserve Markdown formatting exactly
- Do not add explanations or extra text
- Return only the translated text`,
          maxOutputTokens: 8192,
        },
      });

      const translatedText = response.text;
      console.log(`    Translation received (${translatedText.length} chars)`);
      return translatedText;
    } catch (err) {
      console.warn(`    Translation attempt ${attempt} failed: ${err.status || 'unknown'} ${err.message || ''}`);

      const isOverloaded = err.status === 503 || err.status === 500;
      const isTimeout = err.status === 504 || String(err.message || '').toLowerCase().includes('timeout');
      const isRateLimit = err.status === 429;

      if ((isOverloaded || isTimeout || isRateLimit) && attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.warn(`    Retrying translation in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      const isFatal = err.status === 400 || err.status === 401 || err.status === 403;
      if (isFatal || attempt === MAX_RETRIES) {
        throw err;
      }
    }
  }
}

async function translateArticle(article, targetLang) {
  try {
    return {
      title: await translateWithGemini(article.title, targetLang),
      summary: await translateWithGemini(article.summary, targetLang),
      body: await translateWithGemini(article.body, targetLang)
    };
  } catch (err) {
    console.warn(`  ✗ ${targetLang} translation failed: ${err.message}`);
    return null;
  }
}

async function translateExistingPosts() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
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
        `("title": ${JSON.stringify(post.title)},\n    "${titleField}": ${JSON.stringify(applyTitlePrefix(translations[lang]?.title || '', lang))}`
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
