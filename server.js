// 開発用の静的ファイルサーバー（依存パッケージなし）。src/ 以下だけを配信する。
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('./src/', import.meta.url));
const HOST = process.env.HOST ?? '127.0.0.1';
const PORT = Number(process.env.PORT ?? 3000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  let filePath;
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    filePath = resolve(ROOT, `.${decodeURIComponent(relative)}`);
  } catch {
    return send(res, 400, 'Bad Request');
  }
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');

  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch {
    send(res, 404, 'Not Found');
  }
});

function send(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`ポート ${PORT} は使用中です。PORT=3001 npm start のように別のポートを指定してください。`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`TODO アプリを起動しました: http://${HOST}:${PORT}`);
});
