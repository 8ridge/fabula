<script setup lang="ts">
type Billing = 'monthly' | 'yearly'

const props = defineProps<{
  title: string
  role: string
  accent: string
  monthly: number
  yearly: number
  billing: Billing
  limitLead: string
  limitText: string
  features: Array<{ text: string, disabled?: boolean }>
  action: string
  badge?: string
  featured?: boolean
}>()

const formatPrice = (value: number) => value.toLocaleString('ru-RU')
const annualFull = computed(() => props.monthly * 12)
const annualDiscounted = computed(() => props.yearly * 12)
</script>

<template>
  <article
    data-reveal
    data-pointer-card
    :style="{ '--tier-accent': accent }"
    class="group relative flex flex-col rounded-2xl border border-t-2 border-white/[.07] border-t-[var(--tier-accent)] bg-fabula-surface px-[26px] py-8 transition duration-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(340px_circle_at_var(--mx,50%)_var(--my,50%),color-mix(in_srgb,var(--tier-accent)_15%,transparent),transparent_60%)] before:opacity-0 before:transition-opacity before:duration-500 before:content-[''] hover:-translate-y-[7px] hover:border-[var(--tier-accent)] hover:before:opacity-100"
    :class="featured ? 'bg-fabula-surface-raised shadow-[0_0_46px_-16px_var(--tier-accent)]' : ''"
  >
    <span
      v-if="badge"
      class="absolute -top-[11px] left-1/2 z-[2] -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--tier-accent)] px-3.5 py-[5px] font-display text-[10px] uppercase tracking-[.16em] text-[#0a0a0c]"
    >
      {{ badge }}
    </span>
    <div class="relative z-[1] flex items-baseline justify-between gap-2.5">
      <h3 class="font-display text-[23px] text-[var(--tier-accent)]">{{ title }}</h3>
      <span class="font-display text-[10px] uppercase tracking-[.14em] text-[var(--tier-accent)]">{{ role }}</span>
    </div>
    <div data-price class="relative z-[1] my-3 mb-1 font-display text-[42px] text-fabula-100">
      <template v-if="monthly === 0">
        0 <small class="font-display text-[15px] text-fabula-500">₽</small>
      </template>
      <template v-else-if="billing === 'yearly'">
        <span class="mr-2 font-display text-[19px] text-fabula-500 line-through">{{ formatPrice(annualFull) }}</span>
        {{ formatPrice(annualDiscounted) }}
        <small class="font-display text-[15px] text-fabula-500">₽ / год</small>
        <em class="mt-0.5 block font-display text-[12.5px] not-italic tracking-[.04em] text-fabula-500">{{ formatPrice(yearly) }} ₽ в месяц</em>
      </template>
      <template v-else>
        {{ formatPrice(monthly) }} <small class="font-display text-[15px] text-fabula-500">₽ / мес</small>
      </template>
    </div>
    <div class="relative z-[1] my-0.5 mb-1 rounded-[9px] border border-[var(--tier-accent)] bg-[color-mix(in_srgb,var(--tier-accent)_11%,transparent)] px-3 py-[9px] text-[13.5px] text-fabula-100">
      <b class="font-semibold text-[var(--tier-accent)]">{{ limitLead }}</b> {{ limitText }}
    </div>
    <ul class="relative z-[1] my-5 mb-[26px] flex flex-col gap-[11px]">
      <li
        v-for="feature in features"
        :key="feature.text"
        class="flex items-start gap-[11px] text-[15px]"
        :class="feature.disabled ? 'text-fabula-500 opacity-55' : 'text-fabula-300'"
      >
        <span class="flex-none" :class="feature.disabled ? 'text-fabula-500' : 'text-[var(--tier-accent)]'">{{ feature.disabled ? '×' : '—' }}</span>
        {{ feature.text }}
      </li>
    </ul>
    <LandingButton to="/app" :variant="featured ? 'solid' : 'ghost'" class="relative z-[1] mt-auto w-full">
      {{ action }}
    </LandingButton>
  </article>
</template>
