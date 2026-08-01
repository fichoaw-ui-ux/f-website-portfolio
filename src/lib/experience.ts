/**
 * True when an experience entry's year range describes an ongoing role,
 * e.g. "2024 — Now" or "2024 — Present". Used to render a `Currently` badge.
 */
export function isCurrentRole(year: string): boolean {
  return /\b(now|present)\b/i.test(year)
}
