type Item<T> = { data: T & { order: number; featured?: boolean; slug: string } }

export function sortByOrder<T>(items: Item<T>[]): Item<T>[] {
  return [...items].sort((a, b) => a.data.order - b.data.order)
}

export function filterFeatured<T>(items: Item<T>[]): Item<T>[] {
  return items.filter(i => i.data.featured === true)
}

export function getNextItem<T>(items: Item<T>[], slug: string): Item<T> | null {
  if (items.length === 0) return null
  const idx = items.findIndex(i => i.data.slug === slug)
  if (idx === -1) return null
  return items[(idx + 1) % items.length]
}

export function localeEntries<T>(
  items: { id: string; data: T }[],
  locale: 'id' | 'en',
): { id: string; data: T }[] {
  return items.filter(item => item.id.startsWith(`${locale}/`))
}
