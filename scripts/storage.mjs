import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { parsePostsIndex, serializePostsIndex, SUPPORTED_LANGUAGES, applyTitlePrefix, assertArticle } from './shared.mjs';

export async function writeAtomic(file, content) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
    await fs.rename(temporary, file);
  } finally {
    await fs.unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
}

export async function updatePostInIndex(indexPath, originalContent, post, translations) {
  const posts = parsePostsIndex(originalContent);
  const entry = posts.find(item => item.slug === post.slug);
  if (!entry) throw new Error('Post not found in index');
  for (const [lang, content] of Object.entries(translations)) {
    if (!Object.hasOwn(SUPPORTED_LANGUAGES, lang)) throw new Error('Unsupported language');
    assertArticle(content);
    entry[`title_${lang}`] = applyTitlePrefix(content.title, lang);
    entry[`summary_${lang}`] = content.summary;
  }
  await writeAtomic(indexPath, serializePostsIndex(posts));
}
