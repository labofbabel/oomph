# Oomph

**O**rders **O**f **M**agnitude. Oomph is a drag-to-navigate control for numbers
far too big for a slider. It stacks bands of ticks. Each band moves the value by
a different power of the base, and the value stays an exact `BigInt`.

One ES module with no dependencies. **[Live workbench →](https://labofbabel.github.io/oomph/)**
The workbench prints the constructor call for whatever you configure.

## Install

```sh
npm install @labofbabel/oomph
```

To vendor it instead, copy `oomph.js` into your project. It is a single
self-contained file, and `index.js` only re-exports it. A minified copy ships in
the npm package as `@labofbabel/oomph/oomph.min.js`, and `npm run build` creates
it at `dist/oomph.min.js`.

## Usage

```html
<div id="ruler" style="height: 140px"></div>
<script type="module">
  import { Oomph } from '@labofbabel/oomph'; // or './oomph.js'

  const ruler = new Oomph('#ruler', { value: 0n, rulers: 5, base: 10, exponentGap: 3 });
  ruler.onChange((value, meta) => console.log(value, meta));
</script>
```

Oomph takes over the element you give it. It adds the `.oomph` class and
renders inside it. You size and place the element. Default styles are injected
once per page.

Band `n` steps by `base ** (n * exponentGap)`. For example, `base: 10,
exponentGap: 3` gives bands of 1, 10³, 10⁶ and so on.

## Options

| Option | Default | |
| --- | --- | --- |
| `value` | `0n` | Initial value: a BigInt, a number or a numeric string. |
| `mode` | `'bigint'` | `'bigint'` or `'float64'`. Float64 is experimental and allows fractional and negative `exponentGap`. |
| `min`, `max` | `null` | Optional bounds. |
| `rulers` | `5` | Number of bands, `1 … 10`. |
| `base` | `10` | Step ratio between bands, `1 … 64`. It also sets the display radix and the tick rhythm. |
| `exponentGap` | `1` | Powers of `base` between adjacent bands. In bigint mode it must be a positive integer, up to `40`. |
| `orientation` | `'bottom'` | `'top'`, `'bottom'`, `'left'` or `'right'`. |
| `unitPosition` | `'inside'` | `'inside'` or `'outside'`: which side the unit band sits on. |
| `defer` | `100` | `onChange` debounce in ms, or `'release'`. |
| `pixelsPerUnit` | `1` | Pointer travel per unit. |
| `tickGap` | `10` | Pixels between minor ticks. |
| `tickGapStep` | `0` | Extra pixels between notches for each band up the stack. Band `n` is drawn with notches `tickGap + n * tickGapStep` apart. Takes `0 … 100` and accepts fractions. |
| `midTickEvery`, `majorTickEvery`, `visualCycleEvery` | `'auto'` | Tick rhythm in multiples of `tickGap`. With `'auto'`, the rhythm comes from `base`. |
| `layerSize` | `32` | Thickness of the first band in px, `8 … 120`. |
| `layerSizeStep` | `-4` | Change in thickness for each band, `-20 … 20`. |
| `displayRadix` | `'base'` | Radix of the readout, `2 … 36`. |
| `digits` | `null` | Custom digit alphabet, for a display radix above 36. Bigint mode only. |
| `padTo` | `0` | Minimum number of readout digits. |
| `showTooltip`, `showLabels`, `showGap` | `true`, `false`, `false` | Toggles for the tooltip, band labels and gap badge. |
| `style` | `null` | See [Styling](#styling). |
| `injectStyles` | `true` | Set to `false` to supply all CSS yourself. |

A band with a wider `tickGapStep` only looks bigger. It still steps by its own
power, and its notches stay under the pointer while you drag.

## API

```js
ruler.getValue()                       // BigInt, or Number in float64 mode
ruler.getValueText()                   // value as displayed (radix, digits, padding)
ruler.setValue(value, { sync, silent, sourceLayer })
ruler.setOptions(options)              // any option from the table above
ruler.onInput(fn)                      // fires on every drag step; returns an unsubscribe function
ruler.onChange(fn)                     // fires after `defer`; returns an unsubscribe function
ruler.destroy()
```

Handlers receive `(value, meta)`, where `meta` is `{ source, layer, delta, timestamp }`.

`setValue` options:

- `sync: true` snaps every band to its canonical position.
- `silent: true` skips `onChange`.
- `sourceLayer` animates the change as if that band had been dragged. This is
  useful for linking rulers:

```js
a.onInput((value, meta) => b.setValue(value, { sync: true, silent: true, sourceLayer: meta.layer }));
```

There are also shorthand setters that call `setOptions`: `setMode`, `setRulers`,
`setBase`, `setExponentGap`, `setBounds(min, max)`, `setOrientation`,
`setUnitPosition`, `setDefer`, `setPixelsPerUnit`, `setTickGap`,
`setTickGapStep`, `setTicks`, `setLayerSize`, `setLayerSizeStep`, `setStyle`,
`setShowTooltip`, `setShowLabels` and `setShowGap`.

Static members: `Oomph.defaults` and `Oomph.tickRhythmFor(base)`.

## Styling

```js
ruler.setStyle({
  backgroundColor: '#f8fafc',
  edgeColor: '#b8c2d0',
  minorTick: { color: '#667085', width: 1, height: 40 }, // height is % of the band
  midTick:   { color: '#1f6feb', width: 1, height: 70 },
  majorTick: { color: '#0f172a', width: 2, height: 100 }
});
```

You can also set CSS custom properties on the container: `--oomph-bg`,
`--oomph-edge`, `--oomph-{minor,mid,major}-{color,width,length}`,
`--oomph-label-bg`, `--oomph-label-color`, `--oomph-tooltip-bg` and
`--oomph-tooltip-color`.

## Development

```sh
npm test
npm run build   # writes dist/oomph.min.js
npm start   # serves the workbench (index.html) and demos/
```

Built with substantial help from LLM coding assistants. The design is the author's own.

## License

[MPL-2.0](LICENSE)
