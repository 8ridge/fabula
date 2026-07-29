<script setup lang="ts">
withDefaults(defineProps<{
  to?: string
  href?: string
  variant?: 'solid' | 'ghost'
}>(), {
  variant: 'solid',
})

const base = 'group relative inline-block cursor-pointer overflow-hidden rounded-[11px] border text-center font-display text-[13px] uppercase tracking-[.12em] no-underline transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-fabula-100 active:translate-y-0'
const variants = {
  solid: 'border-transparent bg-gradient-to-b from-white via-[#f0f0f4] to-[#dcdce4] px-[30px] py-[15px] text-[#08080a] shadow-[inset_0_1px_0_#fff,inset_0_-2px_7px_rgba(0,0,0,.16),0_6px_18px_-8px_rgba(0,0,0,.5)] [text-shadow:0_1px_0_rgba(255,255,255,.7)] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_#fff,inset_0_-2px_7px_rgba(0,0,0,.18),0_12px_26px_-10px_rgba(0,0,0,.55)]',
  ghost: 'border-white/12 bg-white/[.03] px-7 py-3.5 text-fabula-100 hover:-translate-y-0.5 hover:bg-white/[.08]',
}
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :class="[base, variants[variant]]"
  >
    <span
      v-if="variant === 'solid'"
      aria-hidden="true"
      class="pointer-events-none absolute inset-y-0 -left-[70%] w-[45%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/80 to-transparent transition-[left] duration-700 group-hover:left-[130%]"
    />
    <span class="relative"><slot /></span>
  </NuxtLink>
  <a
    v-else
    :href="href"
    :class="[base, variants[variant]]"
  >
    <span class="relative"><slot /></span>
  </a>
</template>
