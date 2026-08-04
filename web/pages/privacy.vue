<template>
  <main class="legal">
    <a class="back" href="/">← ФАБУЛА</a>
    <article>
      <p class="eyebrow">Правовые документы</p>
      <h1>Политика конфиденциальности</h1>
      <p class="upd">Последнее обновление: август 2026</p>

      <p class="lead">
        Здесь описано, какие данные ФАБУЛА собирает и как их использует. Ниже — краткое
        изложение ключевых положений; полная редакция готовится и будет опубликована
        здесь же.
      </p>

      <h2>Какие данные мы обрабатываем</h2>
      <p>
        <strong>Аккаунт:</strong> email, хэш пароля (сам пароль в открытом виде не хранится),
        имя пользователя, при загрузке — аватар.
      </p>
      <p>
        <strong>Вход через сторонние сервисы</strong> (если используете): идентификатор и,
        при наличии, email/имя у Google, Telegram или Discord. Пароли этих сервисов мы не
        получаем.
      </p>
      <p>
        <strong>Технические данные:</strong> сведения о сессиях и устройствах (тип
        браузера/устройства, время входа и активности) и код страны. IP-адрес в профиле мы
        не храним.
      </p>
      <p>
        <strong>Игровые данные:</strong> ваши вводы, выборы, настройки персонажа, созданные
        истории, инвентарь и связанное состояние игры.
      </p>
      <p>
        <strong>Оплата:</strong> факт и параметры покупки, статус подписки. Данные карт мы
        не храним — их обрабатывает платёжный провайдер.
      </p>

      <h2>Как мы используем данные</h2>
      <p>
        Для работы аккаунта и входа, генерации историй, обеспечения безопасности, обработки
        оплаты и улучшения сервиса.
      </p>

      <h2>Передача данных</h2>
      <p>
        Для генерации историй ваши игровые вводы передаются сторонним провайдерам
        ИИ-моделей. Мы также используем поставщиков хостинга, защиты сети и обработки
        платежей, действующих по нашему поручению. Мы не продаём персональные данные.
        Пожалуйста, не вводите в истории чувствительные личные данные.
      </p>

      <h2>Хранение и ваши права</h2>
      <p>
        Данные хранятся, пока действует аккаунт. Вы можете удалить аккаунт в настройках —
        связанные данные будут удалены или обезличены в разумный срок, кроме сведений,
        которые мы обязаны хранить по закону. Вы вправе запросить доступ к данным, их
        исправление или удаление: <a href="mailto:support@fabulaplay.com">support@fabulaplay.com</a>.
      </p>

      <h2>Безопасность</h2>
      <p>
        Пароли хранятся в виде хэша, сессии защищены токенами с возможностью выхода со всех
        устройств. Мы применяем разумные меры защиты, но абсолютной безопасности в интернете
        не существует.
      </p>

      <h2>Возраст</h2>
      <p>
        Сервис предназначен для лиц старше 18 лет и не адресован несовершеннолетним.
      </p>

      <h2>Изменения и контакты</h2>
      <p>
        Мы можем обновлять Политику; о существенных изменениях уведомим через сервис.
        Вопросы: <a href="mailto:support@fabulaplay.com">support@fabulaplay.com</a>.
      </p>
    </article>
  </main>
</template>

<script setup>
useHead({
  title: 'Политика конфиденциальности — ФАБУЛА',
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
