import { describe, it, expect } from 'vitest'
import { sortByOrder, getNextItem, filterFeatured, localeEntries } from '../src/lib/content'

const items = [
  { data: { order: 3, featured: true, slug: 'c' } },
  { data: { order: 1, featured: true, slug: 'a' } },
  { data: { order: 2, featured: false, slug: 'b' } },
]

describe('sortByOrder', () => {
  it('sorts items ascending by data.order', () => {
    const sorted = sortByOrder(items)
    expect(sorted.map(i => i.data.slug)).toEqual(['a', 'b', 'c'])
  })
})

describe('filterFeatured', () => {
  it('returns only items with data.featured === true', () => {
    const featured = filterFeatured(items)
    expect(featured.map(i => i.data.slug)).toEqual(['c', 'a'])
  })
})

describe('getNextItem', () => {
  it('returns the next item after the given slug in sort order', () => {
    const sorted = sortByOrder(items)
    expect(getNextItem(sorted, 'a')?.data.slug).toBe('b')
  })
  it('wraps around at the end', () => {
    const sorted = sortByOrder(items)
    expect(getNextItem(sorted, 'c')?.data.slug).toBe('a')
  })
  it('returns null when list is empty', () => {
    expect(getNextItem([], 'a')).toBeNull()
  })
})

describe('localeEntries', () => {
  const entries = [
    { id: 'id/01-quick-transfer', data: { slug: 'quick-transfer' } },
    { id: 'en/01-quick-transfer', data: { slug: 'quick-transfer' } },
    { id: 'id/02-voucher-points-banner', data: { slug: 'voucher-points-banner' } },
  ]

  it('keeps only entries whose id is prefixed with the given locale', () => {
    expect(localeEntries(entries, 'id').map(e => e.id)).toEqual([
      'id/01-quick-transfer',
      'id/02-voucher-points-banner',
    ])
    expect(localeEntries(entries, 'en').map(e => e.id)).toEqual(['en/01-quick-transfer'])
  })
})
