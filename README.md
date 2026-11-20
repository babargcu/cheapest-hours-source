# Cheapest hours

A small Vue 3 + TypeScript page that shows the hourly day-ahead electricity price for Germany and finds the
cheapest block of consecutive hours to run a machine of a given length and power, including the cost saved
compared with the average price.

- Live prices come from the public aWATTar API (today, plus tomorrow once published).
- If the API cannot be reached, or with `?demo` in the URL, an illustrative sample day is shown and labelled.
- Prices are exchange prices only: grid fees, taxes and levies are not included.
- The window search (`src/lib/window.ts`) is unit-tested with Vitest; the chart is hand-written SVG.

```
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

Built with Claude Code.
