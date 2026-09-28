import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import * as generation from '../scripts/generate-post.mjs';

async function withServer(handler, run) {
  const server = http.createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

test('RSS HTTP errors cancel the response stream instead of leaving a connection open', { timeout: 3000 }, async () => {
  assert.equal(typeof generation.fetchFeed, 'function');
  let closed;
  await withServer((req, res) => {
    closed = once(res, 'close');
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.write('denied'); // A server that never completes its error body.
  }, async url => {
    await assert.rejects(generation.fetchFeed(url, { timeoutMs: 1000 }), /403/);
    await closed;
  });
});

test('RSS timeout aborts the request even when the server never sends headers', { timeout: 3000 }, async () => {
  assert.equal(typeof generation.fetchFeed, 'function');
  let closed;
  await withServer((req, res) => { closed = once(res, 'close'); }, async url => {
    await assert.rejects(generation.fetchFeed(url, { timeoutMs: 100 }), { name: 'TimeoutError' });
    assert.ok(closed, 'request reached the server');
    await closed;
  });
});

test('RSS fetch still parses a successful feed', async () => {
  assert.equal(typeof generation.fetchFeed, 'function');
  await withServer((req, res) => {
    res.end('<?xml version="1.0"?><rss version="2.0"><channel><title>News</title><item><title>AI item</title><link>https://example.com/news</link></item></channel></rss>');
  }, async url => {
    const feed = await generation.fetchFeed(url);
    assert.equal(feed.items[0].title, 'AI item');
  });
});
