import test from 'node:test';
import assert from 'node:assert/strict';
import { requestOpenAI } from '../scripts/openai.mjs';

function key(t) {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  t.after(() => { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous; });
}
const complete = text => new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text }] }] }));

test('authentication errors fail immediately', async t => {
  key(t);
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response('secret-provider-message', { status: 401 }); });
  await assert.rejects(requestOpenAI({}), { message: 'OpenAI HTTP 401' });
  assert.equal(calls, 1);
});

for (const code of ['insufficient_quota', 'credit_balance_exhausted', 'billing_hard_limit_reached']) test(`exhausted quota (${code}) is not retried`, async t => {
  key(t);
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return new Response(JSON.stringify({ error: { code, message: 'provider detail' } }), { status: 429 });
  });
  await assert.rejects(requestOpenAI({}, { sleep: async () => {} }), new RegExp(code));
  assert.equal(calls, 1);
});

test('rate limiting honors Retry-After then returns complete content', async t => {
  key(t);
  let calls = 0;
  const waits = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    return ++calls === 1 ? new Response('{}', { status: 429, headers: { 'retry-after': '5' } }) : complete('OK');
  });
  assert.equal(await requestOpenAI({}, { sleep: async ms => waits.push(ms) }), 'OK');
  assert.deepEqual(waits, [5000]);
});

test('empty responses stop after the shared three-attempt budget', async t => {
  key(t);
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return complete(''); });
  await assert.rejects(requestOpenAI({}, { sleep: async () => {} }), /empty text/);
  assert.equal(calls, 3);
});

test('malformed generated JSON is retried inside the same budget', async t => {
  key(t);
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => complete(++calls === 1 ? '{"title":' : '{"title":"OK"}'));
  assert.deepEqual(await requestOpenAI({}, { parse: JSON.parse, sleep: async () => {} }), { title: 'OK' });
});

test('refusal content is never published or retried', async t => {
  key(t);
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'Cannot comply' }] }] }));
  });
  await assert.rejects(requestOpenAI({}), /refused/);
  assert.equal(calls, 1);
});
