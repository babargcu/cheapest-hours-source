export interface Slot {
  start: number // ms since epoch
  end: number
  eurPerMwh: number
}

interface RawSlot {
  start_timestamp: number
  end_timestamp: number
  marketprice: number
}

export const ctPerKwh = (eurPerMwh: number): number => eurPerMwh / 10

/** Public day-ahead prices for Germany (today, plus tomorrow once published). */
export async function fetchDayAhead(signal?: AbortSignal): Promise<Slot[]> {
  const res = await fetch('https://api.awattar.de/v1/marketdata', { signal })
  if (!res.ok) throw new Error(`Price API returned HTTP ${res.status}`)
  const json = (await res.json()) as { data: RawSlot[] }
  return json.data.map((d) => ({
    start: d.start_timestamp,
    end: d.end_timestamp,
    eurPerMwh: d.marketprice,
  }))
}
