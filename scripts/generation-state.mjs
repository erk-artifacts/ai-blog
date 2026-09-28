import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { writeAtomic } from './storage.mjs';
import { SUPPORTED_LANGUAGES, applyTitlePrefix, assertSlug, assertTranslation, translateArticle } from './shared.mjs';
import { renderDigest, validateSelection } from './editorial.mjs';

export function createGenerationState(digest) {
  const state = {
    version: 1, generationId: randomUUID(), publishedSlug: null,
    article: structuredClone(digest.article), provenance: structuredClone(digest.provenance),
    translations: { ja: { ...digest.article, title: applyTitlePrefix(digest.article.title, 'ja') } },
  };
  return validateState(state);
}

function validateState(state) {
  if (state?.version !== 1 || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(state.generationId)) throw new Error('Invalid generation checkpoint');
  if (state.publishedSlug !== null) assertSlug(state.publishedSlug);
  const provenance = state.provenance;
  if (!Array.isArray(provenance?.sources) || provenance.sources.length > 20) throw new Error('Invalid checkpoint sources');
  const ids = new Set();
  for (const source of provenance.sources) {
    if (!/^s[1-9]\d*$/.test(source.id) || ids.has(source.id)) throw new Error('Invalid source IDs');
    ids.add(source.id);
    const url = new URL(source.url);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid checkpoint source URL');
    for (const field of ['title', 'snippet', 'publisher']) if (typeof source[field] !== 'string') throw new Error('Invalid checkpoint source text');
    if (!['primary', 'secondary', 'unknown'].includes(source.sourceType)) throw new Error('Invalid checkpoint source type');
    if (!Number.isFinite(Date.parse(source.collectedAt)) || (source.publishedAt !== null && !Number.isFinite(Date.parse(source.publishedAt)))) throw new Error('Invalid source timestamp');
  }
  const plan = validateSelection(provenance.plan, provenance.sources);
  const article = renderDigest(plan, provenance.draft, provenance.sources, provenance.publicationDate);
  for (const field of ['title', 'summary', 'body']) if (article[field] !== state.article?.[field]) throw new Error('Checkpoint article differs from editorial content');
  if (!state.translations?.ja) throw new Error('Checkpoint requires Japanese content');
  for (const [lang, content] of Object.entries(state.translations)) {
    if (lang !== 'ja' && !Object.hasOwn(SUPPORTED_LANGUAGES, lang)) throw new Error('Invalid checkpoint language');
    assertTranslation(article, content);
    if (lang === 'ja' && (content.title !== applyTitlePrefix(article.title, 'ja') || content.summary !== article.summary || content.body !== article.body)) {
      throw new Error('Checkpoint Japanese content differs from article');
    }
  }
  return state;
}

export async function saveGenerationState(file, state) {
  validateState(state);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await writeAtomic(file, JSON.stringify(state, null, 2) + '\n');
}

export async function loadGenerationState(file) {
  return validateState(JSON.parse(await fs.readFile(file, 'utf8')));
}

export async function completeTranslations(state, persist = async () => {}) {
  validateState(state);
  let pendingSave = Promise.resolve();
  const results = await Promise.allSettled(Object.keys(SUPPORTED_LANGUAGES).filter(lang => !state.translations[lang]).map(async lang => {
    let translated;
    try {
      console.log(`  Translating missing language: ${lang}`);
      translated = await translateArticle(state.article, lang);
    } catch (error) {
      console.warn(`  Translation ${lang} remains pending: ${error.message}`);
      return;
    }
    state.translations[lang] = { ...translated, title: applyTitlePrefix(translated.title, lang) };
    // Serialize writes so that an earlier completion cannot overwrite newer state.
    pendingSave = pendingSave.then(() => persist(state));
    await pendingSave;
  }));
  const failedSave = results.find(result => result.status === 'rejected');
  if (failedSave) throw failedSave.reason;
  return state;
}
