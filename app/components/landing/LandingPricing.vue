<script setup lang="ts">
const billing = ref<'monthly' | 'yearly'>('monthly')

const tiers = [
  {
    title: 'Странник',
    role: 'знакомство',
    accent: '#6d6d78',
    monthly: 0,
    yearly: 0,
    limitLead: '3 главы в сутки.',
    limitText: 'Память ~16 000 символов',
    action: 'Играть бесплатно',
    features: [
      { text: 'Все четыре мира открыты' },
      { text: 'Базовая модель повествования' },
      { text: 'Инвентарь и журнал целиком' },
      { text: 'Один кадр на главу' },
      { text: 'Память дальше 16 000 символов', disabled: true },
      { text: 'Свои сценарии', disabled: true },
    ],
  },
  {
    title: 'Бард',
    role: 'основной',
    accent: '#d9a94a',
    monthly: 490,
    yearly: 390,
    limitLead: 'Без счетчика глав.',
    limitText: 'Память ~64 000 символов',
    action: 'Выбрать «Барда»',
    badge: 'Выбирают чаще всего',
    featured: true,
    features: [
      { text: 'Умная модель: живые диалоги и характеры' },
      { text: 'Помнит ~64 000 символов, это весь пак' },
      { text: 'До пяти кадров на главу' },
      { text: 'Тон и сложность под себя' },
      { text: 'Редактирование журнала' },
      { text: 'Приоритет в очереди', disabled: true },
    ],
  },
  {
    title: 'Архимаг',
    role: 'для длинных кампаний',
    accent: '#9a6fd0',
    monthly: 990,
    yearly: 790,
    limitLead: 'Все из «Барда».',
    limitText: 'Память ~200 000 символов',
    action: 'Выбрать «Архимага»',
    badge: 'Максимум',
    features: [
      { text: 'Топовые модели, самый связный текст' },
      { text: 'Помнит ~200 000 символов, это все паки' },
      { text: 'Кадры без ограничений' },
      { text: 'Приоритет в очереди генерации' },
      { text: 'Новые миры за неделю до остальных' },
      { text: 'Свои паки и сценарии' },
    ],
  },
]
</script>

<template>
  <section id="price" class="relative z-[5] overflow-clip py-[clamp(70px,9vw,124px)]">
    <div class="mx-auto w-[min(1180px,92vw)]">
      <LandingSectionHeading
        title="Ваша история не должна останавливаться"
        subtitle="Подключите подходящий тариф для исследования глубоких миров без сюжетных ограничений."
      />
      <div data-reveal class="mx-auto mb-[30px] flex w-max justify-center gap-1 rounded-full border border-white/12 bg-fabula-surface p-1">
        <button
          type="button"
          class="rounded-full px-[18px] py-[9px] font-display text-xs uppercase tracking-[.1em] transition"
          :class="billing === 'monthly' ? 'bg-fabula-100 text-[#0a0a0c]' : 'bg-transparent text-fabula-500'"
          :aria-pressed="billing === 'monthly'"
          @click="billing = 'monthly'"
        >
          Ежемесячно
        </button>
        <button
          type="button"
          class="rounded-full px-[18px] py-[9px] font-display text-xs uppercase tracking-[.1em] transition"
          :class="billing === 'yearly' ? 'bg-fabula-100 text-[#0a0a0c]' : 'bg-transparent text-fabula-500'"
          :aria-pressed="billing === 'yearly'"
          @click="billing = 'yearly'"
        >
          На год <span :class="billing === 'yearly' ? 'text-[#7a5a12]' : 'text-fabula-gold'" class="ml-1.5 tracking-[.04em] normal-case">−20%</span>
        </button>
      </div>

      <div class="grid grid-cols-1 items-stretch gap-[18px] lg:grid-cols-3">
        <LandingPricingTier v-for="tier in tiers" :key="tier.title" v-bind="tier" :billing="billing" />
      </div>

      <div data-reveal data-pointer-card class="relative mt-5 flex flex-wrap items-center justify-between gap-x-[22px] gap-y-4 rounded-[14px] border border-white/12 bg-fabula-surface px-6 py-5 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(340px_circle_at_var(--mx,50%)_var(--my,50%),rgba(255,255,255,.08),transparent_60%)] before:opacity-0 before:transition-opacity before:content-[''] hover:before:opacity-100">
        <div class="relative">
          <h3 class="mb-[5px] font-display text-[19px] text-fabula-100">Не готов подписываться?</h3>
          <p class="max-w-[56ch] text-sm text-fabula-300">Тогда возьми один мир навсегда: все главы пака, умная модель и память внутри него, разово и без ежемесячных списаний.</p>
        </div>
        <div class="relative whitespace-nowrap font-display text-[26px] text-fabula-100">от 349 <small class="text-[13px] text-fabula-500">₽ за мир</small></div>
        <LandingButton to="/app" variant="ghost" class="relative">Выбрать мир</LandingButton>
      </div>
      <p data-reveal class="mt-4 text-center text-[13px] text-fabula-500">
        Отменить можно в любой момент, доступ доживет до конца оплаченного срока. Карты РФ и зарубежные, СБП.
      </p>
    </div>
  </section>
</template>
