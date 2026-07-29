<script setup lang="ts">
import type { InteractionMessageData } from '~/types/interaction-ui'

const props = defineProps<{
  message: InteractionMessageData
}>()

const emit = defineEmits<{
  copy: [text: string]
  edit: [text: string]
  variant: [message: InteractionMessageData]
}>()

const variant = ref('')

function showVariant() {
  const text = props.message.text
  variant.value = text
    .replace(/Я поднимаю/g, 'Я медленно поднимаю')
    .replace(/Я показываю/g, 'Я раскрываю ладонь и показываю')
    .replace(/смотрит/g, 'задерживает взгляд')
  if (variant.value === text)
    variant.value = `Иначе это звучит так: ${text.charAt(0).toLowerCase()}${text.slice(1)}`
  emit('variant', { ...props.message, text: variant.value })
}
</script>

<template>
  <article
    data-interaction-message
    class="w-full max-w-[668px] shrink-0 overflow-hidden"
    :class="[
      message.type === 'player'
        ? 'self-end rounded-[0_0_20px_20px] bg-gradient-to-br from-fabula-gold-light to-[#d9a94a] text-[#291d0d] shadow-[0_18px_50px_-30px_rgba(217,169,74,.65)]'
        : 'self-start rounded-[18px] border bg-[#131316] text-fabula-100',
      message.pending ? 'border-dashed border-white/15' : message.type === 'player' ? 'border border-fabula-gold-light/60' : 'border-white/10',
    ]"
  >
    <header class="flex items-center gap-3 px-5 pb-0 pt-4" :class="message.type === 'player' ? 'text-[#291d0d]' : ''">
      <span
        class="grid size-[30px] shrink-0 place-items-center overflow-hidden rounded-[9px] border font-display"
        :class="message.type === 'player' ? 'border-[#5b4218]/40 bg-white/30' : 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-light)]'"
      >
        <img v-if="message.type === 'character'" class="h-full w-full object-cover" src="/assets/avatar.jpg" alt="">
        <span v-else>{{ message.type === 'player' ? 'Б' : '✦' }}</span>
      </span>
      <span class="min-w-0">
        <strong class="block truncate font-display text-[17px] font-normal">{{ message.name }}</strong>
        <small class="block truncate font-interface text-[9px] opacity-60">{{ message.meta }}</small>
      </span>
    </header>

    <div class="px-5 py-3">
      <p class="text-[clamp(17px,1.45vw,21px)] leading-[1.55]">{{ message.text }}</p>
    </div>

    <div v-if="message.type === 'character'" class="mx-5 mb-3 flex items-center gap-2 rounded-lg border border-white/[.07] bg-white/[.025] px-3 py-2 font-interface text-[9px] text-fabula-300">
      <span class="size-1.5 rounded-full bg-[var(--accent)]" />{{ message.foot }}
    </div>
    <div v-else-if="message.pending" class="mx-5 mb-3 flex items-center gap-2 rounded-lg border border-[#324052] bg-[#18202a] px-3 py-2 font-interface text-[9px] text-[#9db2cc]">
      <span>◌</span><span>{{ message.foot }}</span>
    </div>

    <footer class="flex items-center justify-between gap-3 px-5 pb-4 font-interface text-[8px]" :class="message.type === 'player' ? 'text-[#5d451c]' : 'text-fabula-500'">
      <span class="min-w-0 truncate">{{ message.foot }}</span>
      <span class="flex shrink-0 gap-1.5">
        <button v-if="message.type === 'player'" type="button" class="rounded-lg border border-[#6d501d]/25 px-2 py-1.5" aria-label="Изменить действие" @click="emit('edit', message.text)">✎ <small>Изменить</small></button>
        <template v-else>
          <button type="button" class="rounded-lg border border-white/10 px-2 py-1.5" aria-label="Скопировать сообщение" @click="emit('copy', message.text)">⧉ <small>Копировать</small></button>
          <button type="button" class="rounded-lg border border-white/10 px-2 py-1.5" aria-label="Показать локальный вариант" @click="showVariant">≋ <small>Локальный вариант</small></button>
        </template>
      </span>
    </footer>

    <section v-if="variant" class="m-3 mt-0 rounded-xl border border-[var(--accent)]/40 bg-black/25 p-3">
      <header class="mb-2 flex items-center justify-between font-interface text-[9px] uppercase tracking-[.08em] text-[var(--accent-light)]">
        <span>✧ Локальный вариант</span>
        <button type="button" aria-label="Скрыть вариант" @click="variant = ''">×</button>
      </header>
      <p class="text-base leading-relaxed">{{ variant }}</p>
      <footer class="mt-2 flex items-center justify-between font-interface text-[8px] opacity-60">
        <span>Модель не вызывалась · канон не изменен</span>
        <button type="button" class="rounded border border-current px-2 py-1" @click="variant = ''">Скрыть</button>
      </footer>
    </section>
  </article>
</template>
