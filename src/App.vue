<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PriceChart from './components/PriceChart.vue'
import { ctPerKwh, fetchDayAhead, type Slot } from './lib/prices'
import { average, cheapestWindow } from './lib/window'
import { makeSampleDay } from './lib/sample'
import { fmtDay, fmtTime } from './lib/format'

const HOUR = 3_600_000
const slots = ref<Slot[]>([])
const source = ref<'live' | 'sample'>('live')
const hours = ref(3)
const kw = ref(50)
const loading = ref(true)

async function load() {
  const demo = new URLSearchParams(location.search).has('demo')
  if (!demo) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)
    try {
      slots.value = await fetchDayAhead(ctrl.signal)
      source.value = 'live'
      return
    } catch {
      // fall through to the sample day
    } finally {
      clearTimeout(timer)
    }
  }
  slots.value = makeSampleDay()
  source.value = 'sample'
}

async function init() {
  try {
    await load()
  } finally {
    loading.value = false
  }
}
onMounted(init)

// Live mode only looks at hours that have not started yet; the sample day is shown in full.
const shown = computed(() => {
  if (source.value === 'sample') return slots.value
  const from = Math.floor(Date.now() / HOUR) * HOUR
  return slots.value.filter((s) => s.start >= from)
})

const best = computed(() => cheapestWindow(shown.value, hours.value))
const dayAvg = computed(() => average(shown.value))

const summary = computed(() => {
  const w = best.value
  if (!w) return null
  const first = shown.value[w.startIndex]
  const last = shown.value[w.startIndex + w.length - 1]
  const kwh = kw.value * hours.value
  const costBest = (kwh * ctPerKwh(w.avgEurPerMwh)) / 100
  const costAvg = (kwh * ctPerKwh(dayAvg.value)) / 100
  return {
    range: `${fmtTime(first.start)}–${fmtTime(last.end)}`,
    day: fmtDay(first.start),
    windowAvg: ctPerKwh(w.avgEurPerMwh),
    dayAvg: ctPerKwh(dayAvg.value),
    saving: costAvg - costBest,
    kwh,
  }
})
</script>

<template>
  <main>
    <h1>Cheapest hours</h1>
    <p class="sub">Day-ahead electricity price in Germany: find the best block of hours to run a machine.</p>

    <p v-if="source === 'sample'" class="banner">
      Showing illustrative sample data (demo mode, or the live price API could not be reached).
    </p>

    <section class="controls">
      <label>
        Run time
        <input v-model.number="hours" type="range" min="1" max="8" />
        <span>{{ hours }} h</span>
      </label>
      <label>
        Machine power
        <input v-model.number="kw" type="number" min="1" />
        <span>kW</span>
      </label>
    </section>

    <p v-if="loading" class="banner">Loading day-ahead prices…</p>

    <section v-else-if="summary" class="cards">
      <div class="card">
        <div class="k">Best time to run</div>
        <div class="v good">{{ summary.range }}</div>
        <div class="s">{{ summary.day }}</div>
      </div>
      <div class="card">
        <div class="k">Price in that block</div>
        <div class="v">{{ summary.windowAvg.toFixed(1) }} ct/kWh</div>
        <div class="s">average of all hours: {{ summary.dayAvg.toFixed(1) }} ct/kWh</div>
      </div>
      <div class="card">
        <div class="k">Saved vs. average price</div>
        <div class="v good">€{{ summary.saving.toFixed(2) }}</div>
        <div class="s">for {{ summary.kwh }} kWh</div>
      </div>
    </section>
    <p v-else class="banner">Not enough consecutive hours of price data for a {{ hours }} h run.</p>

    <PriceChart v-if="!loading" :slots="shown" :window-start="best ? best.startIndex : null" :window-length="hours" />

    <footer>Exchange price only: grid fees, taxes and levies are not included. Prices: aWATTar day-ahead market data.</footer>
  </main>
</template>
