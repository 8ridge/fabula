<template>
  <section class="relative z-[5] overflow-clip py-[clamp(70px,9vw,124px)]">
    <div class="mx-auto w-[min(1180px,92vw)]">
      <div
        id="final"
        data-final-cta
        data-reveal
        class="relative overflow-hidden rounded-[18px] border border-white/[.07] bg-fabula-surface px-[26px] py-[clamp(48px,6vw,78px)] text-center before:pointer-events-none before:absolute before:inset-0 before:z-[1] before:bg-[radial-gradient(460px_circle_at_var(--mx,50%)_var(--my,50%),rgba(255,255,255,.10),transparent_62%)] before:opacity-0 before:transition-opacity before:duration-500 before:content-[''] hover:before:opacity-100"
      >
        <video
          data-src="/assets/cta_loop.mp4"
          muted
          loop
          playsinline
          preload="none"
          class="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 grayscale-[.9] brightness-50 transition-opacity duration-1000 data-[ready=true]:opacity-100"
        />
        <div class="absolute inset-0 bg-black/30" />
        <h2 class="relative z-[2] mb-4 font-display text-[clamp(29px,4vw,46px)] leading-[1.1] text-fabula-100">
          Ваша история начинается здесь
        </h2>
        <LandingButton to="/app" class="relative z-[2] px-[42px] py-[18px] text-sm">
          Начать историю
        </LandingButton>
      </div>
    </div>
  </section>

  <footer class="mt-16 border-t border-white/[.07] py-[38px]">
    <div class="mx-auto flex w-[min(1180px,92vw)] flex-wrap items-center justify-between gap-5 text-sm text-fabula-500">
      <div>© 2026 ФАБУЛА · интерактивные истории с ИИ</div>
      <nav class="flex gap-[22px]" aria-label="Навигация в подвале">
        <a class="text-fabula-300 no-underline transition hover:text-fabula-100" href="#packs">Миры</a>
        <a class="text-fabula-300 no-underline transition hover:text-fabula-100" href="#price">Тарифы</a>
        <NuxtLink class="text-fabula-300 no-underline transition hover:text-fabula-100" to="/app">Начать</NuxtLink>
      </nav>
    </div>
  </footer>

  <div
    id="dock"
    data-landing-dock
    class="pointer-events-none fixed bottom-5 right-[22px] z-[58] flex translate-y-[150%] items-center gap-3.5 rounded-full border border-white/12 bg-[#101014ee] py-2 pl-5 pr-2 opacity-0 shadow-[0_22px_55px_-22px_#000] backdrop-blur-xl transition duration-500 [&.is-visible]:pointer-events-auto [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100"
  >
    <i class="whitespace-nowrap font-display text-[13.5px] not-italic text-fabula-300 max-sm:hidden">Первые главы бесплатно</i>
    <LandingButton to="/app" class="px-[26px] py-[13px] text-xs">Начать</LandingButton>
  </div>
</template>
