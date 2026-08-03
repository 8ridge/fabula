import type { GameMessage, InventoryItemProjection, SuggestedAction } from '../../shared/game'

function normalizedWords(value: string): Set<string> {
  return new Set(value
    .normalize('NFKC')
    .replaceAll('ё', 'е')
    .toLocaleLowerCase('ru')
    .match(/[\p{L}\p{N}]+/gu) || [])
}

function wordStem(word: string): string {
  const endings = ['иями', 'ями', 'ами', 'ого', 'ему', 'ому', 'ах', 'ях', 'ом', 'ем', 'ой', 'ей', 'ам', 'ям', 'ов', 'ев', 'ы', 'и', 'а', 'я', 'у', 'ю', 'е']
  const ending = endings.find(candidate =>
    word.endsWith(candidate) && word.length - candidate.length >= 4)
  return ending ? word.slice(0, -ending.length) : word
}

function mentionsUnavailableItem(
  suggestion: SuggestedAction,
  inventory: InventoryItemProjection[],
): boolean {
  const suggestionWords = normalizedWords(`${suggestion.label} ${suggestion.intent_hint}`)
  const suggestionStems = new Set([...suggestionWords].map(wordStem))
  return inventory
    .filter(item => item.condition === 'spent' || item.quantity <= 0 || item.charges === 0)
    .some(item => [...normalizedWords(item.name)]
      .filter(word => word.length >= 4)
      .some(itemWord => suggestionStems.has(wordStem(itemWord))))
}

function contradictsRecentNarrative(suggestion: SuggestedAction, recentNarrative: string): boolean {
  const action = `${suggestion.label} ${suggestion.intent_hint}`
    .replaceAll('ё', 'е')
    .toLocaleLowerCase('ru')
  const narrative = recentNarrative
    .replaceAll('ё', 'е')
    .toLocaleLowerCase('ru')

  const assumesUnheardConversation = /(?:разговор|голос|реплик)/u.test(action)
    && !/(?:разговор|голос|реплик|говорит|говорят|сказал|сказала|шепч)/u.test(narrative)
  if (assumesUnheardConversation)
    return true

  const consequenceWasOutside = /(?:из окна|за окном|с улиц|на улиц|снаруж|наружу|во двор|дома напротив)/u.test(narrative)
  const movesDebrisInside = /оскол\p{L}*/u.test(action)
    && /(?:на полу|под ногами|в комнате|в квартире)/u.test(action)
  return consequenceWasOutside && movesDebrisInside
}

export function filterContextualSuggestions(
  suggestions: SuggestedAction[],
  inventory: InventoryItemProjection[],
  messages: GameMessage[],
): SuggestedAction[] {
  const recentNarrative = messages
    .filter(message => message.role === 'narrator')
    .slice(-2)
    .map(message => message.text)
    .join('\n')

  return suggestions.filter(suggestion =>
    !mentionsUnavailableItem(suggestion, inventory)
    && !contradictsRecentNarrative(suggestion, recentNarrative))
}
