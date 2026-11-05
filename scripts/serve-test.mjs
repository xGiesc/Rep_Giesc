// Server statico per i test: dist-local su :4173, dist-cloud su :4174 (sotto /Rep_Giesc/).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.png': 'image/png', '.gif': 'image/gif', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.map': 'application/json',
};

function serve(dir, port) {
  createServer(async (req, res) => {
    let path = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/Rep_Giesc/, '') || '/';
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(dir, path));
    if (!file.startsWith(dir)) return res.writeHead(403).end();
    try {
      if (!(await stat(file)).isFile()) throw new Error();
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end('not found');
    }
  }).listen(port, '127.0.0.1');
}

serve(join(process.cwd(), 'dist-local'), 4173);
serve(join(process.cwd(), 'dist-cloud'), 4174);
console.log('server test pronti su 4173 (locale) e 4174 (cloud)');
