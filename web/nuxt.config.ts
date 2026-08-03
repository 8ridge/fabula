// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-24',
  devtools: { enabled: true },
  devServer: { host: '127.0.0.1', port: 3000 },
  // CSS подключаем по-страничному (main.css — в index.vue, app.css — в app.vue),
  // чтобы стили лендинга и приложения не пересекались.
  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      title: 'ФАБУЛА — интерактивные истории с ИИ',
      meta: [
        { charset: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    },
  },
})
