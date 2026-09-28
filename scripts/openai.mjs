const ENDPOINT = 'https://api.openai.com/v1/responses';
const RETRY_STATUSES = [408, 429, 500, 502, 503, 504];

export const ARTICLE_FORMAT = {
  type: 'json_schema', name: 'article', strict: true,
  schema: {
    type: 'object', additionalProperties: false,
    properties: { title: { type: 'string' }, summary: { type: 'string' }, body: { type: 'string' } },
    required: ['title', 'summary', 'body'],
  },
};

function outputError(message) {
  return Object.assign(new Error(message), { retryable: true });
}

// One retry budget covers HTTP errors, incomplete output and content validation.
// Each fetch is cancelled on timeout; no detached Promise.race requests remain.
export async function requestOpenAI(payload, { parse = text => text, sleep = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY environment variable is not set');
  let budget = payload.max_output_tokens || 8000;
  for (let attempt = 1; attempt <= 3; attempt++) {
    let retryAfter = 0;
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-6-luna', ...payload, max_output_tokens: budget, store: false }),
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) {
        const header = res.headers.get('retry-after');
        retryAfter = header ? (/^\d+(\.\d+)?$/.test(header) ? Number(header) * 1000 : Date.parse(header) - Date.now()) : 0;
        // Only expose known diagnostic codes, never raw provider messages.
        const body = await res.json().catch(() => ({}));
        const quota = ['insufficient_quota', 'credit_balance_exhausted', 'billing_hard_limit_reached'].includes(body.error?.code);
        const detail = quota ? ` (${body.error.code}: check API billing/credits)` : '';
        throw Object.assign(new Error(`OpenAI HTTP ${res.status}${detail}`), {
          status: res.status, retryable: !quota && RETRY_STATUSES.includes(res.status),
        });
      }
      let response;
      try { response = await res.json(); } catch { throw outputError('Invalid OpenAI response JSON'); }
      if (response.status === 'incomplete') {
        const reason = response.incomplete_details?.reason;
        if (reason !== 'max_output_tokens') throw new Error('OpenAI response incomplete (not a token limit)');
        budget = Math.min(budget * 2, 16000);
        throw outputError('OpenAI output reached token limit');
      }
      if (response.status !== 'completed') {
        throw Object.assign(new Error('OpenAI response did not complete'), {
          retryable: ['server_error', 'rate_limit_exceeded'].includes(response.error?.code),
        });
      }
      const content = (response.output || []).filter(item => item.type === 'message').flatMap(item => item.content || []);
      if (content.some(item => item.type === 'refusal')) throw new Error('OpenAI refused the requested content');
      const text = content.filter(item => item.type === 'output_text').map(item => item.text).join('').trim();
      if (!text) throw outputError('OpenAI returned empty text');
      try { return parse(text); } catch (error) { throw outputError(`Invalid generated content: ${error.message}`); }
    } catch (error) {
      const retryable = error.retryable || error.name === 'TimeoutError' || error.name === 'TypeError';
      if (!retryable || attempt === 3) throw error;
      const delay = Math.min(30000, Math.max(1000 * 2 ** (attempt - 1), Number.isFinite(retryAfter) ? retryAfter : 0));
      console.warn(`OpenAI attempt ${attempt}/3 failed: ${error.message}. Retrying in ${delay}ms.`);
      await sleep(delay);
    }
  }
}
