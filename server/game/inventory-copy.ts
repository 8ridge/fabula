import type { InventoryItemProjection } from '../../shared/game'

const ACQUISITION_DESTINATION_SUFFIX = /\s+(?:(?:к\s+)?себе(?:\s+(?:в|во)\s+(?:свой\s+)?(?:инвентарь|рюкзак|сумку|карман|рук(?:у|и)?))?|с\s+собой|(?:в|во)\s+(?:свой\s+)?(?:инвентарь|рюкзак|сумку|карман|рук(?:у|и)?)|как\s+предмет\s+(?:в|во)\s+(?:свой\s+)?инвентарь)\s*[.!?]*$/iu

export function stripAcquisitionDestination(value: string): string {
  let result = value.trim()
  while (result) {
    const next = result.replace(ACQUISITION_DESTINATION_SUFFIX, '').trim()
    if (next === result)
      return result
    result = next
  }
  return result
}

export function acquisitionDisplayName(reference: string): string {
  const words = stripAcquisitionDestination(reference).split(/\s+/).filter(Boolean)
  if (!words.length)
    return ''
  const first = words[0]!.toLocaleLowerCase('ru')
  const normalizedFirst = first.endsWith('ку')
    ? `${first.slice(0, -2)}ка`
    : first.endsWith('гу')
      ? `${first.slice(0, -2)}га`
      : first.endsWith('ю')
        ? `${first.slice(0, -1)}я`
        : first.endsWith('у')
          ? `${first.slice(0, -1)}а`
          : first
  const normalized = [normalizedFirst, ...words.slice(1)].join(' ').slice(0, 160)
  return normalized.charAt(0).toLocaleUpperCase('ru') + normalized.slice(1)
}

export function acquisitionDescription(evidence: string): string {
  return evidence.replace(/\s+/g, ' ').trim().slice(0, 700)
}

export function worldEventItemStory(locationName: string): string {
  return `Ты забрал этот предмет с собой в локации «${locationName}».`
}

export function startingEquipmentItemStory(): string {
  return 'Это часть твоего привычного снаряжения.'
}

export function normalizeInventoryItemCopy(item: InventoryItemProjection): void {
  if (item.provenance.kind === 'starting_equipment') {
    if (/^Начальный предмет роли/u.test(item.provenance.summary))
      item.provenance.summary = startingEquipmentItemStory()
    return
  }
  if (item.provenance.kind === 'legacy_snapshot') {
    if (/учета происхождения/u.test(item.provenance.summary))
      item.provenance.summary = 'Этот предмет был у тебя с самого начала.'
    return
  }
  if (item.provenance.kind !== 'world_event')
    return

  item.name = acquisitionDisplayName(item.name)
  const legacyDescription = /^Переносимый предмет из текущей сцены\. Подтверждение:\s*(.+)$/su.exec(item.description)
  if (legacyDescription?.[1])
    item.description = acquisitionDescription(legacyDescription[1])
  if (/^Появление предмета подтверждено событием в локации/u.test(item.provenance.summary))
    item.provenance.summary = worldEventItemStory(item.location_name)
}
