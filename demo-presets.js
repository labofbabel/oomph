/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2026 Lior Ben-Gai
 */

/**
 * Workbench presets.
 *
 * These are not themes. Each one is a whole instrument: colour, tick rhythm,
 * cascade shape, band count, step base and exponent gap together. The set
 * exists to show the range the options actually cover — step ratios from 2 to
 * 10^6, three to eight bands, cascades that taper and cascades that grow,
 * light and dark — so `values` may name any control on the page.
 *
 * `base` sets both the ratio between adjacent bands and the radix the value is
 * written in, so the binary and hexadecimal presets really do read as binary
 * and hex. Tick fields are left blank, meaning "derive from base".
 *
 * Every preset states every field it cares about, including `mode` and
 * `showLabels`, so switching between them never leaves a stray setting behind.
 */
const THEME_PRESETS = {
  paper: {
    label: 'Paper — neutral default',
    values: {
      mode: 'bigint',
      numRulers: 5, base: 10, exponentGap: 1,
      layerSize: 32, layerSizeStep: -4,
      tickGap: 10, tickGapStep: 0, midTickEvery: '', majorTickEvery: '',
      pixelsPerUnit: 1, unitPosition: 'inside', showLabels: false,
      displayRadix: '', padTo: 0, digits: '',
      backgroundColor: '#f8fafc', edgeColor: '#ababab',
      minorColor: '#6e6e6e', minorWidth: 1, minorHeight: 65,
      midColor: '#9e9e9e', midWidth: 1, midHeight: 85,
      majorColor: '#0f172a', majorWidth: 1, majorHeight: 100
    }
  },

  blueprint: {
    label: 'Blueprint — dark, fine, labelled',
    values: {
      mode: 'bigint',
      numRulers: 6, base: 10, exponentGap: 2,
      layerSize: 26, layerSizeStep: -2,
      tickGap: 6, tickGapStep: 0, midTickEvery: '', majorTickEvery: '',
      pixelsPerUnit: 1, unitPosition: 'inside', showLabels: true,
      displayRadix: '', padTo: 0, digits: '',
      backgroundColor: '#0d1b2a', edgeColor: '#1b3a5c',
      minorColor: '#3d6a99', minorWidth: 1, minorHeight: 45,
      midColor: '#5fa8e8', midWidth: 1, midHeight: 75,
      majorColor: '#d8ecff', majorWidth: 1, majorHeight: 100
    }
  },

  midnight: {
    label: 'Midnight — few bands, high contrast',
    values: {
      mode: 'bigint',
      numRulers: 4, base: 10, exponentGap: 3,
      layerSize: 40, layerSizeStep: -6,
      tickGap: 14, tickGapStep: 0, midTickEvery: '', majorTickEvery: '',
      pixelsPerUnit: 1, unitPosition: 'inside', showLabels: false,
      displayRadix: '', padTo: 0, digits: '',
      backgroundColor: '#121212', edgeColor: '#2e2e2e',
      minorColor: '#565656', minorWidth: 1, minorHeight: 40,
      midColor: '#8a8a8a', midWidth: 1, midHeight: 70,
      majorColor: '#f5f5f5', majorWidth: 2, majorHeight: 100
    }
  },

  phosphor: {
    label: 'Octal — base 8, wide ticks',
    values: {
      mode: 'bigint',
      numRulers: 5, base: 8, exponentGap: 1,
      layerSize: 30, layerSizeStep: -3,
      tickGap: 16, tickGapStep: 0, midTickEvery: '', majorTickEvery: '',
      pixelsPerUnit: 1.5, unitPosition: 'outside', showLabels: true,
      displayRadix: '', padTo: 0, digits: '',
      backgroundColor: '#04140b', edgeColor: '#0d3a1f',
      minorColor: '#1f7a45', minorWidth: 1, minorHeight: 35,
      midColor: '#35c46b', midWidth: 1, midHeight: 70,
      majorColor: '#a8ffcb', majorWidth: 2, majorHeight: 100
    }
  },

  binary: {
    label: 'Binary — base 2, real bits',
    values: {
      mode: 'bigint',
      numRulers: 8, base: 2, exponentGap: 1, padTo: 8,
      layerSize: 22, layerSizeStep: -1,
      tickGap: 12, tickGapStep: 0, midTickEvery: '', majorTickEvery: '',
      pixelsPerUnit: 1, unitPosition: 'inside', showLabels: true,
      displayRadix: '', digits: '',
      backgroundColor: '#fdfdfd', edgeColor: '#d0d0d0',
      minorColor: '#b0b0b0', minorWidth: 1, minorHeight: 50,
      midColor: '#6366f1', midWidth: 1, midHeight: 80,
      majorColor: '#1e1b4b', majorWidth: 2, majorHeight: 100
    }
  },

  hexadecimal: {
    label: 'Hexadecimal — base 16',
    values: {
      mode: 'bigint',
      numRulers: 6, base: 16, exponentGap: 1, padTo: 6,
      layerSize: 30, layerSizeStep: -3,
      tickGap: 8, tickGapStep: 0, midTickEvery: '', majorTickEvery: '',
      pixelsPerUnit: 1, unitPosition: 'inside', showLabels: true,
      displayRadix: '', digits: '',
      backgroundColor: '#fff8f0', edgeColor: '#d8bfa0',
      minorColor: '#b08968', minorWidth: 1, minorHeight: 55,
      midColor: '#e07a3f', midWidth: 1, midHeight: 80,
      majorColor: '#4a2511', majorWidth: 1, majorHeight: 100
    }
  },

  seismic: {
    label: 'Seismic — base 10, gap 6, growing cascade',
    values: {
      mode: 'bigint',
      numRulers: 3, base: 10, exponentGap: 6,
      layerSize: 30, layerSizeStep: 14,
      tickGap: 22, tickGapStep: 6, midTickEvery: '', majorTickEvery: '',
      pixelsPerUnit: 2, unitPosition: 'inside', showLabels: true,
      displayRadix: '', padTo: 0, digits: '',
      backgroundColor: '#fff1f2', edgeColor: '#e8b4b8',
      minorColor: '#f0a0a8', minorWidth: 2, minorHeight: 30,
      midColor: '#e11d48', midWidth: 2, midHeight: 65,
      majorColor: '#4c0519', majorWidth: 3, majorHeight: 100
    }
  },

  base64: {
    label: 'Base 64 — custom alphabet',
    values: {
      mode: 'bigint',
      numRulers: 4, base: 64, exponentGap: 1, padTo: 0,
      layerSize: 34, layerSizeStep: -4,
      tickGap: 7, tickGapStep: 0, midTickEvery: '', majorTickEvery: '',
      pixelsPerUnit: 1, unitPosition: 'inside', showLabels: true,
      displayRadix: '',
      digits: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
      backgroundColor: '#faf5ff', edgeColor: '#c4b5d8',
      minorColor: '#a78bc4', minorWidth: 1, minorHeight: 45,
      midColor: '#7c3aed', midWidth: 1, midHeight: 75,
      majorColor: '#2e1065', majorWidth: 1, majorHeight: 100
    }
  },

  micrometer: {
    label: 'Micrometer — Float64, fractional scale',
    values: {
      mode: 'float64',
      numRulers: 5, base: 10, exponentGap: -1,
      layerSize: 34, layerSizeStep: -5,
      tickGap: 10, tickGapStep: 0, midTickEvery: '', majorTickEvery: '',
      pixelsPerUnit: 1, unitPosition: 'inside', showLabels: true,
      displayRadix: '', padTo: 0, digits: '',
      backgroundColor: '#f0fdfa', edgeColor: '#99d6cc',
      minorColor: '#5eada0', minorWidth: 1, minorHeight: 50,
      midColor: '#0d9488', midWidth: 1, midHeight: 78,
      majorColor: '#042f2e', majorWidth: 1, majorHeight: 100
    }
  }
};

export { THEME_PRESETS };
