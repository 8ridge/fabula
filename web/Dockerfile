# Многостадийная сборка Nuxt (SSR, Nitro node-server).
# Гарантированно включает public/ (видео, картинки, шрифты) в .output/public.
FROM node:20-slim AS build
WORKDIR /app
# Копируем весь исходник ДО npm install: postinstall (nuxt prepare) требует nuxt.config и исходники.
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
