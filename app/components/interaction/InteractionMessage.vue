<script setup lang="ts">
export type InteractionMessageData = {
  id?: string
  type: 'narrator' | 'character' | 'player'
  name: string
  meta: string
  text: string
  foot: string
  pending?: boolean
}

const props = defineProps<{
  message: InteractionMessageData
}>()

const emit = defineEmits<{
  copy: [text: string]
  edit: [text: string]
  variant: [message: InteractionMessageData]
}>()

const variant = ref('')
const original = computed(() => props.message.text)

function showVariant() {
  const text = original.value
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
  <article class="message" :class="[`message-${message.type}`, { 'message-pending': message.pending }]">
    <div class="message-head">
      <span v-if="message.type === 'character'" class="message-avatar avatar-character"><img src="/assets/avatar.jpg" alt=""></span>
      <span v-else-if="message.type === 'player'" class="message-avatar avatar-player">Б</span>
      <span v-else class="message-avatar avatar-narrator">✦</span>
      <span><strong>{{ message.name }}</strong><small>{{ message.meta }}</small></span>
    </div>
    <div class="message-copy">
      <p>{{ message.text }}</p>
    </div>
    <div v-if="message.type === 'character'" class="character-mood">
      <span class="mood-dot"></span>{{ message.foot }}
    </div>
    <div v-else-if="message.pending" class="message-media-hint">
      <span>◌</span><span>{{ message.foot }}</span>
    </div>
    <div class="message-foot">
      <span>{{ message.foot }}</span>
      <span class="message-actions">
        <button v-if="message.type === 'player'" class="message-action-button" type="button" aria-label="Изменить действие" @click="emit('edit', message.text)">✎<small>Изменить</small></button>
        <template v-else>
          <button class="message-action-button" type="button" aria-label="Скопировать сообщение" @click="emit('copy', message.text)">⧉<small>Копировать</small></button>
          <button class="message-action-button" type="button" aria-label="Показать локальный вариант" @click="showVariant">≋<small>Локальный вариант</small></button>
        </template>
      </span>
    </div>
    <div v-if="variant" class="message-variant">
      <div class="variant-head"><span><i>✧</i>Локальный вариант</span><button type="button" aria-label="Скрыть вариант" @click="variant = ''">×</button></div>
      <p>{{ variant }}</p>
      <div class="variant-foot"><span>Модель не вызывалась · канон не изменен</span><button class="variant-button" type="button" @click="variant = ''">Скрыть</button></div>
    </div>
  </article>
</template>
