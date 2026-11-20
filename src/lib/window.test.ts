import { describe, expect, it } from 'vitest'
import { average, cheapestWindow } from './window'
import type { Slot } from './prices'

const HOUR = 3_600_000
const hourly = (prices: number[], from = 0): Slot[] =>
  prices.map((p, i) => ({ start: from + i * HOUR, end: from + (i + 1) * HOUR, eurPerMwh: p }))

describe('cheapestWindow', () => {
  it('finds the cheapest consecutive block', () => {
    const w = cheapestWindow(hourly([50, 40, 10, 12, 60]), 2)
    expect(w).toEqual({ startIndex: 2, length: 2, avgEurPerMwh: 11 })
  })

  it('works for a single hour', () => {
    expect(cheapestWindow(hourly([30, 20, 25]), 1)?.startIndex).toBe(1)
  })

  it('handles negative prices', () => {
    const w = cheapestWindow(hourly([5, -20, -10, 30]), 2)
    expect(w?.startIndex).toBe(1)
    expect(w?.avgEurPerMwh).toBe(-15)
  })

  it('returns null when the block is longer than the data', () => {
    expect(cheapestWindow(hourly([1, 2]), 3)).toBeNull()
  })

  it('does not bridge gaps in the data', () => {
    const slots = [...hourly([10, 10]), ...hourly([90, 90], 5 * HOUR)]
    expect(cheapestWindow(slots, 3)).toBeNull()
    expect(cheapestWindow(slots, 2)?.startIndex).toBe(0)
  })
})

describe('average', () => {
  it('averages prices and copes with empty input', () => {
    expect(average(hourly([10, 20, 30]))).toBe(20)
    expect(average([])).toBe(0)
  })
})
