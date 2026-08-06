FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json postcss.config.mjs ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM node:22-bookworm-slim AS production

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/dist ./dist

COPY <<'EOF' /app/server.mjs
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT) || 8080;
const publicDir = join(process.cwd(), 'dist');
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const runtimeEnvKeys = [
  'VITE_API_URL',
  'VITE_APP_NAME',
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_GEOCODING_API_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

createServer((request, response) => {
  const requestPath = new URL(request.url ?? '/', 'http://localhost').pathname;

  if (requestPath === '/env-config.js') {
    const runtimeEnv = Object.fromEntries(
      runtimeEnvKeys.map((key) => [key, process.env[key] ?? '']),
    );
    response.writeHead(200, {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Type': 'text/javascript; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(`window.__RUNTIME_ENV__ = ${JSON.stringify(runtimeEnv)};`);
    return;
  }

  const safePath = normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/, '');
  let filePath = join(publicDir, safePath);
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = join(publicDir, 'index.html');
  }

  const extension = extname(filePath).toLowerCase();
  response.writeHead(200, {
    'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=604800, immutable',
    'Content-Type': mimeTypes[extension] ?? 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(filePath).pipe(response);
}).listen(port, '0.0.0.0', () => {
  console.log(`Frontend is running on port ${port}`);
});
EOF

USER node
EXPOSE 8080

CMD ["node", "server.mjs"]
