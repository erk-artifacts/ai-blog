import fs from 'fs/promises';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { SUPPORTED_LANGUAGES, TITLE_PREFIXES, applyTitlePrefix, translateWithGemini } from './shared.mjs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

/**
 * posts/index.js から slug にマッチするエントリをブレースカウントで特定し、
 * 翻訳フィールドをマージしてファイル全体を書き戻す。
 */
async function updatePostInIndex(indexPath, originalContent, post, translations) {
  const slugMarker = `"slug": "${post.slug}"`;
  const slugIndex = originalContent.indexOf(slugMarker);

  if (slugIndex === -1) {
    console.warn(`  Could not find slug marker for ${post.slug} in index.js`);
    return;
  }

  // 後方検索で開始 { を見つける
  let depth = 0;
  let entryStart = slugIndex;
  while (entryStart >= 0) {
    if (originalContent[entryStart] === '}') depth++;
    if (originalContent[entryStart] === '{') {
      depth--;
      if (depth < 0) break;
    }
    entryStart--;
  }

  // 前方検索で終了 } を見つける
  depth = 0;
  let entryEnd = slugIndex + slugMarker.length;
  while (entryEnd < originalContent.length) {
    if (originalContent[entryEnd] === '{') depth++;
    if (originalContent[entryEnd] === '}') {
      depth--;
      if (depth < 0) break;
    }
    entryEnd++;
  }

  const originalEntry = originalContent.slice(entryStart, entryEnd + 1);

  // エントリをパースしてオブジェクトに変換
  let entryObj;
  try {
    entryObj = JSON.parse(originalEntry);
  } catch (err) {
    console.warn(`  Could not parse entry for ${post.slug}: ${err.message}`);
    return;
  }

  // 各言語のtitleとsummaryフィールドを追加（存在しないまたは空の場合のみ）
  // 接頭辞は元の日本語タイトルに付いている場合のみ翻訳にも付与する
  // （2026-08 リニューアル以降の新記事は接頭辞なし）
  const keepPrefix =
    typeof entryObj.title === 'string' && entryObj.title.startsWith(TITLE_PREFIXES.ja);
  for (const lang of Object.keys(SUPPORTED_LANGUAGES)) {
    const titleField = `title_${lang}`;
    const summaryField = `summary_${lang}`;

    if (translations[lang]?.title) {
      entryObj[titleField] = keepPrefix
        ? applyTitlePrefix(translations[lang].title, lang)
        : translations[lang].title;
    }
    if (translations[lang]?.summary) {
      entryObj[summaryField] = translations[lang].summary;
    }
  }

  // オブジェクトを文字列に変換（元のフォーマットに合わせてインデント）
  const updatedEntry = JSON.stringify(entryObj, null, 2);
  const indentedEntry = updatedEntry.split('\n').map(line => '  ' + line).join('\n');

  // ファイル全体の該当エントリを置換して書き戻す
  const updatedContent = originalContent.replace(originalEntry, indentedEntry);
  await fs.writeFile(indexPath, updatedContent, 'utf-8');
  console.log(`  Updated entry for ${post.slug} in index.js`);
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

  // vm で安全に posts 配列を抽出
  const script = new vm.Script(indexContent.replace('const posts', 'var posts'));
  const context = vm.createContext({});
  script.runInContext(context);
  const postsData = context.posts;

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

    // 最新のファイル内容を読み直す（ループ内で更新されるため）
    const currentContent = await fs.readFile(indexPath, 'utf-8');

    const jaBody = await fs.readFile(
      path.join(postsDir, 'ja', `${post.slug}.md`),
      'utf-8'
    );

    const article = {
      title: post.title,
      summary: post.summary,
      body: jaBody
    };

    const translations = {};

    // すべての言語を並列で翻訳
    const langPromises = Object.keys(SUPPORTED_LANGUAGES).map(async (lang) => {
      console.log(`  Translating to ${lang}...`);
      const result = await translateArticle(article, lang);
      if (result) {
        console.log(`  ✓ ${lang} translation complete`);
      }
      return { lang, result };
    });

    const results = await Promise.all(langPromises);

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

    // posts/index.js を更新（ループ毎に最新内容を読み直して更新）
    await updatePostInIndex(indexPath, currentContent, post, translations);
  }

  console.log('\n=== Translation complete ===');
}

// 実行
translateExistingPosts().catch(err => {
  console.error('\n========== ERROR ==========');
  console.error(`Message: ${err.message}`);
  console.error(`Stack: ${err.stack}`);
  console.error('========================');
  process.exit(1);
});
