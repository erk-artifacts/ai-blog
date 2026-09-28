import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import createDOMPurify from 'dompurify';
import { parsePostsIndex } from '../scripts/shared.mjs';

test('article rendering strips active content but keeps headings, links and images', async t => {
  const html = await fs.readFile('index.html', 'utf8');
  const dom = new JSDOM(html, { url: 'https://blog.example/', runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const { window } = dom;
  window.marked = marked;
  window.DOMPurify = createDOMPurify(window);
  window.scrollTo = () => {};
  window.fetch = async () => ({ ok: true, text: async () => '## Safe heading\n\n[Safe](https://example.com)\n\n![Photo](images/photo.png)\n\n<img src=x onerror="alert(1)"><a href="javascript:alert(1)">bad</a><iframe src="https://evil.example"></iframe><svg onload="alert(1)"></svg>' });
  const scripts = [];
  for (const script of window.document.querySelectorAll('script')) {
    if (script.src.endsWith('/posts/index.js')) scripts.push('const posts = ' + JSON.stringify(parsePostsIndex(await fs.readFile('posts/index.js', 'utf8'))) + ';\nwindow.testPosts = posts;');
    else if (!script.src) scripts.push(script.textContent);
  }
  window.eval(scripts.join('\n'));
  window.showDetail(window.testPosts[0].id, false);
  await new Promise(resolve => setImmediate(resolve));
  const content = window.document.querySelector('#detail-content');
  assert.equal(content.querySelector('[onerror], [onload], iframe, svg, a[href^="javascript:"]'), null);
  assert.equal(content.querySelector('h2').textContent, 'Safe heading');
  assert.ok(content.querySelector('img[src="images/photo.png"]'));
  assert.equal(content.querySelector('a[href="https://example.com"]').rel, 'noopener noreferrer');
});

test('admin code treats quotes and template expressions as data', async t => {
  const dom = new JSDOM(await fs.readFile('admin.html', 'utf8'), { runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const { window } = dom;
  window.eval([...window.document.querySelectorAll('script')].at(-1).textContent);
  const title = 'Title "quote"';
  const body = '${globalThis.pwned = true} `code`';
  window.document.querySelector('#title').value = title;
  window.document.querySelector('#body').value = body;
  window.generateCode();
  const data = JSON.parse(window.document.querySelector('#output').innerText.replace(/,\s*$/, ''));
  assert.equal(data.title, title);
  assert.equal(data.body, body);
});
