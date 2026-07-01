import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const host = '127.0.0.1';
const port = Number.parseInt(process.env.PORT ?? '5055', 10);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8'
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, `http://${host}`).pathname);
    const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const safePath = normalize(requestedPath);

    if (safePath.startsWith('..')) {
      response.writeHead(403).end('Acesso negado');
      return;
    }

    const filePath = join(root, safePath);
    const contents = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(contents);
  } catch (error) {
    const status = error.code === 'ENOENT' ? 404 : 500;
    response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(status === 404 ? 'Arquivo não encontrado' : 'Erro interno');
  }
}).listen(port, host, () => {
  console.log(`Portfólio disponível em http://${host}:${port}`);
});
