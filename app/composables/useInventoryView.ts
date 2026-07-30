import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { InventoryItemView } from '~/types/inventory'

export function useInventoryView(
  items: Ref<InventoryItemView[]> | ComputedRef<InventoryItemView[]>,
) {
  const query = ref('')
  const activeCategory = ref<string | null>(null)

  const categories = computed(() => {
    const byId = new Map<string, string>()

    for (const item of items.value)
      byId.set(item.category, item.categoryLabel)

    return [...byId.entries()].map(([id, label]) => ({ id, label }))
  })

  const filteredItems = computed(() => {
    const needle = query.value.trim().toLocaleLowerCase('ru')

    return items.value.filter((item) => {
      const categoryMatches = !activeCategory.value || item.category === activeCategory.value
      const searchableText = [
        item.name,
        item.description,
        item.categoryLabel,
        item.conditionLabel,
        item.location_name,
        item.holder_name,
      ].join(' ').toLocaleLowerCase('ru')

      return categoryMatches && (!needle || searchableText.includes(needle))
    })
  })

  function resetFilters() {
    query.value = ''
    activeCategory.value = null
  }

  return {
    query,
    activeCategory,
    categories,
    filteredItems,
    resetFilters,
  }
}
