import type { Slot } from './prices'

const HOUR = 3_600_000

// Illustrative prices in EUR/MWh (not real market data): cheap midday solar dip, evening peak.
const SAMPLE_EUR_PER_MWH = [
  92, 88, 85, 84, 86, 95, 118, 142, 128, 104, 82, 61, 48, 41, 45, 58, 88, 126, 162, 171, 148, 121, 104, 96,
]

/** One sample day starting at today's local midnight (Europe/Berlin). */
export function makeSampleDay(now = Date.now()): Slot[] {
  const hourNow = Number(
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Berlin' }).format(now),
  )
  const midnight = Math.floor(now / HOUR) * HOUR - hourNow * HOUR
  return SAMPLE_EUR_PER_MWH.map((eurPerMwh, i) => ({
    start: midnight + i * HOUR,
    end: midnight + (i + 1) * HOUR,
    eurPerMwh,
  }))
}
