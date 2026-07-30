<script setup lang="ts">
import {
  inventoryConditionMeta,
  type InventoryItemView,
} from '~/types/inventory'

defineProps<{
  item?: InventoryItemView | null
}>()

const emit = defineEmits<{
  useItem: [item: InventoryItemView]
}>()
</script>

<template>
  <aside aria-label="Подробности предмета" class="flex min-h-full flex-col">
    <template v-if="item">
      <InventoryItemIcon :item="item" size="detail" />

      <div class="mt-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-interface text-[10px] uppercase tracking-[.14em] text-[var(--accent-light)]">
              {{ item.categoryLabel }}
            </p>
            <h3 class="mt-1 font-display text-[24px] leading-tight text-fabula-100">
              {{ item.name }}
            </h3>
          </div>
          <span class="shrink-0 rounded-lg border border-white/10 px-2 py-1 font-interface text-[10px] text-fabula-300">
            {{ item.amountLabel }}
          </span>
        </div>

        <span
          :class="inventoryConditionMeta[item.condition].className"
          class="mt-2 inline-flex rounded border px-2 py-1 font-interface text-[9px] uppercase tracking-[.08em]"
        >
          {{ item.conditionLabel }}
        </span>
        <p class="mt-3 text-[15px] leading-relaxed text-fabula-300">
          {{ item.description }}
        </p>
      </div>

      <dl class="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-y border-white/[.08] py-4">
        <div class="min-w-0">
          <dt class="font-interface text-[9px] uppercase tracking-[.09em] text-[#77747a]">
            Владелец
          </dt>
          <dd class="mt-1 truncate text-[13px] text-fabula-100" :title="item.owner_name">
            {{ item.owner_name }}
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="font-interface text-[9px] uppercase tracking-[.09em] text-[#77747a]">
            Держатель
          </dt>
          <dd class="mt-1 truncate text-[13px] text-fabula-100" :title="item.holder_name">
            {{ item.holder_name }}
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="font-interface text-[9px] uppercase tracking-[.09em] text-[#77747a]">
            Размещение
          </dt>
          <dd class="mt-1 truncate text-[13px] text-fabula-100">
            {{ item.slotLabel }}
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="font-interface text-[9px] uppercase tracking-[.09em] text-[#77747a]">
            Место
          </dt>
          <dd class="mt-1 truncate text-[13px] text-fabula-100" :title="item.location_name">
            {{ item.location_name }}
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="font-interface text-[9px] uppercase tracking-[.09em] text-[#77747a]">
            Количество
          </dt>
          <dd class="mt-1 text-[13px] text-fabula-100">{{ item.quantity }}</dd>
        </div>
        <div v-if="item.charges !== null" class="min-w-0">
          <dt class="font-interface text-[9px] uppercase tracking-[.09em] text-[#77747a]">
            Заряды
          </dt>
          <dd class="mt-1 text-[13px] text-fabula-100">{{ item.charges }}</dd>
        </div>
        <div class="col-span-2 min-w-0">
          <dt class="font-interface text-[9px] uppercase tracking-[.09em] text-[#77747a]">
            Происхождение
          </dt>
          <dd class="mt-1 text-[13px] leading-relaxed text-fabula-100">
            {{ item.provenance.summary }}
          </dd>
        </div>
      </dl>

      <div class="mt-auto pt-5">
        <p v-if="item.unavailableReason" class="mb-2 text-[12px] leading-relaxed text-amber-100/75">
          {{ item.unavailableReason }}
        </p>
        <button
          type="button"
          :disabled="!item.canUse"
          :title="item.unavailableReason || undefined"
          class="min-h-11 w-full rounded-xl border border-[var(--accent)] bg-[var(--accent)] px-4 font-display text-[14px] text-[#101114] transition hover:bg-[var(--accent-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-light)] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[.05] disabled:text-[#77747a]"
          @click="emit('useItem', item)"
        >
          {{ item.canUse ? 'Добавить в ход' : 'Недоступно для хода' }}
        </button>
      </div>
    </template>

    <div v-else class="grid min-h-64 flex-1 place-items-center rounded-2xl border border-dashed border-white/[.13] bg-white/[.015] p-6 text-center">
      <div>
        <span aria-hidden="true" class="font-display text-4xl text-[#9f8c69]">◇</span>
        <p class="mt-3 font-display text-[20px] text-fabula-100">Выбери предмет</p>
        <p class="mt-1 text-[13px] leading-relaxed text-[#908b8b]">
          Здесь появятся его состояние, размещение и доступное действие.
        </p>
      </div>
    </div>
  </aside>
</template>
