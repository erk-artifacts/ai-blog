import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
await mkdir(new URL('vendor/', root), { recursive: true });
for (const [source, destination] of [
  ['marked/lib/marked.umd.js', 'marked.umd.js'],
  ['marked/LICENSE', 'marked-LICENSE'],
  ['dompurify/dist/purify.min.js', 'purify.min.js'],
  ['dompurify/LICENSE', 'dompurify-LICENSE'],
]) {
  await copyFile(fileURLToPath(new URL('node_modules/' + source, root)), fileURLToPath(new URL('vendor/' + destination, root)));
}
