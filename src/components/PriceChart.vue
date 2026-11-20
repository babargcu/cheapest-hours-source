<script setup lang="ts">
import { computed, ref } from 'vue'
import { ctPerKwh, type Slot } from '../lib/prices'
import { fmtDay, fmtTime } from '../lib/format'

const props = defineProps<{ slots: Slot[]; windowStart: number | null; windowLength: number }>()
const hovered = ref<number | null>(null)

const W = 960
const H = 340
const m = { l: 46, r: 10, t: 24, b: 30 }
const iw = W - m.l - m.r
const ih = H - m.t - m.b

const values = computed(() => props.slots.map((s) => ctPerKwh(s.eurPerMwh)))

const axis = computed(() => {
  const lo = Math.min(0, ...values.value)
  const hi = Math.max(0, ...values.value)
  const range = hi - lo
  const step = range > 20 ? 5 : range > 10 ? 2 : 1
  const min = Math.floor(lo / step) * step
  let max = Math.ceil(hi / step) * step
  if (max === min) max = min + step // avoid a zero-height axis (no data yet)
  const ticks: number[] = []
  for (let t = min; t <= max + 1e-9; t += step) ticks.push(t)
  return { min, max, ticks }
})

const y = (v: number) => m.t + ih * (1 - (v - axis.value.min) / (axis.value.max - axis.value.min))
const slotW = computed(() => iw / Math.max(props.slots.length, 1))

const bars = computed(() =>
  props.slots.map((_, i) => {
    const v = values.value[i]
    const top = y(Math.max(v, 0))
    const bottom = y(Math.min(v, 0))
    const inWindow =
      props.windowStart !== null && i >= props.windowStart && i < props.windowStart + props.windowLength
    return {
      i,
      x: m.l + i * slotW.value + slotW.value * 0.11,
      w: slotW.value * 0.78,
      y: top,
      h: Math.max(bottom - top, 1),
      inWindow,
    }
  }),
)

const labelEvery = computed(() => (props.slots.length > 30 ? 3 : 2))
const labels = computed(() =>
  props.slots
    .map((s, i) => ({ i, text: fmtTime(s.start).slice(0, 2) }))
    .filter((l) => l.i % labelEvery.value === 0),
)

const readout = computed(() => {
  const i = hovered.value
  if (i === null) return 'Hover a bar to see the price for that hour.'
  const s = props.slots[i]
  return `${fmtDay(s.start)} · ${fmtTime(s.start)}–${fmtTime(s.end)} · ${values.value[i].toFixed(1)} ct/kWh`
})
</script>

<template>
  <div class="chart">
    <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="Hourly day-ahead electricity price in cents per kilowatt hour">
      <text x="4" y="12" class="tick">ct/kWh</text>
      <g v-for="t in axis.ticks" :key="t">
        <line :x1="m.l" :x2="W - m.r" :y1="y(t)" :y2="y(t)" :class="t === 0 ? 'zero' : 'grid'" />
        <text :x="m.l - 8" :y="y(t) + 4" text-anchor="end" class="tick">{{ t }}</text>
      </g>
      <rect
        v-if="windowStart !== null"
        class="band"
        :x="m.l + windowStart * slotW"
        :y="m.t"
        :width="windowLength * slotW"
        :height="ih"
      />
      <rect
        v-for="b in bars"
        :key="b.i"
        :x="b.x"
        :y="b.y"
        :width="b.w"
        :height="b.h"
        rx="2"
        :class="['bar', { win: b.inWindow, hov: hovered === b.i }]"
      />
      <text v-for="l in labels" :key="l.i" :x="m.l + l.i * slotW + slotW / 2" :y="H - 10" text-anchor="middle" class="tick">
        {{ l.text }}
      </text>
      <rect
        v-for="(_, i) in slots"
        :key="`hit-${i}`"
        class="hit"
        :x="m.l + i * slotW"
        :y="m.t"
        :width="slotW"
        :height="ih"
        @mouseenter="hovered = i"
        @mouseleave="hovered = null"
      />
    </svg>
    <p class="readout">{{ readout }}</p>
    <p class="legend">
      <span><i style="background: #1e7b7b" />Cheapest block</span>
      <span><i style="background: #a9bcd0" />Other hours</span>
      <span>Hour of day (Europe/Berlin)</span>
    </p>
  </div>
</template>

<style scoped>
.chart { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 14px 14px 8px; }
svg { width: 100%; height: auto; display: block; }
.grid { stroke: #e3e8ee; }
.zero { stroke: #8795a6; }
.tick { font-size: 12px; fill: #5f6b7a; }
.band { fill: #e3f1f1; }
.bar { fill: #a9bcd0; }
.bar.win { fill: #1e7b7b; }
.bar.hov { fill: #1f3a63; }
.hit { fill: transparent; }
.readout { margin: 6px 6px 2px; color: var(--grey); font-size: 14px; min-height: 22px; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 13px; color: var(--grey); margin: 0 6px 6px; }
.legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; }
</style>
