import type { BoxSize, Flavour } from '../types'

/** Price is driven by the sweet/savoury mix, matching the wireframe rules. */
export function calcBoxPrice(size: BoxSize, slots: Array<string | null>, flavours: Flavour[]): number {
  const ids = slots.filter(Boolean) as string[]
  const byId = new Map(flavours.map(f => [f.id, f]))
  const sweet = ids.filter(id => byId.get(id)?.type === 'sweet').length
  const savoury = ids.filter(id => byId.get(id)?.type === 'savoury').length

  if (size === 'small') {
    if (savoury === 0) return 5
    if (sweet === 0) return 7
    return 6
  }
  if (savoury === 0) return 9
  if (sweet === 0) return 13
  return 12
}

export function maxFlavoursFor(size: BoxSize): number {
  return size === 'small' ? 2 : 4
}

export function boxTypeLabel(size: BoxSize, slots: Array<string | null>, flavours: Flavour[]): string {
  const ids = slots.filter(Boolean) as string[]
  const byId = new Map(flavours.map(f => [f.id, f]))
  const sweet = ids.filter(id => byId.get(id)?.type === 'sweet').length
  const savoury = ids.filter(id => byId.get(id)?.type === 'savoury').length
  const kind = sweet === 0 && savoury > 0 ? 'savoury' : savoury === 0 ? 'sweet' : 'combo'
  return `${size === 'small' ? 'Small' : 'Large'} ${kind} box`
}

/** Mirrors the wireframe's pick rules: slot cap, unique-flavour cap, combo half-cap. */
export function canPickFlavour(
  size: BoxSize,
  slots: Array<string | null>,
  flavours: Flavour[],
  flavourId: string,
): boolean {
  const filled = slots.filter(Boolean) as string[]
  if (filled.includes(flavourId)) return true
  if (filled.length >= slots.length || filled.length >= (size === 'small' ? 4 : 8)) return false

  const unique = new Set(filled)
  if (unique.size >= maxFlavoursFor(size)) return false

  const flavour = flavours.find(f => f.id === flavourId)
  if (!flavour) return false

  const byId = new Map(flavours.map(f => [f.id, f]))
  const half = (size === 'small' ? 4 : 8) / 2
  const sweetSlots = filled.filter(id => byId.get(id)?.type === 'sweet').length
  const savSlots = filled.filter(id => byId.get(id)?.type === 'savoury').length

  if (flavour.type === 'sweet' && savSlots > 0 && sweetSlots >= half) return false
  if (flavour.type === 'savoury' && sweetSlots > 0 && savSlots >= half) return false
  return true
}

/** Collapse slots into `{ flavourId: count }` for compact order tags. */
export function summariseBox(slots: Array<string | null>): Array<{ id: string; qty: number }> {
  const counts = new Map<string, number>()
  for (const id of slots) {
    if (!id) continue
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return [...counts.entries()].map(([id, qty]) => ({ id, qty }))
}
