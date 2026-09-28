import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { SUPPORTED_LANGUAGES, translateArticle as translateStructuredArticle, parsePostsIndex } from './shared.mjs';
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

async function translateExistingPosts() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const postsDir = path.join(__dirname, '..', 'posts');
  const indexPath = path.join(postsDir, 'index.js');

  // posts/index.js を読み込み
  console.log('Reading posts/index.js...');
  const indexContent = await fs.readFile(indexPath, 'utf-8');

  const postsData = parsePostsIndex(indexContent);

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

    if (!Object.keys(translations).length) throw new Error('All translations failed');

    // 各言語のファイルを保存
    for (const [lang, content] of Object.entries(translations)) {
      const langDir = path.join(postsDir, lang);
      await fs.mkdir(langDir, { recursive: true });
      const mdPath = path.join(langDir, `${post.slug}.md`);
      await writeAtomic(mdPath, content.body);
      console.log(`  Created: ${mdPath}`);
    }

    // posts/index.js を更新（ループ毎に最新内容を読み直して更新）
    await updatePostInIndex(indexPath, currentContent, post, translations);
  }

  console.log('\n=== Translation complete ===');
}

// CLI only: importing this module has no side effects.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  dotenv.config({ quiet: true });
  translateExistingPosts().catch(err => {
    console.error('\n========== ERROR ==========');
    console.error(`Message: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
    console.error('========================');
    process.exit(1);
  });

}
