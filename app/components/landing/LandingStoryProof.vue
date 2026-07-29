<script setup lang="ts">
const lore = [
  {
    title: 'Старик у переправы',
    text: 'Седой, хромает на левую ногу. Знает, чье клеймо на клинке, но говорить отказался. Просил меч не забирать.',
    tags: ['персонаж', 'переправа', 'не доверяет'],
  },
  {
    title: 'Клинок Тихого Пепла',
    text: 'Чужое клеймо у гарды, рукоять холодная на ощупь. Вытащен из золы в первой главе. Старик узнал его с одного взгляда.',
    tags: ['предмет', 'оружие', 'клеймо'],
  },
  {
    title: 'Восточная переправа',
    text: 'Мост сгорел, брод по пояс. С востока постоянно тянет пеплом. На той стороне видны столбы дыма — кто-то жжет костры.',
    tags: ['место', 'дым на востоке'],
  },
]
</script>

<template>
  <section id="fork" class="relative z-[5] overflow-clip py-[clamp(70px,9vw,124px)]">
    <div class="mx-auto w-[min(1180px,92vw)]">
      <LandingSectionHeading
        title="Отсюда история идет по-разному"
        subtitle="Это не две заранее написанные ветки. Модель разворачивает сцену от того, что уже лежит у тебя в инвентаре и в журнале."
      />
      <LandingGameplayDemo />
      <LandingSectionHeading
        spacious
        title="Что мир записал за тобой"
        subtitle="Так выглядят настоящие записи после первой главы. Каждую можно открыть и переписать — дальше модель будет исходить из твоей версии."
      />
      <div data-reveal class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article
          v-for="entry in lore"
          :key="entry.title"
          data-pointer-card
          class="relative rounded-[13px] border border-white/[.07] bg-fabula-surface p-[18px] transition duration-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(340px_circle_at_var(--mx,50%)_var(--my,50%),rgba(255,255,255,.08),transparent_60%)] before:opacity-0 before:transition-opacity before:content-[''] hover:-translate-y-1 hover:border-white/12 hover:before:opacity-100"
        >
          <h3 class="mb-2 font-display text-[17px] text-fabula-100">{{ entry.title }}</h3>
          <p class="mb-[13px] text-sm leading-normal text-fabula-300">{{ entry.text }}</p>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="tag in entry.tags"
              :key="tag"
              class="rounded-[5px] border border-white/[.07] bg-white/[.02] px-2 py-[3px] font-display text-[10.5px] tracking-[.06em] text-fabula-500"
            >
              {{ tag }}
            </span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
