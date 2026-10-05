/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2026 Lior Ben-Gai
 */

/*
 * oomph.js
 *
 * A configurable-scale BigInt ruler component. Pass a container element,
 * configure the layers, and receive debounced BigInt value changes.
 */

const STYLE_ID = 'oomph-default-styles';

  const DEFAULT_STYLE = `
.oomph {
  --oomph-bg: #f6f7f8;
  --oomph-edge: #c9ced6;
  --oomph-band-shadow: rgba(21, 29, 39, 0.08);
  --oomph-minor-color: rgba(31, 41, 55, 0.32);
  --oomph-mid-color: rgba(31, 41, 55, 0.54);
  --oomph-major-color: rgba(17, 24, 39, 0.82);
  --oomph-minor-width: 1px;
  --oomph-mid-width: 1px;
  --oomph-major-width: 2px;
  --oomph-minor-length: 100%;
  --oomph-mid-length: 100%;
  --oomph-major-length: 100%;
  --oomph-label-bg: rgba(255, 255, 255, 0.82);
  --oomph-label-color: #111827;
  --oomph-gap-bg: #111827;
  --oomph-gap-color: #ffffff;
  --oomph-tooltip-bg: rgba(17, 24, 39, 0.92);
  --oomph-tooltip-color: #ffffff;
  --oomph-focus: #2563eb;
  --oomph-tick-gap: 10px;
  --oomph-mid-tick: 50px;
  --oomph-major-tick: 100px;
  --oomph-visual-cycle: 1000px;
  --oomph-stack-size: 128px;
  --oomph-offset-x: 0px;
  --oomph-offset-y: 0px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  color: var(--oomph-label-color);
  background: var(--oomph-edge);
  border: 1px solid var(--oomph-edge);
}

.oomph *,
.oomph *::before,
.oomph *::after {
  box-sizing: border-box;
}

.oomph[data-orientation="top"],
.oomph[data-orientation="bottom"] {
  min-height: var(--oomph-stack-size);
}

.oomph[data-orientation="left"],
.oomph[data-orientation="right"] {
  min-width: var(--oomph-stack-size);
}

.oomph[data-orientation="top"][data-unit-position="outside"],
.oomph[data-orientation="bottom"][data-unit-position="inside"] {
  flex-direction: column;
}

.oomph[data-orientation="top"][data-unit-position="inside"],
.oomph[data-orientation="bottom"][data-unit-position="outside"] {
  flex-direction: column-reverse;
}

.oomph[data-orientation="left"][data-unit-position="outside"],
.oomph[data-orientation="right"][data-unit-position="inside"] {
  flex-direction: row;
}

.oomph[data-orientation="left"][data-unit-position="inside"],
.oomph[data-orientation="right"][data-unit-position="outside"] {
  flex-direction: row-reverse;
}

.oomph-band {
  --oomph-layer-size: 22px;
  --oomph-offset-x: 0px;
  --oomph-offset-y: 0px;
  position: relative;
  flex: 1 0 var(--oomph-layer-size);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background-color: var(--oomph-bg);
  box-shadow: inset 0 0 0 1px var(--oomph-band-shadow);
  outline: none;
  transition: none;
}

.oomph-band--dragging {
  transition: none;
}

.oomph[data-orientation="top"] .oomph-band,
.oomph[data-orientation="bottom"] .oomph-band {
  width: 100%;
  cursor: ew-resize;
  background-image:
    repeating-linear-gradient(
      to right,
      var(--oomph-major-color) 0 var(--oomph-major-width),
      transparent var(--oomph-major-width) var(--oomph-major-tick)
    ),
    repeating-linear-gradient(
      to right,
      var(--oomph-mid-color) 0 var(--oomph-mid-width),
      transparent var(--oomph-mid-width) var(--oomph-mid-tick)
    ),
    repeating-linear-gradient(
      to right,
      var(--oomph-minor-color) 0 var(--oomph-minor-width),
      transparent var(--oomph-minor-width) var(--oomph-tick-gap)
    );
  background-position:
    var(--oomph-offset-x) bottom,
    var(--oomph-offset-x) bottom,
    var(--oomph-offset-x) bottom;
  background-size:
    var(--oomph-visual-cycle) var(--oomph-major-length),
    var(--oomph-mid-tick) var(--oomph-mid-length),
    var(--oomph-tick-gap) var(--oomph-minor-length);
  background-repeat: repeat-x;
}

.oomph[data-orientation="left"] .oomph-band,
.oomph[data-orientation="right"] .oomph-band {
  height: 100%;
  cursor: ns-resize;
  background-image:
    repeating-linear-gradient(
      to bottom,
      var(--oomph-major-color) 0 var(--oomph-major-width),
      transparent var(--oomph-major-width) var(--oomph-major-tick)
    ),
    repeating-linear-gradient(
      to bottom,
      var(--oomph-mid-color) 0 var(--oomph-mid-width),
      transparent var(--oomph-mid-width) var(--oomph-mid-tick)
    ),
    repeating-linear-gradient(
      to bottom,
      var(--oomph-minor-color) 0 var(--oomph-minor-width),
      transparent var(--oomph-minor-width) var(--oomph-tick-gap)
    );
  background-position:
    left var(--oomph-offset-y),
    left var(--oomph-offset-y),
    left var(--oomph-offset-y);
  background-size:
    var(--oomph-major-length) var(--oomph-visual-cycle),
    var(--oomph-mid-length) var(--oomph-mid-tick),
    var(--oomph-minor-length) var(--oomph-tick-gap);
  background-repeat: repeat-y;
}

.oomph-band:focus-visible {
  box-shadow:
    inset 0 0 0 2px var(--oomph-focus),
    inset 0 0 0 1px var(--oomph-band-shadow);
}

.oomph-band-label {
  position: absolute;
  z-index: 1;
  max-width: calc(100% - 10px);
  padding: 2px 5px;
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 4px;
  background: var(--oomph-label-bg);
  color: var(--oomph-label-color);
  font: 11px/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  pointer-events: none;
  white-space: nowrap;
}

.oomph[data-orientation="top"] .oomph-band-label,
.oomph[data-orientation="bottom"] .oomph-band-label {
  top: 50%;
  left: 6px;
  transform: translateY(-50%);
}

.oomph[data-orientation="left"] .oomph-band-label,
.oomph[data-orientation="right"] .oomph-band-label {
  top: 50%;
  left: 50%;
  max-width: none;
  transform: translate(-50%, -50%) rotate(-90deg);
  transform-origin: center;
}

.oomph-gap {
  position: absolute;
  z-index: 3;
  right: 6px;
  bottom: 6px;
  padding: 3px 6px;
  border-radius: 4px;
  background: var(--oomph-gap-bg);
  color: var(--oomph-gap-color);
  font: 11px/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  pointer-events: none;
}

.oomph[data-orientation="top"] .oomph-gap {
  top: 6px;
  bottom: auto;
}

.oomph[data-orientation="left"] .oomph-gap {
  right: auto;
  bottom: 6px;
  left: 6px;
}

.oomph[data-orientation="right"] .oomph-gap {
  right: 6px;
  bottom: 6px;
  left: auto;
}

.oomph-tooltip {
  position: absolute;
  z-index: 4;
  left: 50%;
  top: 50%;
  max-width: calc(100% - 16px);
  overflow: hidden;
  padding: 5px 8px;
  border-radius: 4px;
  background: var(--oomph-tooltip-bg);
  color: var(--oomph-tooltip-color);
  font: 12px/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, calc(-100% - 10px));
  transition: opacity 0.12s ease;
}

.oomph[data-orientation="left"] .oomph-tooltip,
.oomph[data-orientation="right"] .oomph-tooltip {
  max-width: none;
  transform: translate(-50%, -50%) rotate(-90deg);
  transform-origin: center;
}

.oomph--dragging .oomph-tooltip {
  opacity: 1;
}
`;

  const DEFAULTS = {
    value: 0n,
    mode: 'bigint',
    min: null,
    max: null,
    rulers: 5,
    base: 10,
    exponentGap: 1,
    orientation: 'bottom',
    unitPosition: 'inside',
    defer: 100,
    pixelsPerUnit: 1,
    tickGap: 10,
    tickGapStep: 0,
    // 'auto' derives the rhythm from `base` so one major interval spans exactly
    // one digit. At base 10 that resolves to 10 / 5 / 100 — the values these
    // options used to be hardcoded to.
    midTickEvery: 'auto',
    majorTickEvery: 'auto',
    visualCycleEvery: 'auto',
    displayRadix: 'base',
    digits: null,
    padTo: 0,
    layerSize: 32,
    layerSizeStep: -4,
    showTooltip: true,
    showLabels: false,
    showGap: false,
    injectStyles: true,
    style: null
  };

  // Tick rhythm implied by a base. A major tick every `base` notches means one
  // major interval is exactly one digit of the next place up, which is what
  // makes a base-16 ruler read as hex rather than as decimal ticks that happen
  // to step by 16. Base 10 resolves to the library's historical 10 / 5 / 100.
  function autoTicks(base) {
    if (base < 2) return { major: 10, mid: 5, cycle: 100 };
    return {
      major: base,
      mid: base < 4 ? base : Math.max(2, Math.round(base / 2)),
      cycle: base * base
    };
  }

  function resolveTickEvery(option, current, auto) {
    if (option === 'auto') return auto;
    if (option === undefined) return current ?? auto;
    return normalizePositiveNumber(option, current ?? auto);
  }

  // A custom alphabet is what lifts display past base 36, which is where
  // BigInt.prototype.toString stops.
  function normalizeDigits(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string') {
      throw new TypeError('Oomph: digits must be a string of unique characters');
    }
    const alphabet = [...value];
    if (alphabet.length < 2) {
      throw new RangeError('Oomph: digits needs at least two characters');
    }
    if (new Set(alphabet).size !== alphabet.length) {
      throw new RangeError('Oomph: digits must not repeat a character');
    }
    return alphabet;
  }

  // `base` doubles as the display radix, but only where a radix exists:
  // base 1 is unary, and above 36 there is no built-in alphabet to use.
  function resolveDisplayRadix(option, base, alphabet) {
    if (alphabet) return alphabet.length;
    if (option === 'base' || option === undefined || option === null) {
      return base >= 2 && base <= 36 ? base : 10;
    }
    const radix = Number(option);
    if (!Number.isInteger(radix) || radix < 2 || radix > 36) {
      throw new RangeError('Oomph: displayRadix must be an integer from 2 to 36, or supply `digits`');
    }
    return radix;
  }

  // Smallest band we will render. A band thinner than this is not draggable.
  const MIN_BAND_SIZE = 8;

  const ORIENTATIONS = new Set(['top', 'bottom', 'left', 'right']);
  const UNIT_POSITIONS = new Set(['inside', 'outside']);
  const MODES = new Set(['bigint', 'float64']);
  const PATTERN_SCALE_LIMIT = 1000000;
  const RATIO_PRECISION = 1000000000000n;
  const MOTION_DURATION_MS = 40;
  const MOTION_FRAME_MS = 16;

  const STYLE_VARIABLES = {
    backgroundColor: '--oomph-bg',
    edgeColor: '--oomph-edge',
    bandShadow: '--oomph-band-shadow',
    labelBackground: '--oomph-label-bg',
    labelColor: '--oomph-label-color',
    gapBackground: '--oomph-gap-bg',
    gapColor: '--oomph-gap-color',
    tooltipBackground: '--oomph-tooltip-bg',
    tooltipColor: '--oomph-tooltip-color',
    focusColor: '--oomph-focus'
  };

  function ensureDefaultStyles() {
    if (typeof document === 'undefined') return;
    if (!document.head || document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = DEFAULT_STYLE;
    document.head.appendChild(style);
  }

  function clampValue(value, min, max) {
    if (min !== null && value < min) return min;
    if (max !== null && value > max) return max;
    return value;
  }

  function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeInteger(value, fallback, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return clampNumber(Math.round(number), min, max);
  }

  function normalizeNonNegativeNumber(value, fallback, max) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.min(number, max) : fallback;
  }

  function normalizePositiveNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function normalizeBigInt(value, fallback = null) {
    if (value === null || value === undefined) return fallback;
    return BigInt(value);
  }

  function normalizeFloat64(value, fallback = null) {
    if (value === null || value === undefined) return fallback;
    const number = Number(value);
    if (!Number.isFinite(number)) {
      throw new TypeError('Oomph: float64 values must be finite numbers');
    }
    return number;
  }

  function normalizeMode(value, fallback = DEFAULTS.mode) {
    if (value === null || value === undefined) return fallback;
    if (!MODES.has(value)) {
      throw new RangeError(`Oomph: mode must be one of ${[...MODES].join(', ')}`);
    }
    return value;
  }

  function normalizeValue(value, mode, fallback = null) {
    return mode === 'float64'
      ? normalizeFloat64(value, fallback)
      : normalizeBigInt(value, fallback);
  }

  function normalizeExponentGap(value, fallback, mode) {
    const number = Number(value ?? fallback);
    if (!Number.isFinite(number)) {
      throw new TypeError('Oomph: exponentGap must be finite');
    }
    if (mode === 'bigint' && (!Number.isInteger(number) || number < 1)) {
      throw new RangeError('Oomph: bigint mode requires a positive integer exponentGap');
    }
    return mode === 'bigint' ? Math.min(number, 40) : number;
  }

  function isZeroValue(value) {
    return value === 0 || value === 0n;
  }

  function positiveModNumber(value, modulo) {
    return ((value % modulo) + modulo) % modulo;
  }

  function validateFloat64Steps(base, exponentGap, rulerCount) {
    for (let layer = 0; layer < rulerCount; layer += 1) {
      const step = base ** (exponentGap * layer);
      if (!Number.isFinite(step) || step <= 0) {
        throw new RangeError('Oomph: exponent range exceeds finite Float64 steps');
      }
    }
  }

  function decimalPlaces(value) {
    const [coefficient, exponentText = '0'] = Math.abs(value).toString().toLowerCase().split('e');
    const decimals = coefficient.includes('.') ? coefficient.length - coefficient.indexOf('.') - 1 : 0;
    return Math.max(0, decimals - Number(exponentText));
  }

  function analyzeFloat64Precision(stepSizes) {
    const places = stepSizes.map(decimalPlaces);
    const requested = Math.max(0, ...places);
    const smallestStep = Math.min(...stepSizes);

    if (requested > 100) return { method: 'significant', digits: 15 };
    if (requested > 15 && smallestStep >= 1e-15) return { method: 'fixed', digits: 15 };
    return { method: 'fixed', digits: requested };
  }

  function stabilizeFloat64(value, precision) {
    if (!Number.isFinite(value)) {
      throw new TypeError('Oomph: float64 values must remain finite');
    }

    const stabilized = precision.method === 'fixed'
      ? Number(value.toFixed(precision.digits))
      : Number(value.toPrecision(precision.digits));
    return Object.is(stabilized, -0) ? 0 : stabilized;
  }

  function absBigInt(value) {
    return value < 0n ? -value : value;
  }

  function positiveModBigInt(value, modulo) {
    return ((value % modulo) + modulo) % modulo;
  }

  function greatestCommonDivisor(left, right) {
    let a = absBigInt(left);
    let b = absBigInt(right);

    while (b !== 0n) {
      const remainder = a % b;
      a = b;
      b = remainder;
    }

    return a;
  }

  function positiveNumberToRatio(value) {
    const [coefficient, exponentText = '0'] = String(value).toLowerCase().split('e');
    const exponent = Number(exponentText);
    const dot = coefficient.indexOf('.');
    const decimals = dot === -1 ? 0 : coefficient.length - dot - 1;
    const digits = coefficient.replace('.', '');
    const scale = decimals - exponent;
    let numerator = BigInt(digits);
    let denominator = 1n;

    if (scale > 0) {
      denominator = 10n ** BigInt(scale);
    } else if (scale < 0) {
      numerator *= 10n ** BigInt(-scale);
    }

    const divisor = greatestCommonDivisor(numerator, denominator);
    return [numerator / divisor, denominator / divisor];
  }

  function positiveBigIntRatioToNumber(numerator, denominator) {
    const whole = numerator / denominator;
    const remainder = numerator % denominator;
    const fraction = (remainder * RATIO_PRECISION) / denominator;
    return Number(whole) + (Number(fraction) / Number(RATIO_PRECISION));
  }

  function boundedBigIntRatioToNumber(numerator, denominator, limit) {
    const sign = numerator < 0n ? -1 : 1;
    const absolute = absBigInt(numerator);
    const limitBigInt = BigInt(Math.floor(limit));

    if (absolute >= denominator * limitBigInt) {
      return sign * limit;
    }

    return sign * positiveBigIntRatioToNumber(absolute, denominator);
  }

  function toCssLength(value, fallback, unit = 'px') {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'number') return `${value}${unit}`;
    return String(value);
  }

  function toCssPercent(value, fallback) {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'number') return `${value}%`;
    return String(value);
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  // The alphabet BigInt.prototype.toString uses, so a custom `digits` string of
  // length <= 36 stays consistent with the built-in path.
  const STANDARD_DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

  // Radix conversion for alphabets the engine cannot do itself. toString caps
  // at 36; base 58 and base 64 need repeated divmod.
  function encodeWithAlphabet(magnitude, alphabet) {
    const radix = BigInt(alphabet.length);
    if (magnitude === 0n) return alphabet[0];

    let rest = magnitude;
    let out = '';
    while (rest > 0n) {
      out = alphabet[Number(rest % radix)] + out;
      rest /= radix;
    }
    return out;
  }

  // `value` in `radix`, signed. Padding applies to the magnitude, so a negative
  // reads -00ff rather than 0-0ff.
  //
  // The sign is a leading '-'. An alphabet that itself contains '-' (base64url,
  // for one) makes negatives ambiguous to read back; bound such a ruler at
  // `min: 0n` if that matters.
  function radixDigits(value, radix, alphabet, padTo) {
    const negative = value < 0n;
    const magnitude = negative ? -value : value;
    let digits = alphabet
      ? encodeWithAlphabet(magnitude, alphabet)
      : magnitude.toString(radix);

    if (padTo > digits.length) {
      digits = (alphabet ? alphabet[0] : '0').repeat(padTo - digits.length) + digits;
    }
    return negative ? `-${digits}` : digits;
  }

  // Float64 renders in other radices too: Number.prototype.toString handles
  // fractions and signs itself. Note that the decimal-place stabilisation
  // elsewhere in this file is decimal by construction, so a value like 0.1 shows
  // its true binary expansion here rather than a tidied one.
  function radixNumber(value, radix) {
    if (!Number.isFinite(value)) return String(value);
    return radix === 10 ? String(value) : value.toString(radix);
  }

  // How many digits we are willing to show before eliding the middle. Scaled
  // by radix so the budget is a similar magnitude in every base rather than a
  // similar character count: 24 decimal digits and 80 binary digits describe
  // numbers of roughly the same size.
  function elisionLimit(radix) {
    return Math.max(16, Math.round(24 * (Math.log(10) / Math.log(radix))));
  }

  function formatBigInt(value, radix = 10, alphabet = null, padTo = 0) {
    const text = radixDigits(value, radix, alphabet, padTo);
    const sign = text.startsWith('-') ? '-' : '';
    const digits = sign ? text.slice(1) : text;
    const limit = elisionLimit(radix);

    if (digits.length <= limit) {
      return `< ${text} >`;
    }

    const keep = Math.max(4, Math.round(limit / 4));
    return `< ${sign}${digits.slice(0, keep)}... [ ${digits.length} digits ] ...${digits.slice(-keep)} >`;
  }

  function formatValue(value, mode, radix = 10, alphabet = null, padTo = 0) {
    return mode === 'float64'
      ? `< ${radixNumber(value, radix)} >`
      : formatBigInt(value, radix, alphabet, padTo);
  }

  function formatExponent(value) {
    return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(12)));
  }

  class Oomph {
    constructor(container, opts = {}) {
      this.container = typeof container === 'string'
        ? document.querySelector(container)
        : container;

      if (!this.container) {
        throw new Error('Oomph: container element not found');
      }

      const options = { ...DEFAULTS, ...opts };
      if (options.injectStyles !== false) {
        ensureDefaultStyles();
      }

      this.handlers = [];
      this.inputHandlers = [];
      this.deferTimer = null;
      this.pendingChange = null;
      this.lastChangeValue = null;
      this.dragging = null;
      this.visualOffsets = [];
      this.displayOffsets = [];
      this.animationFrame = null;
      this.motionAnimation = null;
      this.rulers = [];

      this._onPointerDownBound = this._onPointerDown.bind(this);
      this._onPointerMoveBound = this._onPointerMove.bind(this);
      this._onPointerUpBound = this._onPointerUp.bind(this);
      this._preventDrag = (event) => event.preventDefault();

      this._readOptions(options);
      this._recomputeSteps();
      this.value = clampValue(this._normalizeStoredValue(options.value), this.min, this.max);
      this._buildDOM();
      this._syncOffsetsFromValue();
      this._render();
    }

    onChange(fn) {
      if (typeof fn !== 'function') return () => {};

      this.handlers.push(fn);
      return () => {
        this.handlers = this.handlers.filter((handler) => handler !== fn);
      };
    }

    onInput(fn) {
      if (typeof fn !== 'function') return () => {};

      this.inputHandlers.push(fn);
      return () => {
        this.inputHandlers = this.inputHandlers.filter((handler) => handler !== fn);
      };
    }

    setValue(newValue, options = {}) {
      const previous = this.value;
      const next = clampValue(this._normalizeStoredValue(newValue), this.min, this.max);
      const sourceLayer = Number.isInteger(options.sourceLayer)
        && options.sourceLayer >= 0
        && options.sourceLayer < this.rulerCount
        ? options.sourceLayer
        : null;

      if (next === previous) {
        if (options.sync === true && sourceLayer === null && !options.preserveVisualOffset) {
          this._syncOffsetsFromValue();
          this._render();
        }
        return this;
      }

      this.value = next;
      const delta = this._valueDifference(next, previous);

      if (options.preserveVisualOffset) {
        this._render();
      } else if (options.sync === true) {
        this._syncOffsetsFromValue(sourceLayer === null ? null : delta, sourceLayer);
        this._render();
      } else {
        this._applyProgrammaticDelta(delta);
      }

      if (options.silent !== true) {
        this._scheduleChange({
          source: 'setValue',
          layer: null,
          delta
        });
      }

      return this;
    }

    getValue() {
      return this.value;
    }

    /** The value as it is displayed: current radix, alphabet and padding. */
    getValueText() {
      if (this.mode === 'float64') return radixNumber(this.value, this.displayRadix);
      return radixDigits(this.value, this.displayRadix, this.digits, this.padTo);
    }

    getMode() {
      return this.mode;
    }

    setOptions(options = {}) {
      const mode = normalizeMode(options.mode, this.mode ?? DEFAULTS.mode);
      const value = normalizeValue(hasOwn(options, 'value') ? options.value : this.value, mode);
      this._readOptions(options);
      this._recomputeSteps();
      this.value = clampValue(this._normalizeStoredValue(value), this.min, this.max);
      this._buildDOM();
      this._syncOffsetsFromValue();
      this._render();
      return this;
    }

    setBounds(min, max) {
      this.min = normalizeValue(min, this.mode, null);
      this.max = normalizeValue(max, this.mode, null);
      return this.setValue(this.value, { sync: true, silent: true });
    }

    setMode(mode) {
      return this.setOptions({ mode });
    }

    setRulers(rulers) {
      return this.setOptions({ rulers });
    }

    setBase(base) {
      return this.setOptions({ base });
    }

    setExponentGap(exponentGap) {
      return this.setOptions({ exponentGap });
    }

    setOrientation(orientation) {
      if (!ORIENTATIONS.has(orientation) || orientation === this.orientation) return this;
      this.orientation = orientation;
      this.container.setAttribute('data-orientation', this.orientation);
      this._render();
      return this;
    }

    setUnitPosition(unitPosition) {
      if (!UNIT_POSITIONS.has(unitPosition) || unitPosition === this.unitPosition) return this;
      this.unitPosition = unitPosition;
      this.container.setAttribute('data-unit-position', this.unitPosition);
      return this;
    }

    setDefer(defer) {
      this.defer = defer;
      return this;
    }

    setPixelsPerUnit(pixelsPerUnit) {
      this.pixelsPerUnit = normalizePositiveNumber(pixelsPerUnit, this.pixelsPerUnit);
      return this;
    }

    setTickGap(tickGap) {
      return this.setOptions({ tickGap });
    }

    setTickGapStep(tickGapStep) {
      return this.setOptions({ tickGapStep });
    }

    setTicks(options = {}) {
      return this.setOptions(options);
    }

    setLayerSize(layerSize) {
      return this.setOptions({ layerSize });
    }

    setLayerSizeStep(layerSizeStep) {
      return this.setOptions({ layerSizeStep });
    }

    setLayerSizing(layerSize, layerSizeStep = this.layerSizeStep) {
      return this.setOptions({ layerSize, layerSizeStep });
    }

    setStyle(style = {}) {
      this.styleOptions = { ...this.styleOptions, ...style };
      this._applyStyleOptions(this.styleOptions);
      return this;
    }

    setShowTooltip(showTooltip) {
      this.showTooltip = Boolean(showTooltip);
      if (this.tooltip) this.tooltip.hidden = !this.showTooltip;
      return this;
    }

    setShowLabels(showLabels) {
      this.showLabels = Boolean(showLabels);
      for (const band of this.rulers) {
        const label = band.querySelector?.('.oomph-band-label');
        if (label) label.hidden = !this.showLabels;
      }
      return this;
    }

    setShowGap(showGap) {
      this.showGap = Boolean(showGap);
      if (this.gapBadge) this.gapBadge.hidden = !this.showGap;
      return this;
    }

    destroy() {
      clearTimeout(this.deferTimer);
      this.deferTimer = null;
      this._cancelMotionAnimation();

      for (const band of this.rulers || []) {
        band.removeEventListener('pointerdown', this._onPointerDownBound);
        band.removeEventListener('dragstart', this._preventDrag);
      }

      if (this.dragging?.band) {
        this.dragging.band.removeEventListener('pointermove', this._onPointerMoveBound);
        this.dragging.band.removeEventListener('pointerup', this._onPointerUpBound);
        this.dragging.band.removeEventListener('pointercancel', this._onPointerUpBound);
      }

      this.container.innerHTML = '';
      this.container.classList.remove('oomph', 'oomph--dragging');
      this.container.removeAttribute('data-orientation');
      this.container.removeAttribute('data-unit-position');
      this.container.removeAttribute('data-rulers');
      this.container.removeAttribute('data-mode');
      this.handlers = [];
      this.inputHandlers = [];
      this.rulers = [];
      this.dragging = null;
    }

    _readOptions(options) {
      const mode = normalizeMode(options.mode, this.mode ?? DEFAULTS.mode);
      const exponentGap = normalizeExponentGap(
        options.exponentGap,
        this.exponentGap ?? DEFAULTS.exponentGap,
        mode
      );
      const rulerCount = normalizeInteger(options.rulers, this.rulerCount ?? DEFAULTS.rulers, 1, 10);
      const base = normalizeInteger(options.base, this.base ?? DEFAULTS.base, 1, 64);
      if (mode === 'float64') validateFloat64Steps(base, exponentGap, rulerCount);
      const min = normalizeValue(hasOwn(options, 'min') ? options.min : this.min, mode, null);
      const max = normalizeValue(hasOwn(options, 'max') ? options.max : this.max, mode, null);

      this.mode = mode;
      this.min = min;
      this.max = max;
      this.rulerCount = rulerCount;
      this.base = base;
      this.exponentGap = exponentGap;
      this.orientation = ORIENTATIONS.has(options.orientation) ? options.orientation : (this.orientation ?? DEFAULTS.orientation);
      this.unitPosition = UNIT_POSITIONS.has(options.unitPosition) ? options.unitPosition : (this.unitPosition ?? DEFAULTS.unitPosition);
      this.defer = hasOwn(options, 'defer') ? options.defer : (this.defer ?? DEFAULTS.defer);
      this.pixelsPerUnit = normalizePositiveNumber(options.pixelsPerUnit, this.pixelsPerUnit ?? DEFAULTS.pixelsPerUnit);
      this.tickGap = normalizePositiveNumber(options.tickGap ?? options.minTick, this.tickGap ?? DEFAULTS.tickGap);
      this.tickGapStep = normalizeNonNegativeNumber(options.tickGapStep, this.tickGapStep ?? DEFAULTS.tickGapStep, 100);
      // Tick rhythm follows the base unless the caller pins it. `this.*Raw`
      // keeps the caller's intent ('auto' or a number) so a later setBase()
      // re-derives instead of freezing the first base's numbers.
      const auto = autoTicks(base);
      this.midTickEveryRaw = hasOwn(options, 'midTickEvery')
        ? options.midTickEvery : (this.midTickEveryRaw ?? DEFAULTS.midTickEvery);
      this.majorTickEveryRaw = hasOwn(options, 'majorTickEvery')
        ? options.majorTickEvery : (this.majorTickEveryRaw ?? DEFAULTS.majorTickEvery);
      this.visualCycleEveryRaw = hasOwn(options, 'visualCycleEvery')
        ? options.visualCycleEvery : (this.visualCycleEveryRaw ?? DEFAULTS.visualCycleEvery);

      this.midTickEvery = resolveTickEvery(this.midTickEveryRaw, undefined, auto.mid);
      this.majorTickEvery = resolveTickEvery(this.majorTickEveryRaw, undefined, auto.major);
      this.visualCycleEvery = resolveTickEvery(this.visualCycleEveryRaw, undefined, auto.cycle);

      this.midTick = hasOwn(options, 'midTick')
        ? normalizePositiveNumber(options.midTick, this.tickGap * this.midTickEvery)
        : this.tickGap * this.midTickEvery;
      this.majorTick = hasOwn(options, 'majorTick')
        ? normalizePositiveNumber(options.majorTick, this.tickGap * this.majorTickEvery)
        : this.tickGap * this.majorTickEvery;
      this.visualCycle = normalizePositiveNumber(
        options.visualCycle,
        this.tickGap * this.visualCycleEvery
      );

      // Display: how the value is written, as opposed to how the bands step.
      this.digits = hasOwn(options, 'digits')
        ? normalizeDigits(options.digits) : (this.digits ?? null);
      this.displayRadixRaw = hasOwn(options, 'displayRadix')
        ? options.displayRadix : (this.displayRadixRaw ?? DEFAULTS.displayRadix);
      if (this.digits && mode === 'float64') {
        throw new RangeError('Oomph: digits (custom alphabet) has no fractional form; it requires bigint mode');
      }
      this.displayRadix = resolveDisplayRadix(this.displayRadixRaw, base, this.digits);
      this.padTo = normalizeInteger(options.padTo ?? this.padTo, this.padTo ?? DEFAULTS.padTo, 0, 4096);
      this.layerSize = normalizeInteger(options.layerSize ?? options.layerThickness, this.layerSize ?? DEFAULTS.layerSize, 8, 120);
      this.layerSizeStep = normalizeInteger(options.layerSizeStep ?? options.layerThicknessStep, this.layerSizeStep ?? DEFAULTS.layerSizeStep, -20, 20);
      this.showTooltip = hasOwn(options, 'showTooltip') ? options.showTooltip !== false : (this.showTooltip ?? DEFAULTS.showTooltip);
      this.showLabels = hasOwn(options, 'showLabels') ? options.showLabels !== false : (this.showLabels ?? DEFAULTS.showLabels);
      this.showGap = hasOwn(options, 'showGap') ? options.showGap !== false : (this.showGap ?? DEFAULTS.showGap);
      this.styleOptions = {
        ...(this.styleOptions ?? {}),
        ...(options.style ?? options.theme ?? {})
      };
    }

    _recomputeSteps() {
      this.stepSizes = [];

      if (this.mode === 'float64') {
        for (let i = 0; i < this.rulerCount; i += 1) {
          const step = this.base ** (this.exponentGap * i);
          if (!Number.isFinite(step) || step <= 0) {
            throw new RangeError('Oomph: exponent range exceeds finite Float64 steps');
          }
          this.stepSizes[i] = step;
        }
        this.float64Precision = analyzeFloat64Precision(this.stepSizes);
      } else {
        const layerBase = BigInt(this.base) ** BigInt(this.exponentGap);
        for (let i = 0; i < this.rulerCount; i += 1) {
          this.stepSizes[i] = layerBase ** BigInt(i);
        }
        this.float64Precision = null;
      }

      [this.visualCycleNumerator, this.visualCycleDenominator] = positiveNumberToRatio(this.visualCycle);
    }

    _buildDOM() {
      this.container.innerHTML = '';
      this.container.classList.add('oomph');
      this.container.setAttribute('data-orientation', this.orientation);
      this.container.setAttribute('data-unit-position', this.unitPosition);
      this.container.setAttribute('data-rulers', String(this.rulerCount));
      this.container.setAttribute('data-mode', this.mode);
      this._syncRootVariables();

      this.rulers = [];
      const bandSizes = this._bandSizes();
      const tickScales = this._tickScales();
      for (let layer = 0; layer < this.rulerCount; layer += 1) {
        const band = document.createElement('div');
        const label = document.createElement('div');
        const size = bandSizes[layer];

        band.className = 'oomph-band';
        band.dataset.layer = String(layer);
        band.style.setProperty('--oomph-layer-size', `${size}px`);
        // Grow in proportion to thickness, not equally. A flat `flex-grow: 1`
        // hands every band the same surplus, so a stack shorter than its host
        // — which is every tapering cascade — gets visibly flattened, while a
        // growing cascade overfills and never does. That was the whole reason
        // positive and negative steps did not mirror each other.
        band.style.flexGrow = String(size);
        if (tickScales[layer] !== 1) this._setTickVariables(band, tickScales[layer]);
        band.setAttribute('role', 'slider');
        const exponent = formatExponent(layer * this.exponentGap);
        band.setAttribute('aria-roledescription', `${this.mode === 'float64' ? 'Float64' : 'BigInt'} delta ruler`);
        band.setAttribute('aria-label', `${this.base}^${exponent} ruler`);
        band.setAttribute('aria-valuetext', this.getValueText());
        band.tabIndex = 0;

        label.className = 'oomph-band-label';
        label.textContent = `${this.base}^${exponent}`;
        label.hidden = !this.showLabels;
        band.appendChild(label);

        band.addEventListener('pointerdown', this._onPointerDownBound);
        band.addEventListener('dragstart', this._preventDrag);

        this.rulers.push(band);
        this.container.appendChild(band);
      }

      this.gapBadge = document.createElement('div');
      this.gapBadge.className = 'oomph-gap';
      this.gapBadge.textContent = `gap ${formatExponent(this.exponentGap)}`;
      this.gapBadge.hidden = !this.showGap;
      this.container.appendChild(this.gapBadge);

      this.tooltip = document.createElement('div');
      this.tooltip.className = 'oomph-tooltip';
      this.tooltip.hidden = !this.showTooltip;
      this.container.appendChild(this.tooltip);

      this._applyStyleOptions(this.styleOptions);
    }

    _syncRootVariables() {
      this._setTickVariables(this.container, 1);
      this.container.style.setProperty('--oomph-stack-size', `${this.getStackSize()}px`);
    }

    _setTickVariables(element, scale) {
      element.style.setProperty('--oomph-tick-gap', `${this.tickGap * scale}px`);
      element.style.setProperty('--oomph-mid-tick', `${this.midTick * scale}px`);
      element.style.setProperty('--oomph-major-tick', `${this.majorTick * scale}px`);
      element.style.setProperty('--oomph-visual-cycle', `${this.visualCycle * scale}px`);
    }

    // Per-band magnification of the whole tick pattern. Band n spaces its
    // notches `tickGap + n * tickGapStep` apart, and everything else on that
    // band — mid, major and cycle spacing, and how far the pattern moves per
    // unit — scales by the same factor, so a band stays an exact view of the
    // value; it is only drawn larger. Offsets are kept in unscaled space and
    // multiplied out at render time.
    _tickScales() {
      const scales = [];
      const step = this.tickGapStep || 0;
      for (let layer = 0; layer < this.rulerCount; layer += 1) {
        scales.push(step === 0 ? 1 : (this.tickGap + (layer * step)) / this.tickGap);
      }
      return scales;
    }

    _applyStyleOptions(style = {}) {
      if (!style || typeof style !== 'object') return;

      for (const [key, variable] of Object.entries(STYLE_VARIABLES)) {
        if (style[key] !== undefined) {
          this.container.style.setProperty(variable, String(style[key]));
        }
      }

      this._applyTickStyle('minor', style.minorTick ?? style.minor);
      this._applyTickStyle('mid', style.midTick ?? style.middleTick ?? style.mid);
      this._applyTickStyle('major', style.majorTick ?? style.major);
    }

    _applyTickStyle(kind, tickStyle = {}) {
      if (!tickStyle || typeof tickStyle !== 'object') return;

      if (tickStyle.color !== undefined) {
        this.container.style.setProperty(`--oomph-${kind}-color`, String(tickStyle.color));
      }

      if (tickStyle.width !== undefined) {
        this.container.style.setProperty(`--oomph-${kind}-width`, toCssLength(tickStyle.width, null));
      }

      const length = tickStyle.length ?? tickStyle.height ?? tickStyle.heightPercent;
      if (length !== undefined) {
        this.container.style.setProperty(`--oomph-${kind}-length`, toCssPercent(length, null));
      }
    }

    // Band thicknesses, smallest-band-first, as a single source of truth for
    // both layout and stack measurement.
    //
    // A negative cascade walks toward MIN_BAND_SIZE, and clamping each band
    // independently would silently flatten the tail into a run of identical
    // bands (layerSize 32, step -10, 5 rulers gave 32,22,12,8,8). So when the
    // last band would fall under the floor we relax the *step* instead, which
    // keeps the cascade evenly spaced and monotonic and lands the last band
    // exactly on the floor.
    _bandSizes() {
      const count = this.rulerCount;
      let step = this.layerSizeStep;

      if (count > 1 && this.layerSize + ((count - 1) * step) < MIN_BAND_SIZE) {
        step = (MIN_BAND_SIZE - this.layerSize) / (count - 1);
      }

      const sizes = [];
      for (let layer = 0; layer < count; layer += 1) {
        sizes.push(Math.max(MIN_BAND_SIZE, this.layerSize + (layer * step)));
      }
      return sizes;
    }

    getStackSize() {
      return this._bandSizes().reduce((total, size) => total + size, 2);
    }

    _onPointerDown(event) {
      if (event.button !== 0) return;

      const band = event.currentTarget;
      const layer = Number(band.dataset.layer);
      const axis = this._isHorizontal() ? 'clientX' : 'clientY';

      event.preventDefault();
      band.setPointerCapture(event.pointerId);
      band.addEventListener('pointermove', this._onPointerMoveBound);
      band.addEventListener('pointerup', this._onPointerUpBound);
      band.addEventListener('pointercancel', this._onPointerUpBound);

      this.dragging = {
        pointerId: event.pointerId,
        band,
        layer,
        axis,
        lastCoord: event[axis],
        accum: 0,
        startValue: this.value
      };

      this.container.classList.add('oomph--dragging');
      band.classList.add('oomph-band--dragging');
      this._positionTooltip(event);
      this._render();
    }

    _onPointerMove(event) {
      if (!this.dragging || event.pointerId !== this.dragging.pointerId) return;

      const drag = this.dragging;
      const coord = event[drag.axis];
      const deltaPx = coord - drag.lastCoord;
      drag.lastCoord = coord;
      // A magnified band moves its pattern further per unit, so it also takes
      // proportionally more pointer travel per unit: the notches stay under
      // the finger.
      drag.accum += deltaPx / (this.pixelsPerUnit * this._tickScales()[drag.layer]);

      const units = Math.trunc(drag.accum);
      event.preventDefault();

      if (units !== 0) {
        drag.accum -= units;
        this._applyLayerDelta(drag.layer, units);
      }

      this._positionTooltip(event);
    }

    _onPointerUp(event) {
      if (!this.dragging || event.pointerId !== this.dragging.pointerId) return;

      const drag = this.dragging;
      event.preventDefault();

      drag.band.removeEventListener('pointermove', this._onPointerMoveBound);
      drag.band.removeEventListener('pointerup', this._onPointerUpBound);
      drag.band.removeEventListener('pointercancel', this._onPointerUpBound);

      if (drag.band.hasPointerCapture(event.pointerId)) {
        drag.band.releasePointerCapture(event.pointerId);
      }

      const delta = this._valueDifference(this.value, drag.startValue);
      this.dragging = null;
      drag.band.classList.remove('oomph-band--dragging');
      this.container.classList.remove('oomph--dragging');

      if (!isZeroValue(delta)) {
        this._scheduleChange({
          source: 'drag',
          layer: drag.layer,
          delta
        });
      }
    }

    _applyLayerDelta(layer, units) {
      const stepSize = this.stepSizes[layer];
      const previous = this.value;
      const requestedDelta = this.mode === 'float64' ? units * stepSize : BigInt(units) * stepSize;
      const next = clampValue(this._normalizeStoredValue(previous + requestedDelta), this.min, this.max);
      const appliedDelta = this._valueDifference(next, previous);

      if (isZeroValue(appliedDelta)) {
        if (!isZeroValue(requestedDelta)) {
          this._syncOffsetsFromValue();
        }
        this._render();
        return;
      }

      this.value = next;
      this._syncOffsetsFromValue(appliedDelta, layer);
      this._render();
      this._fireInput({
        source: 'drag',
        layer,
        delta: appliedDelta,
        timestamp: Date.now()
      });

      if (this.defer !== 'release') {
        this._scheduleChange({
          source: 'drag',
          layer,
          delta: this.dragging
            ? this._valueDifference(this.value, this.dragging.startValue)
            : appliedDelta
        });
      }
    }

    _applyProgrammaticDelta(deltaValue) {
      this._syncOffsetsFromValue(deltaValue);
      this._render();
    }

    _syncOffsetsFromValue(deltaValue = null, sourceLayer = null) {
      const previousOffsets = this.visualOffsets;
      const nextOffsets = [];

      for (let layer = 0; layer < this.rulerCount; layer += 1) {
        const stepSize = this.stepSizes[layer];
        let canonical;

        if (this.mode === 'float64') {
          canonical = positiveModNumber(this.value / stepSize, this.visualCycle);
          if (!Number.isFinite(canonical)) canonical = 0;
        } else {
          const denominator = stepSize * this.visualCycleDenominator;
          const period = stepSize * this.visualCycleNumerator;

          // Compute (value / stepSize) modulo visualCycle entirely as a BigInt
          // ratio, then convert only the bounded on-screen phase to Number.
          const residue = positiveModBigInt(this.value * this.visualCycleDenominator, period);
          canonical = positiveBigIntRatioToNumber(residue, denominator);
        }
        const previous = previousOffsets[layer];

        if (deltaValue !== null && Number.isFinite(previous)) {
          let movement = this.mode === 'float64'
            ? deltaValue / stepSize
            : boundedBigIntRatioToNumber(deltaValue, stepSize, PATTERN_SCALE_LIMIT);
          if (!Number.isFinite(movement)) {
            movement = Math.sign(movement || deltaValue) * PATTERN_SCALE_LIMIT;
          }
          let pathReference = previous;

          // A coarse drag can advance a fine layer by thousands of complete
          // cycles between pointer samples. Bound that cycle count so the
          // browser can paint the forward path instead of aliasing both ends
          // to the same static pattern. The final phase remains exact.
          const sourceStep = sourceLayer === null ? null : this.stepSizes[sourceLayer];
          if (sourceStep !== null && stepSize < sourceStep) {
            const visibleCycles = Math.abs(sourceLayer - layer);
            const visibleLimit = this.visualCycle * visibleCycles;
            movement = clampNumber(movement, -visibleLimit, visibleLimit);
            const displayed = this.displayOffsets[layer];
            if (Number.isFinite(displayed)) pathReference = displayed;
          }

          const expected = pathReference + movement;

          // Cycle-equivalent offsets draw the same ruler phase. Choose the one
          // on the continuous motion path instead of inventing a fake phase.
          const equivalent = canonical + (Math.round((expected - canonical) / this.visualCycle) * this.visualCycle);
          nextOffsets[layer] = this._normalizeOffset(equivalent);
        } else {
          nextOffsets[layer] = canonical;
        }
      }

      this.visualOffsets = nextOffsets;
      const sourceStep = sourceLayer === null ? null : this.stepSizes[sourceLayer];
      const hasFinerStep = sourceStep !== null
        && this.stepSizes.some((step) => step < sourceStep);

      if (sourceLayer !== null && hasFinerStep) {
        this._animateDisplayOffsets(nextOffsets, sourceStep);
      } else {
        this._cancelMotionAnimation();
        this.displayOffsets = [...nextOffsets];
      }
    }

    _animateDisplayOffsets(targetOffsets, sourceStep) {
      if (typeof requestAnimationFrame !== 'function') {
        this.displayOffsets = [...targetOffsets];
        return;
      }

      if (this.motionAnimation) {
        this.motionAnimation.targetOffsets = [...targetOffsets];
        this.motionAnimation.sourceStep = sourceStep;
        this.motionAnimation.restartSegment = true;
        this._syncDirectDisplayOffsets(targetOffsets, sourceStep);
        return;
      }

      const motion = {
        targetOffsets: [...targetOffsets],
        sourceStep,
        startOffsets: [...this.displayOffsets],
        elapsed: 0,
        lastTimestamp: null,
        restartSegment: true
      };
      this.motionAnimation = motion;
      this._syncDirectDisplayOffsets(targetOffsets, sourceStep);

      const tick = (timestamp) => {
        if (this.motionAnimation !== motion) return;

        const elapsedFrame = motion.lastTimestamp === null
          ? MOTION_FRAME_MS
          : clampNumber(timestamp - motion.lastTimestamp, 0, MOTION_DURATION_MS);
        motion.lastTimestamp = timestamp;

        if (motion.restartSegment) {
          motion.startOffsets = [...this.displayOffsets];
          motion.elapsed = 0;
          motion.restartSegment = false;
        }

        motion.elapsed += elapsedFrame;
        const progress = clampNumber(motion.elapsed / MOTION_DURATION_MS, 0, 1);

        this.displayOffsets = motion.targetOffsets.map((target, layer) => {
          if (this.stepSizes[layer] >= motion.sourceStep) return target;
          const start = Number.isFinite(motion.startOffsets[layer])
            ? motion.startOffsets[layer]
            : target;
          return start + ((target - start) * progress);
        });
        this._render();

        if (progress < 1) {
          this.animationFrame = requestAnimationFrame(tick);
        } else {
          this.animationFrame = null;
          this.motionAnimation = null;
        }
      };

      this.animationFrame = requestAnimationFrame(tick);
    }

    _syncDirectDisplayOffsets(targetOffsets, sourceStep) {
      for (let layer = 0; layer < this.rulerCount; layer += 1) {
        if (this.stepSizes[layer] >= sourceStep) {
          this.displayOffsets[layer] = targetOffsets[layer];
        }
      }
    }

    _cancelMotionAnimation() {
      if (this.animationFrame !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.animationFrame);
      }
      this.animationFrame = null;
      this.motionAnimation = null;
    }

    _render() {
      const horizontal = this._isHorizontal();
      const offsetProperty = horizontal ? '--oomph-offset-x' : '--oomph-offset-y';
      const inactiveProperty = horizontal ? '--oomph-offset-y' : '--oomph-offset-x';
      const valueText = this.getValueText();
      const tickScales = this._tickScales();

      for (let layer = 0; layer < this.rulerCount; layer += 1) {
        const band = this.rulers[layer];
        const displayOffset = (Number.isFinite(this.displayOffsets[layer])
          ? this.displayOffsets[layer]
          : this.visualOffsets[layer]) * tickScales[layer];
        const offset = `${displayOffset.toFixed(3)}px`;
        band.style.setProperty(offsetProperty, offset);
        band.style.setProperty(inactiveProperty, '0px');
        band.setAttribute('aria-valuetext', valueText);
      }

      if (this.tooltip) {
        this.tooltip.textContent = formatValue(this.value, this.mode, this.displayRadix, this.digits, this.padTo);
      }
    }

    _scheduleChange(meta) {
      if (this.defer === 'release' && this.dragging) {
        return;
      }

      if (this.lastChangeValue === this.value) {
        clearTimeout(this.deferTimer);
        this.deferTimer = null;
        this.pendingChange = null;
        return;
      }

      const payload = {
        value: this.value,
        source: meta.source,
        layer: meta.layer,
        delta: meta.delta,
        timestamp: Date.now()
      };

      if (this.defer === 'release') {
        this._fireChange(payload);
        return;
      }

      const delay = normalizeInteger(this.defer, DEFAULTS.defer, 0, 60000);
      clearTimeout(this.deferTimer);
      this.pendingChange = payload;
      this.deferTimer = setTimeout(() => {
        this._fireChange(this.pendingChange);
      }, delay);
    }

    _fireInput(meta) {
      for (const fn of this.inputHandlers) {
        try {
          fn(this.value, meta);
        } catch (err) {
          console.error('Oomph input handler error:', err);
        }
      }
    }

    _fireChange(meta) {
      clearTimeout(this.deferTimer);
      this.deferTimer = null;
      this.pendingChange = null;
      this.lastChangeValue = meta?.value ?? this.value;

      for (const fn of this.handlers) {
        try {
          fn(this.value, meta);
        } catch (err) {
          console.error('Oomph change handler error:', err);
        }
      }
    }

    _positionTooltip(event) {
      if (!this.tooltip || !this.showTooltip) return;

      const rect = this.container.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      let x;
      let y;

      if (this._isHorizontal()) {
        x = clampNumber(pointerX, 12, Math.max(12, rect.width - 12));
        y = clampNumber(pointerY, 12, Math.max(12, rect.height - 12));
      } else {
        // The tooltip is rotated for vertical rulers, so its unrotated width
        // becomes its rendered height. Keep that vertical pill inside the host.
        const halfWidth = Math.min((this.tooltip.offsetHeight / 2) + 4, rect.width / 2);
        const halfHeight = Math.min((this.tooltip.offsetWidth / 2) + 4, rect.height / 2);
        x = clampNumber(pointerX, halfWidth, Math.max(halfWidth, rect.width - halfWidth));
        y = clampNumber(pointerY, halfHeight, Math.max(halfHeight, rect.height - halfHeight));
      }

      this.tooltip.style.left = `${x}px`;
      this.tooltip.style.top = `${y}px`;
    }

    _normalizeOffset(value) {
      if (!Number.isFinite(value)) return 0;
      if (Math.abs(value) > PATTERN_SCALE_LIMIT) {
        return value % this.visualCycle;
      }
      return value;
    }

    _normalizeStoredValue(value) {
      const normalized = normalizeValue(value, this.mode);
      return this.mode === 'float64'
        ? stabilizeFloat64(normalized, this.float64Precision)
        : normalized;
    }

    _valueDifference(next, previous) {
      const difference = next - previous;
      return this.mode === 'float64'
        ? stabilizeFloat64(difference, this.float64Precision)
        : difference;
    }

    _isHorizontal() {
      return this.orientation === 'top' || this.orientation === 'bottom';
    }
  }

Oomph.defaults = { ...DEFAULTS };
Oomph.ensureDefaultStyles = ensureDefaultStyles;
/** What `'auto'` tick options resolve to for a given base. */
Oomph.tickRhythmFor = autoTicks;

export { Oomph };
export default Oomph;
