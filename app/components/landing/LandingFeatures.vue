<script setup lang="ts">
defineProps<{
  featureStep: number
}>()

const inventoryDemo = [
  ['/assets/items/sword.png', 'Клинок Тихого Пепла'],
  ['/assets/items/striker.png', 'Огниво странника'],
  ['/assets/items/flask.png', 'Фляга с талой водой'],
  ['/assets/items/map.png', 'Обугленная карта'],
  ['/assets/items/amulet.png', 'Амулет хранителя'],
  ['/assets/items/key.png', 'Ключ от Цитадели'],
  ['/assets/items/ash.png', 'Горсть пепла'],
  ['/assets/items/knife.png', 'Кремневый нож'],
] as const

const journalEntries = [
  'Старик-хранитель ждал того, кто поднимет меч',
  'Подобран Клинок Тихого Пепла',
  'Темная Цитадель горит на горизонте',
] as const

const simpleFeatures = [
  {
    icon: '/assets/icons/feat/memory.png?v2',
    title: 'Долгосрочные последствия',
    text: 'Персонажи удерживают историю прошлых взаимодействий, обещаний и конфликтов. Окружение реагирует на Вашего героя на основе его реальной репутации и прошлых действий.',
  },
  {
    icon: '/assets/icons/feat/tone.png?v2',
    title: 'Атмосферная адаптация',
    text: 'Возможность точно задавать характер и настроение истории — от жесткого реализма до камерной драмы — без нарушения общей логики мира.',
  },
  {
    icon: '/assets/icons/feat/access.png?v2',
    title: 'Доступ без ограничений',
    text: 'Работает напрямую в браузере на любом устройстве без необходимости скачивания из магазинов приложений. Мгновенный старт сессии с сохранением полного функционала на смартфонах, планшетах и ПК.',
  },
]

const featureCard = 'group relative rounded-[14px] border border-white/[.07] bg-fabula-surface p-6 transition duration-300 before:pointer-events-none before:absolute before:inset-0 before:z-[4] before:rounded-[inherit] before:bg-[radial-gradient(340px_circle_at_var(--mx,50%)_var(--my,50%),rgba(255,255,255,.08),transparent_60%)] before:opacity-0 before:transition-opacity before:duration-500 before:content-[\'\'] hover:-translate-y-1 hover:border-white/12 hover:bg-fabula-surface-raised hover:before:opacity-100'
const iconClass = 'mb-4 block h-12 w-[54px] bg-fabula-300 transition duration-300 [-webkit-mask:var(--icon-mask)_center_bottom/contain_no-repeat] [mask:var(--icon-mask)_center_bottom/contain_no-repeat] group-hover:-translate-y-0.5 group-hover:bg-fabula-100'
</script>

