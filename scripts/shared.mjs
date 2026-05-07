import { GoogleGenAI } from '@google/genai';

// ---------------------------------------------------------------------------
// Supported Languages
// ---------------------------------------------------------------------------

export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', prompt: 'translate to natural English' },
  'zh-tw': { name: '繁體中文（Traditional Chinese）', prompt: 'translate to Traditional Chinese (繁體中文)' },
  'zh-cn': { name: '简体中文（Simplified Chinese）', prompt: 'translate to Simplified Chinese (简体中文)' },
  ko: { name: '한국어（Korean）', prompt: 'translate to Korean (한국어)' }
};

// ---------------------------------------------------------------------------
// Title Prefixes
// ---------------------------------------------------------------------------

export const TITLE_PREFIXES = {
  ja: '今日のAI最前線',
  en: 'AI Frontier Today',
  'zh-tw': '今日 AI 前沿',
  'zh-cn': '今日 AI 前沿',
  ko: '오늘의 AI 최전선',
};

export function applyTitlePrefix(title, lang) {
  const prefix = TITLE_PREFIXES[lang];
  if (!prefix) return title;
  if (title.startsWith(prefix)) return title;
  return `${prefix}：${title}`;
}

// ---------------------------------------------------------------------------
// Translation
// ---------------------------------------------------------------------------

export async function translateWithGemini(text, targetLang, options = {}) {
  const { model = process.env.GEMINI_MODEL || 'gemini-2.5-flash' } = options;
  const langConfig = SUPPORTED_LANGUAGES[targetLang];

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const MAX_RETRIES = 3;

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
