<template>
  <main class="legal">
    <a class="back" href="/">← ФАБУЛА</a>
    <article>
      <p class="eyebrow">Правовые документы</p>
      <h1>Условия использования</h1>
      <p class="upd">Последнее обновление: август 2026</p>

      <p class="lead">
        Эти Условия регулируют доступ и использование ФАБУЛЫ — сервиса интерактивных
        историй с искусственным интеллектом на fabulaplay.com. Ниже — краткое изложение
        ключевых положений; полная редакция готовится и будет опубликована здесь же.
      </p>

      <h2>Кому доступен сервис</h2>
      <p>
        Сервис предназначен только для лиц <strong>старше 18 лет</strong>. Контент может
        содержать взрослые темы. Используя сервис, вы подтверждаете свой возраст и
        дееспособность.
      </p>

      <h2>Аккаунт</h2>
      <p>
        Для части функций нужен аккаунт. Регистрация — по email и паролю либо через Google,
        Telegram или Discord. Вы отвечаете за сохранность доступа к своему аккаунту.
      </p>

      <h2>Контент, созданный ИИ</h2>
      <p>
        Истории генерируются автоматически на основе ваших вводов. Контент является
        вымышленным, может быть неточным и <strong>не является</strong> советом
        (юридическим, медицинским, финансовым или иным). Для генерации ваши вводы
        передаются сторонним провайдерам ИИ — подробности в
        <a href="/privacy">Политике конфиденциальности</a>.
      </p>

      <h2>Правила</h2>
      <p>
        Запрещено использовать сервис в противоправных целях, для создания материалов,
        эксплуатирующих несовершеннолетних, для угроз, преследования, а также для попыток
        нарушить работу сервиса. Мы вправе ограничивать доступ при нарушениях.
      </p>

      <h2>Платные функции</h2>
      <p>
        Часть возможностей может быть платной: подписки с автопродлением, разовые покупки,
        а также виртуальная валюта и предметы для использования внутри сервиса. Виртуальные
        валюта и предметы не обмениваются на реальные деньги и невозвратны, кроме случаев,
        предусмотренных законом. Данные банковских карт мы не храним — их обрабатывает
        платёжный провайдер.
      </p>

      <h2>Ответственность</h2>
      <p>
        Сервис предоставляется «как есть». В пределах, допустимых законом, мы не отвечаем за
        косвенные убытки. Настоящий пункт не ограничивает ответственность, которую нельзя
        ограничить по закону.
      </p>

      <h2>Изменения и контакты</h2>
      <p>
        Мы можем обновлять эти Условия; о существенных изменениях уведомим через сервис.
        Вопросы: <a href="mailto:support@fabulaplay.com">support@fabulaplay.com</a>.
      </p>
    </article>
  </main>
</template>

<script setup>
useHead({
  title: 'Условия использования — ФАБУЛА',
  link: [{ rel: 'stylesheet', href: '/assets/fonts/fonts.css' }],
  meta: [{ name: 'robots', content: 'index,follow' }],
})
</script>

<style scoped>
.legal {
  --bg: #0b0906;
  --ink: #e9dfc9;
  --dim: #b6a88a;
  --mute: #8a7c60;
  --gold: #d9a94a;
  --hair: rgba(217, 169, 74, 0.18);
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding: 48px 24px 96px;
  -webkit-font-smoothing: antialiased;
}
.back {
  display: inline-block;
  margin-bottom: 40px;
  color: var(--dim);
  text-decoration: none;
  font-size: 14px;
  letter-spacing: 0.04em;
  transition: color 0.18s ease;
}
.back:hover { color: var(--gold); }
article {
  max-width: 720px;
  margin: 0 auto;
}
.eyebrow {
  color: var(--gold);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0 0 12px;
}
h1 {
  font-family: 'Forum', Georgia, serif;
  font-weight: 400;
  font-size: clamp(32px, 6vw, 48px);
  line-height: 1.1;
  margin: 0 0 12px;
  color: var(--ink);
}
.upd {
  color: var(--mute);
  font-size: 13px;
  margin: 0 0 32px;
}
.lead {
  font-size: 17px;
  line-height: 1.65;
  color: var(--dim);
  margin: 0 0 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--hair);
}
h2 {
  font-family: 'Forum', Georgia, serif;
  font-weight: 400;
  font-size: 22px;
  margin: 36px 0 12px;
  color: var(--gold);
}
p {
  font-size: 15.5px;
  line-height: 1.7;
  color: var(--ink);
  margin: 0 0 14px;
}
strong { color: var(--ink); font-weight: 600; }
a { color: var(--gold); text-decoration: underline; text-underline-offset: 2px; }
a:hover { color: #f2cd7c; }
</style>
