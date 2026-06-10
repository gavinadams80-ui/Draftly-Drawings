// Verify the side elevation draws the existing dwelling to the single-storey
// wall-section eave line (from the as-sited DesignSet heights) rather than up to
// the NEW structure's ridge — so the side elevation and wall section agree.
//
// Run after `npm run build`:  node scripts/verify-side-elevation.mjs
// Writes the rendered SVG to scripts/out/ for visual inspection.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseDesignSet, generateSideElevationSVG } from '../dist/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const ds = parseDesignSet(readFileSync(join(root, 'fixtures', 'sample.designset.json'), 'utf8'));
const g = ds.geometry;
const r = ds.results ?? {};

const args = [
  g.depth / 1000,
  (r.eaveHeight ?? g.height) / 1000,
  g.width / 1000,
  g.pitch,
  g.roofType === 'gable',
  g.portalFrameCount,
  g.attachment,
];

// Older export: no heights → dwelling runs to the new ridge (previous behaviour).
const baseline = generateSideElevationSVG(...args);
// With the same as-sited heights threaded into the wall section.
const sited = generateSideElevationSVG(...args, {
  eaveHeight: r.eaveHeight,
  gutterHeight: r.gutterHeight,
  fasciaHeight: r.fasciaHeight,
  standoff: g.standoff,
  existingGutterOverhangMm: r.existingGutterOverhangMm,
});

// The dwelling block is the rect at x = ML - hw = 60 - 26 = 34.
const dwellTopY = (svg) => {
  const m = svg.match(/<rect x="34" y="([\d.]+)"/);
  return m ? parseFloat(m[1]) : NaN;
};
// The new structure's ridge is the dashed line (stroke-dasharray="6,3").
const ridgeLineY = (svg) => {
  const m = svg.match(/<line[^>]*y1="([\d.]+)"[^>]*stroke-dasharray="6,3"/);
  return m ? parseFloat(m[1]) : NaN;
};

const baseDwell = dwellTopY(baseline);
const sitedDwell = dwellTopY(sited);
const ridgeY = ridgeLineY(sited);

// Larger Y = lower on the page = shorter building.
const checks = [
  ['baseline renders', baseline.startsWith('<svg') && baseline.endsWith('</svg>')],
  ['sited differs from baseline', sited !== baseline],
  ['existing dwelling drawn', sited.includes('EXISTING') && sited.includes('DWELLING')],
  [`sited dwelling below ridge (dwellY ${sitedDwell.toFixed(1)} > ridgeY ${ridgeY.toFixed(1)})`,
    sitedDwell > ridgeY + 1],
  [`baseline dwelling at ridge (dwellY ${baseDwell.toFixed(1)} ≈ ridgeY ${ridgeY.toFixed(1)})`,
    Math.abs(baseDwell - (ridgeY - 6)) < 1],
  ['sited dwelling shorter than baseline', sitedDwell > baseDwell + 1],
];

let ok = true;
for (const [name, pass] of checks) {
  console.log(`${pass ? '  ok ' : 'FAIL '} ${name}`);
  if (!pass) ok = false;
}

mkdirSync(join(here, 'out'), { recursive: true });
writeFileSync(join(here, 'out', 'side-elevation.sited.svg'), sited);
writeFileSync(join(here, 'out', 'side-elevation.baseline.svg'), baseline);
console.log('\nSVGs written to scripts/out/ (sited + baseline).');

if (!ok) { console.error('\nVERIFY FAILED'); process.exit(1); }
console.log('VERIFY PASSED');
