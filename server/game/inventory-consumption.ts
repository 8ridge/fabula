export function explicitlyLosesSelectedItem(text: string): boolean {
  const normalized = text.replaceAll('ё', 'е').toLocaleLowerCase('ru')
  const irreversibleVerb = /(?:выброс\p{L}*|выкин\p{L}*|брос\p{L}*|брош\p{L}*|швыр\p{L}*|метн\p{L}*|разоб\p{L}*|слом\p{L}*|сожг\p{L}*|сжеч\p{L}*|сжиг\p{L}*|уничтож\p{L}*|разорв\p{L}*|взорв\p{L}*|вып(?:ить|ью|ьешь|ьет|ьем|ьете|ьют|ил(?:а|и)?|иваю|иваешь|ивает|иваем|иваете|ивают)|съе\p{L}*|проглот\p{L}*)/giu

  for (const match of normalized.matchAll(irreversibleVerb)) {
    const index = match.index ?? 0
    const prefix = normalized.slice(Math.max(0, index - 24), index)
    if (/(?:не|не\s+(?:буду|стану|хочу))\s*$/u.test(prefix))
      continue
    return true
  }
  return false
}

export function confirmsIrreversibleItemLoss(text: string): boolean {
  const normalized = text.replaceAll('ё', 'е').toLocaleLowerCase('ru')
  return /(?:разбив\p{L}*|разбит\p{L}*|оскол\p{L}*|сгор\p{L}*|сожжен\p{L}*|уничтожен\p{L}*|разорван\p{L}*|взорван\p{L}*|проглочен\p{L}*|съеден\p{L}*|выпит\p{L}*|больше\s+(?:у\s+тебя\s+)?(?:его|ее|предмета)?\s*нет|не\s+остается\s+у\s+тебя)/iu.test(normalized)
}
