<script setup lang="ts">
const steps = [
  {
    title: 'Выбери мир',
    text: 'Выберите желаемый сеттинг — от классического фэнтези до исследования космоса. Вы можете довериться предустановленным параметрам или настроить тон и сложность повествования под себя.',
  },
  {
    title: 'Играй',
    text: 'Следите за развитием событий и делайте выбор. Вы можете следовать предлагаемым сценариям или импровизировать, описывая любые действия текстом.',
  },
  {
    title: 'Мир запомнит',
    text: 'Предметы, персонажи и ключевые решения запоминаются. Мир сохраняет логику ваших поступков и отзывается на них даже спустя десятки глав.',
  },
]
</script>

<template>
  <section id="how" class="relative z-[5] overflow-clip py-[clamp(70px,9vw,124px)]">
    <div class="mx-auto w-[min(1180px,92vw)]">
      <LandingSectionHeading
        title="Начни свое приключение"
        subtitle="Откройте для себя формат интерактивных историй, где правила и окружение подстраиваются под вас."
      />
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <article
          v-for="step in steps"
          :key="step.title"
          data-reveal
          class="group relative overflow-hidden rounded-[14px] border border-white/[.07] bg-fabula-surface px-[26px] py-[30px] text-center transition duration-300 before:absolute before:left-0 before:top-0 before:h-px before:w-0 before:bg-fabula-100 before:transition-[width] before:duration-700 before:content-[''] hover:-translate-y-1 hover:border-white/12 hover:before:w-full"
        >
          <h3 class="mb-[13px] font-display text-[25px] tracking-[.02em] text-fabula-100">
            {{ step.title }}
          </h3>
          <p class="text-lg leading-[1.55] text-fabula-300">
            {{ step.text }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
