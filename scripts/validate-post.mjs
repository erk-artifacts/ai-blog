import fs from 'fs/promises';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHECK_ALL = process.argv.includes('--all');

// 固定タイトルプレフィックス（generate-post.mjs と同じ定義）
const TITLE_PREFIXES = {
  ja: '今日のAI最前線',
  en: 'AI Frontier Today',
  'zh-tw': '今日 AI 前沿',
  'zh-cn': '今日 AI 前沿',
  ko: '오늘의 AI 최전선',
};

// 言語コード → index.js フィールド名
const TITLE_FIELDS = {
  ja: 'title',
  en: 'title_en',
  'zh-tw': 'title_zh-tw',
  'zh-cn': 'title_zh-cn',
  ko: 'title_ko',
};

const SUMMARY_FIELDS = {
  ja: 'summary',
  en: 'summary_en',
  'zh-tw': 'summary_zh-tw',
  'zh-cn': 'summary_zh-cn',
  ko: 'summary_ko',
};

/**
 * 単一記事エントリをバリデーションする。
 * @param {object} entry - posts/index.js のエントリオブジェクト
 * @returns {string[]} エラーがなければ空配列
 */
export function validateEntry(entry) {
  const errors = [];

  // --- 1. 必須フィールドの空チェック ---
  const required = ['title', 'summary', 'slug', 'date', 'category'];
  for (const field of required) {
    if (!entry[field] || entry[field].trim() === '') {
      errors.push(`Empty required field: ${field}`);
    }
  }

  // --- 2. タイトルプレフィックス（AI NEWS のみ） ---
  if (entry.category === 'AI NEWS') {
    for (const [lang, field] of Object.entries(TITLE_FIELDS)) {
      const value = entry[field];
      if (!value) continue;
      const prefix = TITLE_PREFIXES[lang];
      if (prefix && !value.startsWith(prefix)) {
        errors.push(
          `Title (${lang}/${field}) missing prefix "${prefix}": "${value.slice(0, 60)}"`
        );
      }
    }
  }

  // --- 3. サマリーのマークダウンヘッダー混入 ---
  for (const [lang, field] of Object.entries(SUMMARY_FIELDS)) {
    const value = entry[field];
    if (!value) continue;
    if (/^#{1,6}\s/m.test(value)) {
      errors.push(
        `Summary (${lang}/${field}) contains markdown header: "${value.slice(0, 60)}"`
      );
    }
  }

  // --- 4. 余計な記号・不正な改行 ---
  // タイトル・サマリーに水平線（---）が混入
  for (const type of ['title', 'summary']) {
    for (const [lang, field] of Object.entries(
      type === 'title' ? TITLE_FIELDS : SUMMARY_FIELDS
    )) {
      const value = entry[field];
      if (!value) continue;
      if (/---/.test(value)) {
        errors.push(
          `${type.charAt(0).toUpperCase() + type.slice(1)} (${lang}/${field}) contains ---: "${value.slice(0, 80)}"`
        );
      }
    }
  }

  // タイトルに改行が混入
  for (const [lang, field] of Object.entries(TITLE_FIELDS)) {
    const value = entry[field];
    if (!value) continue;
    if (/\n/.test(value)) {
      errors.push(
        `Title (${lang}/${field}) contains newline(s): "${value.slice(0, 80)}"`
      );
    }
  }

  // サマリーに改行が混入
  for (const [lang, field] of Object.entries(SUMMARY_FIELDS)) {
    const value = entry[field];
    if (!value) continue;
    if (/\n/.test(value)) {
      errors.push(
        `Summary (${lang}/${field}) contains newline(s): "${value.slice(0, 80)}"`
      );
    }
  }

  // タイトルに【】が混入
  for (const [lang, field] of Object.entries(TITLE_FIELDS)) {
    const value = entry[field];
    if (!value) continue;
    if (/【.*?】/.test(value)) {
      errors.push(
        `Title (${lang}/${field}) contains 【】: "${value.slice(0, 80)}"`
      );
    }
  }

  return errors;
}

/**
 * posts/index.js から posts 配列を読み込む
 */
async function loadPosts() {
  const indexPath = path.resolve(__dirname, '..', 'posts', 'index.js');
  const content = await fs.readFile(indexPath, 'utf-8');
  // vm では const 宣言が context に公開されないため var に変換
  const script = new vm.Script(content.replace('const posts', 'var posts'));
  const context = vm.createContext({});
  script.runInContext(context);
  return context.posts;
}

// --- CLI エントリポイント ---
async function main() {
  const posts = await loadPosts();
  const entries = CHECK_ALL ? posts : [posts[0]];

  console.log(
    CHECK_ALL
      ? `Validating all ${entries.length} entries...`
      : `Validating latest entry (slug: ${entries[0]?.slug})...`
  );
  console.log();

  let hasErrors = false;
  let totalErrors = 0;

  for (const entry of entries) {
    const errors = validateEntry(entry);
    if (errors.length > 0) {
      hasErrors = true;
      totalErrors += errors.length;
      console.log(`[${entry.slug}] ${errors.length} issue(s) found:`);
      for (const err of errors) {
        console.log(`  ✗ ${err}`);
      }
      console.log();
    } else {
      console.log(`[${entry.slug}] OK`);
    }
  }

  if (hasErrors) {
    console.log(`\nValidation failed: ${totalErrors} issue(s) found.`);
    process.exit(1);
  } else {
    console.log(`\nValidation passed.`);
  }
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
