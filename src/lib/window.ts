import type { Slot } from './prices'

export interface PriceWindow {
  startIndex: number
  length: number
  avgEurPerMwh: number
}

/**
 * Cheapest block of `length` consecutive slots (by average price).
 * Blocks that would bridge a gap in the data are skipped.
 */
export function cheapestWindow(slots: Slot[], length: number): PriceWindow | null {
  if (length < 1 || length > slots.length) return null
  let best: PriceWindow | null = null
  for (let i = 0; i + length <= slots.length; i++) {
    let sum = 0
    let contiguous = true
    for (let j = 0; j < length; j++) {
      if (j > 0 && slots[i + j].start !== slots[i + j - 1].end) {
        contiguous = false
        break
      }
      sum += slots[i + j].eurPerMwh
    }
    if (!contiguous) continue
    const avg = sum / length
    if (best === null || avg < best.avgEurPerMwh) {
      best = { startIndex: i, length, avgEurPerMwh: avg }
    }
  }
  return best
}

export const average = (slots: Slot[]): number =>
  slots.length === 0 ? 0 : slots.reduce((sum, s) => sum + s.eurPerMwh, 0) / slots.length
