FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod 2>/dev/null || pnpm install --prod

COPY dist/ ./dist/
COPY bin/ ./bin/

RUN chmod +x bin/qapilot.js

ENV NODE_ENV=production

ENTRYPOINT ["node", "bin/qapilot.js"]
CMD ["scan"]
