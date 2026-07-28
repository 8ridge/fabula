# Многостадийная сборка Nuxt (SSR, Nitro node-server).
# Гарантированно включает public/ (видео, картинки, шрифты) в .output/public.
FROM node:20-slim AS build
WORKDIR /app
# npm 10.8.2 из node:20 падает 'edgesOut' на платформенных optional-деп (oxc-parser).
# Обновляем npm до версии без этого бага.
RUN npm install -g npm@11
COPY . .
RUN npm install
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production \
    NITRO_PORT=3000 \
    NITRO_HOST=0.0.0.0
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
