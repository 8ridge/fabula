<script setup lang="ts">
import { STORY_PACK_LIST } from '#shared/storypacks'

const worlds = STORY_PACK_LIST.map(pack => ({
  ...pack,
  description: pack.logline,
  image: pack.cover,
  accent: pack.theme.accent,
  facts: [pack.rating, pack.version, ...pack.systemFocus.slice(0, 2)],
}))
</script>

<template>
  <section id="packs" class="relative z-[5] overflow-clip py-[clamp(70px,9vw,124px)]">
    <div class="mx-auto w-[min(1180px,92vw)]">
      <LandingSectionHeading
        title="Выберите вселенную"
        subtitle="Каждая история предлагает уникальное визуальное оформление, динамическую сложность и свой характер повествования."
      />
      <div class="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4 [perspective:1100px]">
        <NuxtLink
          v-for="world in worlds"
          :key="world.id"
          :to="`/story/${world.id}`"
          data-reveal
          data-tilt-card
          :style="{ '--accent': world.accent }"
          class="group relative block overflow-hidden rounded-[14px] border border-white/[.07] bg-fabula-surface no-underline transition-[transform,box-shadow,border-color] duration-700 [transform-style:preserve-3d] before:pointer-events-none before:absolute before:inset-0 before:z-[4] before:rounded-[inherit] before:bg-[radial-gradient(340px_circle_at_var(--mx,50%)_var(--my,50%),color-mix(in_srgb,var(--accent)_15%,transparent),transparent_60%)] before:opacity-0 before:transition-opacity before:duration-500 before:content-[''] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_30px_66px_-28px_var(--accent)] hover:before:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-fabula-100 lg:h-[clamp(350px,40vh,430px)]"
        >
          <div class="relative h-[220px] overflow-hidden lg:absolute lg:inset-0 lg:h-auto">
            <img
              :src="world.image"
              alt=""
              class="h-full w-full scale-[1.08] object-cover grayscale-[.5] brightness-[.74] contrast-[1.05] transition duration-1000 group-hover:scale-[1.13] group-hover:grayscale-0 group-hover:brightness-[.82]"
            >
            <video
              :data-src="`${world.video}?v3`"
              muted
              loop
              playsinline
              preload="none"
              class="absolute inset-0 h-full w-full object-cover opacity-0 brightness-[.82] contrast-[1.04] transition-opacity duration-700 data-[ready=true]:opacity-100"
            />
            <div class="absolute inset-0 bg-[linear-gradient(0deg,#0a0a0cfa_14%,#0a0a0ca8_44%,#0a0a0c1f_74%)]" />
          </div>
          <span class="absolute left-[13px] top-[13px] z-[3] rounded-full border border-[var(--accent)] bg-[#0a0a0ccc] px-[11px] py-[5px] font-display text-[10px] uppercase tracking-[.14em] text-[var(--accent)]">
            {{ world.eyebrow }}
          </span>
          <div class="relative z-[2] flex flex-col gap-2.5 p-[18px] lg:absolute lg:inset-x-0 lg:bottom-0 lg:p-5">
            <h3 class="font-display text-[21px] leading-[1.14] text-fabula-100">
              {{ world.title }}
            </h3>
            <div class="flex max-h-[260px] translate-y-0 flex-col gap-2.5 overflow-hidden opacity-100 transition-[max-height,opacity,transform] duration-700 lg:max-h-0 lg:translate-y-2.5 lg:opacity-0 lg:group-hover:max-h-[260px] lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-visible:max-h-[260px] lg:group-focus-visible:translate-y-0 lg:group-focus-visible:opacity-100">
              <p class="text-sm leading-[1.45] text-fabula-300">
                {{ world.description }}
              </p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="fact in world.facts"
                  :key="fact"
                  class="rounded-full border border-white/[.07] px-[9px] py-1 font-display text-[10px] uppercase tracking-[.08em] text-fabula-500"
                >
                  {{ fact }}
                </span>
              </div>
              <div class="flex items-center justify-between pt-0.5 font-display text-[var(--accent)]">
                <span class="text-[13px]">{{ world.season }}</span>
                <span class="text-xs tracking-[.1em]">Выбрать роль →</span>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
