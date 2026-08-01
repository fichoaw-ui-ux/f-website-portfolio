import { describe, it, expect } from 'vitest'
import { isCurrentRole } from '../src/lib/experience'

describe('isCurrentRole', () => {
  it('returns true for a year range ending in "Now"', () => {
    expect(isCurrentRole('2024 — Now')).toBe(true)
  })

  it('is case insensitive', () => {
    expect(isCurrentRole('2024 — NOW')).toBe(true)
    expect(isCurrentRole('2024 — now')).toBe(true)
  })

  it('returns true for "Present" as well', () => {
    expect(isCurrentRole('2024 — Present')).toBe(true)
  })

  it('returns false for a closed year range', () => {
    expect(isCurrentRole('2022 — 2024')).toBe(false)
  })

  it('does not match "Now" inside an unrelated word', () => {
    expect(isCurrentRole('2019 — Nowhere')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isCurrentRole('')).toBe(false)
  })
})
