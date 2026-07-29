export type InventoryItem = {
  id: string
  icon: string
  name: string
  category: 'weapon' | 'armor' | 'artifact' | 'key' | 'consumable'
  categoryLabel: string
  rarity: 'legendary' | 'epic' | 'rare' | 'common'
  rarityLabel: string
  quantity: number
  condition: string
  weight: string
  description: string
  inspect: string
  text: string
}

export type StoryToolset = {
  currency: string
  inventory: InventoryItem[]
  journal: Array<{ title: string, meta: string, text: string }>
  checks: Array<{ title: string, text: string, meta: string }>
}

export const interactionTools: Record<'fant' | 'scifi' | 'hist' | 'post', StoryToolset> = {
  fant: {
    currency: '248 золота',
    inventory: [
      { id: 'ash-blade', icon: '⚔', name: 'Клинок Тихого Пепла', category: 'weapon', categoryLabel: 'Оружие', rarity: 'legendary', rarityLabel: 'Легендарный', quantity: 1, condition: 'Цел', weight: '2.4 кг', description: 'Выкован из остывшего сердца павшей звезды. На лезвии три звезды над разбитой короной.', inspect: 'Клинок теплый, хотя вокруг стынет пепел. Он отзывается на прикосновение короткой дрожью.', text: 'Я показываю Клинок Тихого Пепла.' },
      { id: 'wanderer-cloak', icon: '☙', name: 'Плащ Скитальца', category: 'armor', categoryLabel: 'Броня', rarity: 'epic', rarityLabel: 'Эпический', quantity: 1, condition: 'Потерт', weight: '1.1 кг', description: 'Хранит тепло костров всех дорог, которые ты прошел.', inspect: 'На внутренней стороне вышиты названия мест, которых нет ни на одной карте.', text: 'Я расправляю Плащ Скитальца и проверяю потайные швы.' },
      { id: 'star-amulet', icon: '✦', name: 'Амулет Трех Звезд', category: 'artifact', categoryLabel: 'Артефакт', rarity: 'epic', rarityLabel: 'Эпический', quantity: 1, condition: 'Настроен', weight: '0.2 кг', description: 'Тот же герб, что и на клинке. Камень темнеет рядом с руинами.', inspect: 'Тепло амулета усиливается, когда ты смотришь на пламя Цитадели.', text: 'Я показываю Амулет Трех Звезд и жду реакции хранителя.' },
      { id: 'burnt-map', icon: '❦', name: 'Обрывок карты', category: 'key', categoryLabel: 'Ключ', rarity: 'common', rarityLabel: 'Обычный', quantity: 1, condition: 'Хрупкий', weight: '0.1 кг', description: 'Полусгоревший лист. Сквозь копоть виден путь к каменному мосту.', inspect: 'Если поднести карту к пеплу, на полях проступает вторая линия.', text: 'Я разворачиваю Обрывок карты и сверяю его с дорогой.' },
    ],
    journal: [
      { title: 'Старик-хранитель', meta: 'Персонажи · сцена 02', text: 'Ждал носителя клинка двадцать лет.' },
      { title: 'Клинок Тихого Пепла', meta: 'Предметы · локальный пример', text: 'На лезвии три звезды над разбитой короной.' },
      { title: 'Темная Цитадель', meta: 'Места · открытое последствие', text: 'Горит на горизонте вечным пламенем.' },
    ],
    checks: [
      { title: 'Ловкость', text: 'Тихо обойти разрушенную арку', meta: '+3 · пример · DC 13' },
      { title: 'Харизма', text: 'Убедить старика говорить прямо', meta: '+4 · пример · DC 12' },
      { title: 'Разум', text: 'Сопоставить герб и старые записи', meta: '+1 · пример · DC 14' },
    ],
  },
  scifi: {
    currency: '4% резерва',
    inventory: [
      { id: 'nav-key', icon: '⌁', name: 'Ключ навигации', category: 'key', categoryLabel: 'Доступ', rarity: 'rare', rarityLabel: 'Редкий', quantity: 1, condition: 'Заблокирован', weight: '0.1 кг', description: 'Физический ключ капитана. Вернет доступ к карте прыжка после сверки личности.', inspect: 'На корпусе мигает чужой идентификатор допуска.', text: 'Я прикладываю Ключ навигации к панели шлюза.' },
      { id: 'frost-log', icon: '▤', name: 'Фрагмент журнала', category: 'artifact', categoryLabel: 'Данные', rarity: 'epic', rarityLabel: 'Эпический', quantity: 1, condition: 'Поврежден', weight: '0 кг', description: 'Последние секунды перед исчезновением экипажа записаны с временным сдвигом.', inspect: 'В шуме слышен второй голос, которого нет в реестре.', text: 'Я сверяю Фрагмент журнала с ответами Кассандры.' },
      { id: 'repair-foam', icon: '✚', name: 'Ремонтная пена', category: 'consumable', categoryLabel: 'Расходник', rarity: 'common', rarityLabel: 'Обычный', quantity: 2, condition: 'Стабильна', weight: '0.8 кг', description: 'Закрывает трещины в обшивке до конца сцены.', inspect: 'Баллон еще теплый от аварийного отсека.', text: 'Я герметизирую трещину Ремонтной пеной.' },
    ],
    journal: [
      { title: 'Кассандра', meta: 'Системы · сцена 02', text: 'Утверждает, что твое имя отсутствует в журнале экипажа.' },
      { title: 'Сектор D-17', meta: 'Места · локальный пример', text: 'Шлюз открыт, а на стекле иней с внутренней стороны.' },
    ],
    checks: [
      { title: 'Инженерия', text: 'Изолировать аварийную шину', meta: '+3 · пример · DC 14' },
      { title: 'Анализ', text: 'Найти сдвиг во временной метке', meta: '+4 · пример · DC 13' },
    ],
  },
  hist: {
    currency: '12 денариев',
    inventory: [
      { id: 'wax-tablet', icon: '▤', name: 'Восковая табличка', category: 'key', categoryLabel: 'Доказательство', rarity: 'epic', rarityLabel: 'Эпический', quantity: 1, condition: 'Запечатана', weight: '0.2 кг', description: 'Список имен тех, кто наживается на гладиаторской школе.', inspect: 'Печать Батиата треснула, но не сломана.', text: 'Я прячу Восковую табличку под ремень.' },
      { id: 'arena-knife', icon: '†', name: 'Арена-нож', category: 'weapon', categoryLabel: 'Оружие', rarity: 'common', rarityLabel: 'Обычный', quantity: 1, condition: 'Заточен', weight: '0.4 кг', description: 'Неприметный нож кухонного раба.', inspect: 'На рукояти вырезан знак твоей когорты.', text: 'Я достаю Арена-нож и перерезаю веревку.' },
      { id: 'camp-token', icon: '⚜', name: 'Жетон кузнеца', category: 'artifact', categoryLabel: 'Знак', rarity: 'rare', rarityLabel: 'Редкий', quantity: 1, condition: 'Скрыт', weight: '0.1 кг', description: 'Позволит войти в лагерь через кузницу до рассвета.', inspect: 'Металл пахнет углем и маслом.', text: 'Я показываю Жетон кузнеца у дальнего костра.' },
    ],
    journal: [
      { title: 'Марк Лициний', meta: 'Союзники · сцена 02', text: 'Знает путь к кузнице, но проверяет твою осторожность.' },
      { title: 'Восковая табличка', meta: 'Предметы · локальный пример', text: 'Содержит имена покровителей школы Батиата.' },
    ],
    checks: [
      { title: 'Скрытность', text: 'Пройти мимо костров без лишнего взгляда', meta: '+3 · пример · DC 13' },
      { title: 'Убеждение', text: 'Заставить Марка выбрать сторону', meta: '+2 · пример · DC 14' },
    ],
  },
  post: {
    currency: '3 контакта',
    inventory: [
      { id: 'future-audio', icon: '≋', name: 'Запись будущего эфира', category: 'artifact', categoryLabel: 'Данные', rarity: 'legendary', rarityLabel: 'Критическая', quantity: 1, condition: 'Зашифрована', weight: '0 кг', description: 'Аудиофайл с твоим голосом и признанием в еще не совершенном преступлении.', inspect: 'В спектрограмме есть шум служебного лифта.', text: 'Я запускаю спектральный анализ Записи будущего эфира.' },
      { id: 'press-pass', icon: '◒', name: 'Пресс-пропуск', category: 'key', categoryLabel: 'Доступ', rarity: 'rare', rarityLabel: 'Редкий', quantity: 1, condition: 'Активен', weight: '0.1 кг', description: 'Открывает служебные коридоры редакции.', inspect: 'На чипе есть незнакомая метка гостевого доступа.', text: 'Я использую Пресс-пропуск, чтобы открыть архив станции.' },
      { id: 'burner-phone', icon: '☎', name: 'Телефон-однодневка', category: 'consumable', categoryLabel: 'Связь', rarity: 'common', rarityLabel: 'Обычный', quantity: 1, condition: 'Без сети', weight: '0.2 кг', description: 'Аппарат для одного вызова.', inspect: 'Экран показывает сообщение без отправителя.', text: 'Я включаю Телефон-однодневку и жду сеть.' },
    ],
    journal: [
      { title: 'Лера Орлова', meta: 'Персонажи · сцена 02', text: 'Ее брат отмечен в утечке как следующий источник.' },
      { title: 'Будущий эфир', meta: 'Данные · локальный пример', text: 'Запись содержит твой голос и упоминание завтрашнего пожара.' },
    ],
    checks: [
      { title: 'Расследование', text: 'Найти метаданные поддельной записи', meta: '+4 · пример · DC 13' },
      { title: 'Самообладание', text: 'Не выдать страх в прямом эфире', meta: '+2 · пример · DC 12' },
    ],
  },
}
