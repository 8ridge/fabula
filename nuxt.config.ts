import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@vite-pwa/nuxt', '@vueuse/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    openrouterApiKey: '',
    openrouterBaseUrl: 'https://openrouter.ai/api/v1',
    openrouterSiteUrl: '',
    honchoApiKey: '',
    honchoBaseUrl: 'https://api.honcho.dev',
  },
  nitro: {
    storage: {
      'fabula-sessions': {
        driver: 'fs',
        base: './.data/fabula-sessions',
      },
    },
    devStorage: {
      'fabula-sessions': {
        driver: 'fs',
        base: './.data/fabula-sessions',
      },
    },
    serverAssets: [
      {
        baseName: 'fabula-prompts',
        dir: new URL('./deliverables/PWA_AI_PRESENTATION_KIT/prompts', import.meta.url).pathname,
        pattern: '*.md',
      },
      {
        baseName: 'fabula-storypacks',
        dir: new URL('./deliverables/PWA_AI_PRESENTATION_KIT/storypacks', import.meta.url).pathname,
        pattern: '*.md',
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  pwa: {
    registerType: 'prompt',
    manifest: {
      name: 'Fabula',
      short_name: 'Fabula',
      description: 'Интерактивная история, в которой решения меняют канон.',
      start_url: '/',
      display: 'standalone',
      background_color: '#0b1020',
      theme_color: '#0b1020',
      icons: [
        {
          src: '/icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/'),
          handler: 'NetworkOnly',
        },
      ],
    },
    devOptions: {
      enabled: false,
    },
  },
})
