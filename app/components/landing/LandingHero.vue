<template>
  <div
    id="prog"
    data-scroll-progress
    class="fixed left-0 top-0 z-[60] h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r from-[#7a7a85] to-white shadow-[0_0_12px_#ffffff55]"
  />

  <svg
    class="pointer-events-none fixed inset-0 z-[55] h-full w-full opacity-[.055] mix-blend-overlay"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <filter id="landing-grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
    </filter>
    <rect width="100%" height="100%" filter="url(#landing-grain)" />
  </svg>

  <header
    id="nav"
    data-landing-nav
    class="group fixed inset-x-0 top-0 z-50 border-b border-transparent bg-transparent transition duration-300 [&.is-scrolled]:border-white/[.07] [&.is-scrolled]:bg-[#0a0a0ce8] [&.is-scrolled]:backdrop-blur-xl"
  >
    <div class="mx-auto flex w-[min(1180px,92vw)] items-center justify-between py-5 transition-[padding] duration-300 group-[.is-scrolled]:py-3">
      <a
        href="#top"
        class="font-display text-[21px] tracking-[.24em] text-fabula-100 no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-fabula-100"
      >
        ФАБУЛА
      </a>
      <nav class="flex items-center gap-[30px]" aria-label="Главная навигация">
        <a class="hidden font-display text-sm tracking-[.06em] text-fabula-300 no-underline transition hover:text-fabula-100 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-fabula-100 lg:block" href="#packs">Миры</a>
        <a class="hidden font-display text-sm tracking-[.06em] text-fabula-300 no-underline transition hover:text-fabula-100 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-fabula-100 lg:block" href="#feats">Возможности</a>
        <a class="hidden font-display text-sm tracking-[.06em] text-fabula-300 no-underline transition hover:text-fabula-100 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-fabula-100 lg:block" href="#price">Тарифы</a>
        <LandingButton to="/app">
          Начать
        </LandingButton>
      </nav>
    </div>
  </header>

  <section id="top" class="relative flex min-h-svh items-center overflow-hidden">
    <div id="heroBg" data-hero-background class="absolute -inset-y-[6%] inset-x-0 z-0 will-change-transform">
      <div class="absolute inset-0 bg-[radial-gradient(120%_90%_at_60%_25%,#26262b,#121215_45%,#0a0a0c_78%)]" />
      <video
        data-src="/assets/hero_landing.mp4"
        poster="/assets/hero_landing.jpg"
        muted
        loop
        playsinline
        preload="none"
        class="absolute inset-0 z-[1] h-full w-full scale-[1.04] object-cover opacity-0 grayscale-[.88] contrast-[1.06] brightness-[.82] transition-opacity duration-1000 data-[ready=true]:opacity-100"
      />
    </div>
    <div class="absolute inset-0 z-[2] bg-[linear-gradient(90deg,#0a0a0cf5,#0a0a0cad_46%,#0a0a0c40)] shadow-[inset_0_-140px_130px_-70px_#0a0a0c,inset_0_100px_90px_-70px_#0a0a0c]" />
    <div data-dust class="pointer-events-none absolute inset-0 z-[3] overflow-hidden" aria-hidden="true">
      <i v-for="particle in 24" :key="particle" class="absolute size-0.5 rounded-full bg-white opacity-0" />
    </div>
    <div class="relative z-[5] mx-auto w-[min(1180px,92vw)] py-20 pt-[120px]">
      <span class="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[.03] px-[15px] py-[7px] font-display text-[11px] uppercase tracking-[.3em] text-fabula-300 before:size-[5px] before:rounded-full before:bg-fabula-100 before:content-['']">
        Текстовые приключения с ИИ
      </span>
      <h1 class="mb-[22px] max-w-[14ch] font-display text-[clamp(40px,7vw,80px)] leading-none text-fabula-100">
        <span class="block overflow-hidden"><span data-landing-title-line class="block">Создай</span></span>
        <span class="block overflow-hidden"><span data-landing-title-line class="block">свою историю</span></span>
      </h1>
      <p data-landing-lede class="mb-8 max-w-[46ch] text-[clamp(17px,2vw,21px)] leading-normal text-fabula-300">
        Создай свой уникальный и неповторимый мир с собственной историей или путешествуй
        по чужим мирам, а наш ИИ поможет в этом приключении. Тебя ждет интересная история и неожиданные
        сюжетные повороты в сопровождении ярких иллюстраций. Будущее твоего мира зависит только от тебя
      </p>
      <div data-landing-cta class="flex flex-wrap items-center gap-3.5">
        <LandingButton to="/app" class="px-9 py-[18px] text-sm">
          Начать историю
        </LandingButton>
        <LandingButton href="#packs" variant="ghost" class="px-8 py-[18px] text-sm">
          Смотреть миры
        </LandingButton>
      </div>
    </div>
  </section>
</template>
