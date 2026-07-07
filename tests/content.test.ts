import { describe, it, expect } from 'vitest'
import { sortByOrder, getNextItem, filterFeatured } from '../src/lib/content'

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
