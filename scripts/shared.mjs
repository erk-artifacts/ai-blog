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

export async function translateWithOpenAI(text, targetLang, options = {}) {
  const { model = process.env.OPENAI_MODEL || 'gpt-6-luna' } = options;
  const langConfig = SUPPORTED_LANGUAGES[targetLang];

  if (!langConfig) throw new Error(`Unsupported target language: ${targetLang}`);
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY environment variable is not set');
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`    Translating to ${targetLang} (${text.length} chars, attempt ${attempt}/${MAX_RETRIES})...`);

      const apiResponse = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          instructions: `You are a professional translator. ${langConfig.prompt}.
- Keep technical terms accurate
- Preserve Markdown formatting exactly
- Do not add explanations or extra text
- Return only the translated text`,
          input: text,
          max_output_tokens: 8192,
        }),
        signal: AbortSignal.timeout(120000),
      });

      if (!apiResponse.ok) {
        const error = new Error(`OpenAI API returned ${apiResponse.status}: ${await apiResponse.text()}`);
        error.status = apiResponse.status;
        throw error;
      }
      const response = await apiResponse.json();
      const translatedText = (response.output || [])
        .filter(item => item.type === 'message')
        .flatMap(item => item.content || [])
        .filter(item => item.type === 'output_text')
        .map(item => item.text)
        .join('')
        .trim();
      if (!translatedText) throw new Error(`OpenAI API returned no translation (status: ${response.status || 'unknown'})`);
      console.log(`    Translation received (${translatedText.length} chars)`);
      return translatedText;
    } catch (err) {
      console.warn(`    Translation attempt ${attempt} failed: ${err.status || 'unknown'} ${err.message || ''}`);

      const retryable = [408, 429, 500, 502, 503, 504].includes(err.status)
        || err.name === 'TimeoutError'
        || err.name === 'TypeError';
      if (retryable && attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.warn(`    Retrying translation in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      throw err;
    }
  }
}