<template>
  <section id="feats" class="relative z-[5] overflow-clip py-[clamp(70px,9vw,124px)]">
    <div class="mx-auto w-[min(1180px,92vw)]">
      <LandingSectionHeading
        title="Больше, чем просто диалог"
        subtitle="ФАБУЛА объединяет гибкость генеративного ИИ с четкими правилами классических настольных ролевых игр."
      />
      <div class="grid grid-cols-1 gap-[18px] lg:grid-cols-3">
        <article data-reveal data-pointer-card :class="featureCard">
          <span :class="iconClass" :style="{ '--icon-mask': 'url(/assets/icons/feat/inv.png?v2)' }" />
          <h3 class="mb-2 font-display text-[17px] text-fabula-100">Система инвентаря</h3>
          <p class="text-[15px] text-fabula-300">Вся экипировка и ресурсы интегрированы в логику мира. Достаточно использовать предмет в диалоге или действии, чтобы кардинально изменить ход текущей сцены.</p>
          <div class="mt-[15px] overflow-hidden rounded-[10px] border border-white/[.07] bg-[#0a0a0c99] p-3" aria-hidden="true">
            <div class="mb-2.5 grid grid-cols-8 gap-[5px]">
              <i
                v-for="([src, label], index) in inventoryDemo"
                :key="src"
                class="relative aspect-square overflow-hidden rounded-md border bg-white/[.03] transition"
                :class="featureStep % inventoryDemo.length === index ? 'border-fabula-gold bg-fabula-gold/10 shadow-[0_0_12px_-3px_#d9a94a]' : 'border-white/[.07]'"
              >
                <img :src="src" :alt="label" loading="lazy" class="h-full w-full object-cover brightness-90 contrast-[1.02]">
              </i>
            </div>
            <div class="flex min-h-9 items-center justify-between gap-2 rounded-lg border border-white/[.07] bg-white/[.03] px-[9px] py-[7px]">
              <b class="font-display text-xs font-normal text-fabula-100">{{ inventoryDemo[featureStep % inventoryDemo.length]?.[1] }}</b>
              <span class="whitespace-nowrap rounded-md bg-fabula-100 px-2 py-1 font-display text-[9px] uppercase tracking-[.09em] text-[#0a0a0c]">В диалог →</span>
            </div>
          </div>
        </article>

        <article data-reveal data-pointer-card :class="featureCard">
          <span :class="iconClass" :style="{ '--icon-mask': 'url(/assets/icons/feat/journal.png?v2)' }" />
          <h3 class="mb-2 font-display text-[17px] text-fabula-100">Системный журнал</h3>
          <p class="text-[15px] text-fabula-300">События, локации и персонажи структурируются и фиксируются в реальном времени. Вам не нужно вести заметки — система сама упорядочивает контекст и ключевые факты вашей истории.</p>
          <div class="mt-[15px] overflow-hidden rounded-[10px] border border-white/[.07] bg-[#0a0a0c99] p-3" aria-hidden="true">
            <div class="mb-2.5 flex flex-col gap-[5px]">
              <div
                v-for="(row, index) in [['Персонажи', '2', '#54e6d0'], ['События', '3', '#d9a94a'], ['Места', '1', '#9bbf3a']]"
                :key="String(row[0])"
                class="flex items-center gap-2 rounded-lg border px-[9px] py-1.5 text-xs transition"
                :class="featureStep % 3 === index ? 'border-white/[.07] bg-white/[.04] text-fabula-100' : 'border-transparent text-fabula-500'"
              >
                <span class="size-[7px] rounded-full" :style="{ backgroundColor: String(row[2]) }" />
                {{ row[0] }}
                <b class="ml-auto rounded-full bg-white/[.05] px-[7px] font-display text-[10px] font-normal text-fabula-500">{{ row[1] }}</b>
              </div>
            </div>
            <div class="min-h-[33px] border-l-2 border-white/12 pl-[9px] text-xs leading-[1.35] text-fabula-300">
              {{ journalEntries[featureStep % journalEntries.length] }}
            </div>
          </div>
        </article>

        <article data-reveal data-pointer-card :class="featureCard">
          <span :class="iconClass" :style="{ '--icon-mask': 'url(/assets/icons/feat/scene.png?v2)' }" />
          <h3 class="mb-2 font-display text-[17px] text-fabula-100">Сюжетная визуализация</h3>
          <p class="text-[15px] text-fabula-300">Текстовое повествование дополняется графическими иллюстрациями. Визуальный ряд фиксирует сцены, локации и окружение, усиливая эстетику и атмосферу происходящего.</p>
          <div class="mt-[15px] overflow-hidden rounded-[10px] border border-white/[.07] bg-[#0a0a0c99] p-3" aria-hidden="true">
            <div class="mb-[9px] text-xs leading-[1.4] text-fabula-300">Ветер несет пепел. Рука натыкается на сталь…</div>
            <div class="h-[76px] overflow-hidden rounded-lg transition duration-1000" :class="featureStep % 2 === 0 ? 'scale-100 opacity-100 blur-0' : 'scale-[1.06] opacity-0 blur-md'">
              <img src="/assets/keyframe_01.jpg" alt="" loading="lazy" class="h-full w-full object-cover grayscale-[.45] brightness-[.85]">
            </div>
          </div>
        </article>

        <article
          v-for="feature in simpleFeatures"
          :key="feature.title"
          data-reveal
          data-pointer-card
          :class="featureCard"
        >
          <span :class="iconClass" :style="{ '--icon-mask': `url(${feature.icon})` }" />
          <h3 class="mb-2 font-display text-[17px] text-fabula-100">{{ feature.title }}</h3>
          <p class="text-[15px] text-fabula-300">{{ feature.text }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
