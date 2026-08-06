FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json postcss.config.mjs ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine AS production

RUN apk add --no-cache jq

COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location = /env-config.js {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        expires -1;
        try_files $uri =404;
    }

    location ~* \.(?:css|js|mjs|svg|png|jpg|jpeg|gif|webp|ico|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

COPY <<'EOF' /docker-entrypoint.d/15-runtime-env.sh
#!/bin/sh
set -eu

jq -n \
  --arg VITE_API_URL "${VITE_API_URL:-http://localhost:3000}" \
  --arg VITE_APP_NAME "${VITE_APP_NAME:-Sweet Bean Coffee & Cake}" \
  --arg VITE_GOOGLE_CLIENT_ID "${VITE_GOOGLE_CLIENT_ID:-}" \
  --arg VITE_GEOCODING_API_URL "${VITE_GEOCODING_API_URL:-https://photon.komoot.io}" \
  --arg VITE_SUPABASE_URL "${VITE_SUPABASE_URL:-}" \
  --arg VITE_SUPABASE_ANON_KEY "${VITE_SUPABASE_ANON_KEY:-}" \
  '$ARGS.named' \
  | sed '1s/^/window.__RUNTIME_ENV__ = /; $s/$/;/' \
  > /usr/share/nginx/html/env-config.js
EOF

RUN chmod +x /docker-entrypoint.d/15-runtime-env.sh
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
