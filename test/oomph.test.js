/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2026 Lior Ben-Gai
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { Oomph } from '../index.js';

function createMathRuler({
  value = 0n,
  mode = 'bigint',
  rulers = 3,
  base = 10,
  exponentGap = 3,
  visualCycle = 1000
} = {}) {
  const ruler = Object.create(Oomph.prototype);
  Object.assign(ruler, {
    value,
    mode,
    min: null,
    max: null,
    rulerCount: rulers,
    base,
    exponentGap,
    visualCycle,
    visualOffsets: [],
    displayOffsets: [],
    animationFrame: null,
    motionAnimation: null,
    dragging: null,
    defer: 'release',
    handlers: [],
    inputHandlers: [],
    lastChangeValue: null,
    deferTimer: null,
    pendingChange: null,
    _render() {}
  });
  ruler._recomputeSteps();
  ruler.value = ruler._normalizeStoredValue(ruler.value);
  ruler._syncOffsetsFromValue();
  return ruler;
}

function assertClose(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: expected ${expected}, received ${actual}`);
}

test('public defaults expose base without an obsolete motion toggle', () => {
  assert.equal(Oomph.defaults.mode, 'bigint');
  assert.equal(Oomph.defaults.base, 10);
  assert.equal('motionSmoothing' in Oomph.defaults, false);
  assert.equal(typeof Oomph.prototype.setMotionSmoothing, 'undefined');
});

test('mode explicitly controls the accepted exponent domain', () => {
  const oomph = Object.create(Oomph.prototype);
  assert.throws(
    () => oomph._readOptions({ mode: 'bigint', exponentGap: -1 }),
    /positive integer exponentGap/
  );
  assert.throws(
    () => oomph._readOptions({ mode: 'bigint', exponentGap: 0.5 }),
    /positive integer exponentGap/
  );

  const floatRuler = Object.create(Oomph.prototype);
  floatRuler._readOptions({ mode: 'float64', exponentGap: -0.5 });
  assert.equal(floatRuler.mode, 'float64');
  assert.equal(floatRuler.exponentGap, -0.5);

  const overflowRuler = Object.create(Oomph.prototype);
  assert.throws(
    () => overflowRuler._readOptions({ mode: 'float64', base: 36, exponentGap: 1000 }),
    /finite Float64 steps/
  );
  assert.equal(overflowRuler.mode, undefined);
});

test('stack size includes the root border and every configured band basis', () => {
  const ruler = Object.create(Oomph.prototype);
  Object.assign(ruler, {
    rulerCount: 3,
    layerSize: 16,
    layerSizeStep: 0
  });

  assert.equal(ruler.getStackSize(), 50);

  ruler.layerSizeStep = 3;
  assert.equal(ruler.getStackSize(), 59);
});

test('coarse bands retain the exact fractional phase of the BigInt value', () => {
  const ruler = createMathRuler({ value: 1n });

  assertClose(ruler.visualOffsets[0], 1, 'unit layer');
  assertClose(ruler.visualOffsets[1], 0.001, '10^3 layer');
  assertClose(ruler.visualOffsets[2], 0.000001, '10^6 layer');
  assert.deepEqual(ruler.displayOffsets, ruler.visualOffsets);
});

test('repeated small programmatic changes carry into coarser bands', () => {
  const ruler = createMathRuler();

  for (let value = 1n; value <= 1000n; value += 1n) {
    ruler.setValue(value, { silent: true });
  }

  assert.equal(ruler.value, 1000n);
  assertClose(ruler.visualOffsets[1], 1, '10^3 layer after 1000 unit changes');
  assert.deepEqual(ruler.displayOffsets, ruler.visualOffsets);
});

test('every supported base defines the expected layer steps', () => {
  for (let base = 1; base <= 36; base += 1) {
    const ruler = createMathRuler({ base, exponentGap: 2, rulers: 4 });
    const radix = BigInt(base);
    assert.deepEqual(
      ruler.stepSizes,
      [0n, 2n, 4n, 6n].map((exponent) => radix ** exponent),
      `base ${base}`
    );

    ruler._applyLayerDelta(3, 1);
    assert.equal(ruler.value, radix ** 6n, `base ${base} coarse drag`);
    assertClose(ruler.visualOffsets[3], 1, `base ${base} active-layer phase`);
  }

  const binary = createMathRuler({ value: 8n, base: 2, exponentGap: 2 });

  assert.deepEqual(binary.stepSizes, [1n, 4n, 16n]);
  assertClose(binary.visualOffsets[0], 8, 'binary unit layer');
  assertClose(binary.visualOffsets[1], 2, 'binary 2^2 layer');
  assertClose(binary.visualOffsets[2], 0.5, 'binary 2^4 layer');
});

test('float64 mode supports negative and fractional exponent gaps', () => {
  const decimal = createMathRuler({
    value: 0,
    mode: 'float64',
    base: 10,
    exponentGap: -1,
    rulers: 4
  });

  assert.deepEqual(decimal.stepSizes, [1, 0.1, 0.01, 0.001]);
  decimal._applyLayerDelta(3, 1);
  assertClose(decimal.value, 0.001, 'negative exponent drag value');
  assertClose(decimal.visualOffsets[0], 0.001, '10^0 phase');
  assertClose(decimal.visualOffsets[1], 0.01, '10^-1 phase');
  assertClose(decimal.visualOffsets[2], 0.1, '10^-2 phase');
  assertClose(decimal.visualOffsets[3], 1, '10^-3 phase');

  const fractional = createMathRuler({
    value: 0,
    mode: 'float64',
    base: 4,
    exponentGap: -0.5,
    rulers: 3
  });
  assert.deepEqual(fractional.stepSizes, [1, 0.5, 0.25]);

  const float = createMathRuler({
    value: 0,
    mode: 'float64',
    base: 10,
    exponentGap: -1,
    rulers: 2
  });
  let lastDelta = null;
  float.onInput((_value, meta) => {
    lastDelta = meta.delta;
  });
  float._applyLayerDelta(1, 1);
  float._applyLayerDelta(1, 1);
  float._applyLayerDelta(1, 1);
  assert.equal(float.value, 0.3);
  assert.equal(lastDelta, 0.1);

  const stabilized = createMathRuler({
    value: 0,
    mode: 'float64',
    base: 10,
    exponentGap: -1,
    rulers: 5
  });
  stabilized.setValue(0.3125999999999998, { silent: true });
  assert.equal(stabilized.value, 0.3126);
});

test('mode switches change value types explicitly and fail without partial mutation', () => {
  const ruler = createMathRuler({ value: 2n });
  ruler._buildDOM = () => {};

  ruler.setOptions({ mode: 'float64', value: 2, exponentGap: -1 });
  assert.equal(ruler.getMode(), 'float64');
  assert.equal(ruler.getValue(), 2);
  assert.equal(typeof ruler.getValue(), 'number');

  ruler.setValue(2.5, { silent: true });
  assert.throws(
    () => ruler.setOptions({ mode: 'bigint', exponentGap: 1 }),
    /cannot be converted to a BigInt/
  );
  assert.equal(ruler.getMode(), 'float64');
  assert.equal(ruler.getValue(), 2.5);

  ruler.setOptions({ mode: 'bigint', value: 2, exponentGap: 1 });
  assert.equal(ruler.getMode(), 'bigint');
  assert.equal(ruler.getValue(), 2n);
  assert.equal(typeof ruler.getValue(), 'bigint');
});

test('float64 mode derives coarse-to-fine motion from step size, not layer index', () => {
  const originalRequest = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  const frames = [];

  globalThis.requestAnimationFrame = (callback) => {
    frames.push(callback);
    return frames.length;
  };
  globalThis.cancelAnimationFrame = () => {};

  const runFrame = (timestamp) => {
    const callback = frames.shift();
    assert.equal(typeof callback, 'function');
    callback(timestamp);
  };

  try {
    const ruler = createMathRuler({
      value: 0,
      mode: 'float64',
      base: 10,
      exponentGap: -1,
      rulers: 3
    });

    ruler._applyLayerDelta(0, 1);
    assert.deepEqual(ruler.visualOffsets, [1, 10, 100]);
    assert.deepEqual(ruler.displayOffsets, [1, 0, 0]);
    runFrame(0);
    assert.deepEqual(ruler.displayOffsets, [1, 4, 40]);
    runFrame(20);
    assert.deepEqual(ruler.displayOffsets, [1, 9, 90]);
    runFrame(40);
    assert.deepEqual(ruler.displayOffsets, ruler.visualOffsets);

    ruler._applyLayerDelta(2, 1);
    assert.equal(frames.length, 0);
    assert.deepEqual(ruler.displayOffsets, ruler.visualOffsets);
  } finally {
    if (originalRequest === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = originalRequest;
    if (originalCancel === undefined) delete globalThis.cancelAnimationFrame;
    else globalThis.cancelAnimationFrame = originalCancel;
  }
});

test('negative changes follow a continuous exact-equivalent path', () => {
  const ruler = createMathRuler();

  ruler.setValue(-1n, { silent: true });

  assertClose(ruler.visualOffsets[0], -1, 'unit layer');
  assertClose(ruler.visualOffsets[1], -0.001, '10^3 layer');
  assertClose(ruler.visualOffsets[2], -0.000001, '10^6 layer');
  assert.deepEqual(ruler.displayOffsets, ruler.visualOffsets);
});

test('a coarse-layer drag and release leave every displayed offset unchanged and exact', () => {
  const ruler = createMathRuler();

  ruler._applyLayerDelta(2, 1);

  assert.equal(ruler.value, 1000000n);
  assertClose(ruler.visualOffsets[0], 2000, 'unit layer');
  assertClose(ruler.visualOffsets[1], 1000, '10^3 layer');
  assertClose(ruler.visualOffsets[2], 1, '10^6 layer');
  assert.deepEqual(ruler.displayOffsets, ruler.visualOffsets);

  const offsetsAtRelease = [...ruler.displayOffsets];
  const band = {
    classList: { remove() {} },
    hasPointerCapture() { return false; },
    removeEventListener() {}
  };
  ruler.container = { classList: { remove() {} } };
  ruler.dragging = {
    pointerId: 7,
    band,
    layer: 2,
    startValue: 0n
  };
  ruler._scheduleChange = () => {};

  ruler._onPointerUp({ pointerId: 7, preventDefault() {} });

  assert.deepEqual(ruler.displayOffsets, offsetsAtRelease);
  assert.deepEqual(ruler.visualOffsets, offsetsAtRelease);
});

test('a large-layer drag keeps advancing during rapid pointer samples and finishes forward', () => {
  const originalRequest = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  const frames = [];
  let frameId = 0;

  globalThis.requestAnimationFrame = (callback) => {
    frameId += 1;
    frames.push(callback);
    return frameId;
  };
  globalThis.cancelAnimationFrame = () => {};

  const runFrame = (timestamp) => {
    const callback = frames.shift();
    assert.equal(typeof callback, 'function');
    callback(timestamp);
  };

  try {
    const ruler = createMathRuler();
    ruler._applyLayerDelta(2, 1);

    assert.deepEqual(ruler.displayOffsets, [0, 0, 1]);
    assert.deepEqual(ruler.visualOffsets, [2000, 1000, 1]);

    // A second pointer sample before the first paint stays only a bounded
    // number of cycles ahead instead of creating an invisible motion backlog.
    ruler._applyLayerDelta(2, 1);
    assert.deepEqual(ruler.visualOffsets, [2000, 1000, 2]);
    assert.deepEqual(ruler.displayOffsets, [0, 0, 2]);
    assert.equal(frames.length, 1);

    runFrame(0);
    assert.deepEqual(ruler.displayOffsets, [800, 400, 2]);

    // Retargeting an in-flight animation must reuse its pending frame instead
    // of restarting at progress zero and freezing under fast pointer input.
    ruler._applyLayerDelta(2, 1);
    assert.deepEqual(ruler.displayOffsets, [800, 400, 3]);
    assert.equal(frames.length, 1);
    runFrame(16);
    assert.deepEqual(ruler.displayOffsets, [1680, 640, 3]);

    const band = {
      classList: { remove() {} },
      hasPointerCapture() { return false; },
      removeEventListener() {}
    };
    ruler.container = { classList: { remove() {} } };
    ruler.dragging = { pointerId: 9, band, layer: 2, startValue: 0n };
    ruler._scheduleChange = () => {};
    ruler._onPointerUp({ pointerId: 9, preventDefault() {} });

    assert.deepEqual(ruler.displayOffsets, [1680, 640, 3]);
    runFrame(36);
    runFrame(56);
    assert.deepEqual(ruler.displayOffsets, ruler.visualOffsets);

    const mediumRuler = createMathRuler();
    mediumRuler._applyLayerDelta(1, 1);
    assert.deepEqual(mediumRuler.visualOffsets, [1000, 1, 0.001]);
    assert.deepEqual(mediumRuler.displayOffsets, [0, 1, 0.001]);
    runFrame(0);
    assert.deepEqual(mediumRuler.displayOffsets, [400, 1, 0.001]);
    runFrame(20);
    assert.deepEqual(mediumRuler.displayOffsets, [900, 1, 0.001]);
    runFrame(40);

    const smallRuler = createMathRuler();
    smallRuler._applyLayerDelta(0, 1);
    assert.deepEqual(smallRuler.displayOffsets, smallRuler.visualOffsets);
    assert.equal(frames.length, 0);

    const linkedRuler = createMathRuler();
    linkedRuler.setValue(1000000n, {
      sync: true,
      silent: true,
      sourceLayer: 2
    });
    assert.deepEqual(linkedRuler.visualOffsets, [2000, 1000, 1]);
    assert.deepEqual(linkedRuler.displayOffsets, [0, 0, 1]);
    assert.equal(frames.length, 1);

    // A duplicate synchronized value must not cancel and snap the in-flight
    // linked animation back to canonical offsets.
    linkedRuler.setValue(1000000n, {
      sync: true,
      silent: true,
      sourceLayer: 2
    });
    assert.equal(frames.length, 1);
    runFrame(0);
    assert.deepEqual(linkedRuler.displayOffsets, [800, 400, 1]);
    runFrame(20);
    assert.deepEqual(linkedRuler.displayOffsets, [1800, 900, 1]);
    runFrame(40);
    assert.deepEqual(linkedRuler.displayOffsets, linkedRuler.visualOffsets);

    const sourceRuler = createMathRuler();
    const targetRuler = createMathRuler();
    sourceRuler.onInput((value, meta) => {
      targetRuler.setValue(value, {
        sync: true,
        silent: true,
        sourceLayer: meta.layer
      });
    });

    sourceRuler._applyLayerDelta(2, 1);
    assert.equal(targetRuler.value, sourceRuler.value);
    assert.deepEqual(targetRuler.visualOffsets, sourceRuler.visualOffsets);
    assert.deepEqual(targetRuler.displayOffsets, sourceRuler.displayOffsets);
    assert.equal(frames.length, 2);

    runFrame(0);
    runFrame(0);
    runFrame(20);
    runFrame(20);
    assert.deepEqual(targetRuler.displayOffsets, sourceRuler.displayOffsets);
    runFrame(40);
    runFrame(40);
    assert.deepEqual(targetRuler.displayOffsets, sourceRuler.displayOffsets);

    const unaryRuler = createMathRuler({ base: 1, exponentGap: 1 });
    unaryRuler._applyLayerDelta(2, 1);
    assert.equal(unaryRuler.value, 1n);
    assert.deepEqual(unaryRuler.stepSizes, [1n, 1n, 1n]);
    assert.deepEqual(unaryRuler.visualOffsets, [1, 1, 1]);
    assert.deepEqual(unaryRuler.displayOffsets, unaryRuler.visualOffsets);
    assert.equal(frames.length, 0);
  } finally {
    if (originalRequest === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = originalRequest;
    if (originalCancel === undefined) delete globalThis.cancelAnimationFrame;
    else globalThis.cancelAnimationFrame = originalCancel;
  }
});

test('sync repairs offsets even when the value is unchanged', () => {
  const ruler = createMathRuler({ value: 1234n });
  ruler.visualOffsets = [99, 99, 99];
  ruler.displayOffsets = [88, 88, 88];

  ruler.setValue(1234n, { sync: true, silent: true });

  assertClose(ruler.visualOffsets[0], 234, 'unit layer canonical phase');
  assertClose(ruler.visualOffsets[1], 1.234, '10^3 layer canonical phase');
  assertClose(ruler.visualOffsets[2], 0.001234, '10^6 layer canonical phase');
  assert.deepEqual(ruler.displayOffsets, ruler.visualOffsets);
});

test('fractional visual cycles use an exact rational modulo', () => {
  const ruler = createMathRuler({
    value: 17n,
    rulers: 2,
    exponentGap: 1,
    visualCycle: 2.5
  });

  assertClose(ruler.visualOffsets[0], 2, 'unit layer');
  assertClose(ruler.visualOffsets[1], 1.7, '10^1 layer');
});

test('very large decimal steps retain usable sub-pixel phase precision', () => {
  const step = 10n ** 80n;
  const ruler = createMathRuler({
    value: step + (step / 10n),
    rulers: 3,
    exponentGap: 40
  });

  assertClose(ruler.visualOffsets[2], 1.1, '10^80 layer');
});

// --- radix display -------------------------------------------------------

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Exact inverse of the formatter, so round-trips are checked in BigInt rather
// than through parseInt, which loses precision well before these values.
function parseRadix(text, radix) {
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz';
  let total = 0n;
  for (const ch of text) total = (total * BigInt(radix)) + BigInt(digits.indexOf(ch));
  return total;
}

// Mirrors the tooltip path without needing a DOM.
function formatValueOf(ruler) {
  const text = ruler.getValueText();
  const sign = text.startsWith('-') ? '-' : '';
  const digits = sign ? text.slice(1) : text;
  const limit = Math.max(16, Math.round(24 * (Math.log(10) / Math.log(ruler.displayRadix))));
  if (digits.length <= limit) return `< ${text} >`;
  const keep = Math.max(4, Math.round(limit / 4));
  return `< ${sign}${digits.slice(0, keep)}... [ ${digits.length} digits ] ...${digits.slice(-keep)} >`;
}

function createDisplayRuler(options = {}) {
  const ruler = Object.create(Oomph.prototype);
  Object.assign(ruler, {
    value: 0n,
    mode: 'bigint',
    displayRadix: 10,
    digits: null,
    padTo: 0
  }, options);
  if (typeof ruler.digits === 'string') ruler.digits = [...ruler.digits];
  return ruler;
}

test('base 10 display is unchanged, and other radices render their own digits', () => {
  assert.equal(createDisplayRuler({ value: 1234567n }).getValueText(), '1234567');
  assert.equal(createDisplayRuler({ value: 255n, displayRadix: 2 }).getValueText(), '11111111');
  assert.equal(createDisplayRuler({ value: 255n, displayRadix: 16 }).getValueText(), 'ff');
  assert.equal(createDisplayRuler({ value: 0n, displayRadix: 16 }).getValueText(), '0');
});

test('padTo pads with the radix zero digit and never truncates', () => {
  assert.equal(createDisplayRuler({ value: 5n, displayRadix: 2, padTo: 8 }).getValueText(), '00000101');
  assert.equal(createDisplayRuler({ value: 0x1E90FFn, displayRadix: 16, padTo: 6 }).getValueText(), '1e90ff');
  // already longer than padTo: left alone, not cut
  assert.equal(createDisplayRuler({ value: 0xFFFFFFFn, displayRadix: 16, padTo: 2 }).getValueText(), 'fffffff');
});

test('a custom alphabet lifts display past the base 36 toString ceiling', () => {
  assert.equal(createDisplayRuler({ value: 1000000n, displayRadix: 64, digits: B64 }).getValueText(), 'D0JA');
  const b58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  assert.equal(createDisplayRuler({ value: 1000000n, displayRadix: 58, digits: b58 }).getValueText(), '68GP');
});

test('radix display round-trips through BigInt for every supported radix', () => {
  const value = 987654321987654321n;
  for (let radix = 2; radix <= 36; radix += 1) {
    const text = createDisplayRuler({ value, displayRadix: radix }).getValueText();
    assert.equal(text, value.toString(radix), `radix ${radix}`);
    assert.equal(parseRadix(text, radix), value, `radix ${radix} round-trip`);
  }
});

test('float64 renders in other radices too, fractions included', () => {
  assert.equal(createDisplayRuler({ value: 0.125, mode: 'float64', displayRadix: 2 }).getValueText(), '0.001');
  assert.equal(createDisplayRuler({ value: 255.5, mode: 'float64', displayRadix: 16 }).getValueText(), 'ff.8');
  assert.equal(createDisplayRuler({ value: -0.75, mode: 'float64', displayRadix: 2 }).getValueText(), '-0.11');
  assert.equal(createDisplayRuler({ value: 12.5, mode: 'float64', displayRadix: 10 }).getValueText(), '12.5');
});

test('negative values keep their sign in every radix', () => {
  assert.equal(createDisplayRuler({ value: -255n }).getValueText(), '-255');
  assert.equal(createDisplayRuler({ value: -255n, displayRadix: 16 }).getValueText(), '-ff');
  assert.equal(createDisplayRuler({ value: -5n, displayRadix: 2 }).getValueText(), '-101');
  assert.equal(createDisplayRuler({ value: -1000000n, displayRadix: 64, digits: B64 }).getValueText(), '-D0JA');
});

test('padding applies to the magnitude, so the sign stays in front', () => {
  assert.equal(createDisplayRuler({ value: -5n, displayRadix: 2, padTo: 8 }).getValueText(), '-00000101');
  assert.equal(createDisplayRuler({ value: 5n, displayRadix: 2, padTo: 8 }).getValueText(), '00000101');
  assert.equal(createDisplayRuler({ value: -0xFFn, displayRadix: 16, padTo: 6 }).getValueText(), '-0000ff');
});

test('the tooltip shows the sign and measures elision on digits alone', () => {
  const ruler = createDisplayRuler({ value: -12345n });
  assert.equal(formatValueOf(ruler), '< -12345 >');
  const huge = createDisplayRuler({ value: -(10n ** 40n) });
  const text = formatValueOf(huge);
  assert.ok(text.startsWith('< -'), text);
  assert.ok(text.includes('41 digits'), text);
});

test('tick rhythm derives from the base, and base 10 keeps the historical values', () => {
  const cases = [
    [10, { major: 10, mid: 5, cycle: 100 }],
    [2, { major: 2, mid: 2, cycle: 4 }],
    [8, { major: 8, mid: 4, cycle: 64 }],
    [16, { major: 16, mid: 8, cycle: 256 }],
    [64, { major: 64, mid: 32, cycle: 4096 }]
  ];
  for (const [base, want] of cases) {
    assert.deepEqual(Oomph.tickRhythmFor(base), want, `base ${base}`);
  }
  // one major interval must span exactly one digit of the next place up
  for (const base of [2, 3, 8, 10, 16, 36]) {
    assert.equal(Oomph.tickRhythmFor(base).major, base, `base ${base} major`);
  }
  // base 1 is unary and has no radix, so it falls back to the decimal rhythm
  assert.deepEqual(Oomph.tickRhythmFor(1), { major: 10, mid: 5, cycle: 100 });
});

test('DEFAULTS advertise auto tick rhythm and base-following display', () => {
  assert.equal(Oomph.defaults.majorTickEvery, 'auto');
  assert.equal(Oomph.defaults.midTickEvery, 'auto');
  assert.equal(Oomph.defaults.visualCycleEvery, 'auto');
  assert.equal(Oomph.defaults.displayRadix, 'base');
  assert.equal(Oomph.defaults.digits, null);
  assert.equal(Oomph.defaults.padTo, 0);
});

test('a custom alphabet is rejected in float64 rather than silently ignored', () => {
  assert.throws(
    () => Object.create(Oomph.prototype)._readOptions({ mode: 'float64', digits: 'abc', base: 10, rulers: 3 }),
    /custom alphabet.*bigint mode/
  );
  // the same alphabet is fine for exact integers
  const ok = Object.create(Oomph.prototype);
  ok._readOptions({ mode: 'bigint', digits: 'abc', base: 3, rulers: 3 });
  assert.deepEqual(ok.digits, ['a', 'b', 'c']);
  assert.equal(ok.displayRadix, 3);
});

test('digits rejects alphabets that cannot address a digit unambiguously', () => {
  const read = (digits) => Object.create(Oomph.prototype)._readOptions({ digits, base: 10, rulers: 3 });
  assert.throws(() => read('aab'), /must not repeat/);
  assert.throws(() => read('a'), /at least two characters/);
  assert.throws(() => read(16), /must be a string/);
});

test('base past 36 needs an alphabet, and falls back to decimal text without one', () => {
  const bare = Object.create(Oomph.prototype);
  bare._readOptions({ base: 64, rulers: 3 });
  assert.equal(bare.base, 64, 'base 64 steps are still allowed');
  assert.equal(bare.displayRadix, 10, 'but there is no built-in alphabet to write them in');
});

test('float64 text follows the value after step quantisation, not before', () => {
  // 255.5 on a ruler whose finest step is 1 is 256, and 256 in hex is 100.
  assert.equal(createDisplayRuler({ value: 256, mode: 'float64', displayRadix: 16 }).getValueText(), '100');
  // with a fractional step the half survives
  assert.equal(createDisplayRuler({ value: 255.5, mode: 'float64', displayRadix: 16 }).getValueText(), 'ff.8');
});

test('tickGapStep changes notch spacing by a fixed number of pixels per band', () => {
  const ruler = Object.create(Oomph.prototype);
  ruler._readOptions({ rulers: 4, tickGap: 10, tickGapStep: 1.5 });
  assert.deepEqual(ruler._tickScales(), [1, 1.15, 1.3, 1.45]);

  ruler._readOptions({ tickGapStep: -2 });
  assert.deepEqual(ruler._tickScales(), [1, 0.8, 0.6, 0.4], 'negative steps tighten coarser bands');

  ruler._readOptions({ tickGapStep: -10 });
  assert.deepEqual(
    ruler._tickScales().map((scale) => scale * 10),
    [10, 7.333333333333334, 4.666666666666667, 2],
    'past the floor the step relaxes so the last band lands on it'
  );

  ruler._readOptions({ tickGapStep: 0 });
  assert.deepEqual(ruler._tickScales(), [1, 1, 1, 1]);
  assert.equal(Oomph.defaults.tickGapStep, 0);
});
