// ── Gable frame — 1:1 model (top view + Section A-A) ──
// A true-scale (real-mm) model of one gable frame, drawn from real steel members
// instead of meaningless polylines. The SECTION (side elevation) shows the assembled
// frame — two rafters to the ridge, the bottom-chord tie, the infill droppers and the
// columns — each as its actual section (depth from the catalogue, C lips / RHS box,
// plate on the C open face when boxed). The PLAN (top view) sits directly above on the
// same span axis so eaves, ridge and dropper lines project straight up/down.
//
// No page furniture (title block / dimension chains / hatching) — that belongs on a
// layout sheet. Member size call-outs are kept (they're fabrication content, not page
// detail). Everything is in mm at 1:1; the consumer scales mm→px on the layout.

import type { Section } from './types.js';
import { parseSectionDims } from './drawings.js';

export interface GableFrameModelParams {
  spanMm: number;          // clear span, column centreline to column centreline
  pitchDeg: number;
  eaveHeightMm: number;    // column height (ground → eave bearing)
  rafter: Section;         // portal rafter
  column: Section;         // portal column
  chord: Section;          // gable bottom-chord tie
  dropper: Section;        // gable infill dropper
  nBays?: number;          // infill bays across the span (interior droppers = nBays − 1)
  plateOnRafter?: boolean; // close the C open face with a plate
  plateOnColumn?: boolean;
}

const FONT = 'DM Mono,monospace';
const COL = {
  rafter:  { stroke: '#2196f3', fill: 'rgba(33,150,243,0.16)' },
  column:  { stroke: '#c9a84c', fill: 'rgba(201,168,76,0.14)' },
  chord:   { stroke: '#8bc34a', fill: 'rgba(139,195,26,0.14)' },
  dropper: { stroke: '#8bc34a', fill: 'rgba(139,195,26,0.10)' },
  plate:   '#e0564e',
  guide:   '#c9a84c',
  text:    '#c8cce0',
};

const r1 = (n: number) => n.toFixed(1);

/** Draw a real member as a rectangle from A→B with depth `dep` offset along `+normal`. */
function memberBand(
  ax: number, ay: number, bx: number, by: number, dep: number,
  c: { stroke: string; fill: string }, t: number, plate: boolean,
): { svg: string; xs: number[]; ys: number[] } {
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  // normal chosen to point "down/inward" (positive-y side) so depth hangs below the face
  let nx = uy, ny = -ux;
  if (ny < 0) { nx = -nx; ny = -ny; }
  const p = (x: number, y: number) => `${r1(x)},${r1(y)}`;
  const c1 = [ax, ay], c2 = [bx, by], c3 = [bx + nx * dep, by + ny * dep], c4 = [ax + nx * dep, ay + ny * dep];
  const sw = Math.max(t * 0.5, 3);
  let svg = `<polygon points="${p(c1[0], c1[1])} ${p(c2[0], c2[1])} ${p(c3[0], c3[1])} ${p(c4[0], c4[1])}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}"/>`;
  // flange hint: a line one thickness in from the reference (top) face
  svg += `<line x1="${r1(ax + nx * t)}" y1="${r1(ay + ny * t)}" x2="${r1(bx + nx * t)}" y2="${r1(by + ny * t)}" stroke="${c.stroke}" stroke-width="${r1(sw * 0.6)}" opacity="0.55"/>`;
  // plate closes the open (far) face
  if (plate) {
    svg += `<line x1="${r1(c4[0])}" y1="${r1(c4[1])}" x2="${r1(c3[0])}" y2="${r1(c3[1])}" stroke="${COL.plate}" stroke-width="${r1(Math.max(t, 4))}"/>`;
  }
  return { svg, xs: [c1[0], c2[0], c3[0], c4[0]], ys: [c1[1], c2[1], c3[1], c4[1]] };
}

export function generateGableFrameModelSVG(p: GableFrameModelParams): string {
  const dR = parseSectionDims(p.rafter);
  const dC = parseSectionDims(p.column);
  const dCh = parseSectionDims(p.chord);
  const dD = parseSectionDims(p.dropper);
  const nBays = Math.max(2, p.nBays ?? Math.max(2, Math.round(p.spanMm / 1000)));

  const S = p.spanMm;
  const half = S / 2;
  const pitch = (p.pitchDeg * Math.PI) / 180;
  const rise = half * Math.tan(pitch);
  const H = p.eaveHeightMm;
  const rafLen = Math.hypot(half, rise);

  // ── SECTION (side) — apex at y=0, eave at y=rise, base at y=rise+H ──
  const apexY = 0, eaveY = rise, baseY = rise + H;
  const xs: number[] = [], ys: number[] = [];
  const track = (m: { xs: number[]; ys: number[] }) => { xs.push(...m.xs); ys.push(...m.ys); };
  let sec = '';

  // Columns (centreline at x=0 and x=S; depth = column section depth, straddling)
  for (const cx of [0, S]) {
    const m = memberBand(cx - dC.d / 2, baseY, cx - dC.d / 2, eaveY, dC.d, COL.column, dC.t, !!p.plateOnColumn);
    sec += m.svg; track(m);
  }
  // Bottom-chord tie at eave level, depth hangs below
  {
    const m = memberBand(0, eaveY, S, eaveY, dCh.d, COL.chord, dCh.t, false);
    sec += m.svg; track(m);
  }
  // Rafters: eave → ridge, depth hangs below the top face
  {
    const l = memberBand(0, eaveY, half, apexY, dR.d, COL.rafter, dR.t, !!p.plateOnRafter);
    const rr = memberBand(S, eaveY, half, apexY, dR.d, COL.rafter, dR.t, !!p.plateOnRafter);
    sec += l.svg + rr.svg; track(l); track(rr);
  }
  // Infill droppers: interior bay lines, from chord top (eaveY) up to the rafter underside
  const dropXs: number[] = [];
  for (let i = 1; i < nBays; i++) {
    const x = (S * i) / nBays;
    dropXs.push(x);
    // rafter underside y at this x (top face minus rafter depth along vertical ≈ dR.d/cos)
    const onLeft = x <= half;
    const topY = onLeft ? eaveY - (eaveY - apexY) * (x / half) : apexY + (eaveY - apexY) * ((x - half) / half);
    const underY = topY + dR.d / Math.cos(pitch);
    const m = memberBand(x - dD.b / 2, eaveY, x - dD.b / 2, underY, dD.b, COL.dropper, dD.t, false);
    sec += m.svg; track(m);
  }
  // Ground line
  sec += `<line x1="${r1(-dC.d)}" y1="${r1(baseY)}" x2="${r1(S + dC.d)}" y2="${r1(baseY)}" stroke="#666" stroke-width="4"/>`;

  // ── PLAN (top view) — roof seen from above, on the same span axis, above the section ──
  // Single-frame top view: the two rafter top-flanges (width = rafter.b) split at the ridge.
  const planGap = Math.max(700, H * 0.5);
  const planBandH = dR.b;
  const planTop = apexY - planGap - planBandH; // above the section apex
  let plan = '';
  plan += `<rect x="0" y="${r1(planTop)}" width="${r1(half)}" height="${r1(planBandH)}" fill="${COL.rafter.fill}" stroke="${COL.rafter.stroke}" stroke-width="3"/>`;
  plan += `<rect x="${r1(half)}" y="${r1(planTop)}" width="${r1(half)}" height="${r1(planBandH)}" fill="${COL.rafter.fill}" stroke="${COL.rafter.stroke}" stroke-width="3"/>`;
  // purlin/dropper grid lines across the roof plan (project to the section droppers)
  for (const x of dropXs) {
    plan += `<line x1="${r1(x)}" y1="${r1(planTop)}" x2="${r1(x)}" y2="${r1(planTop + planBandH)}" stroke="${COL.dropper.stroke}" stroke-width="2" opacity="0.7"/>`;
  }
  xs.push(0, S); ys.push(planTop, planTop + planBandH);

  // ── Projection guides: eaves, ridge, droppers — plan → section ──
  let guides = '';
  const guideXs = [0, half, S, ...dropXs];
  for (const gx of guideXs) {
    guides += `<line x1="${r1(gx)}" y1="${r1(planTop)}" x2="${r1(gx)}" y2="${r1(baseY)}" stroke="${COL.guide}" stroke-width="1.5" stroke-dasharray="6 10" opacity="0.5"/>`;
  }

  // ── Member call-outs ──
  const label = (x: number, y: number, s: string, anchor = 'start') =>
    `<text x="${r1(x)}" y="${r1(y)}" font-family="${FONT}" font-size="${r1(Math.max(120, S * 0.018))}" fill="${COL.text}" text-anchor="${anchor}">${s}</text>`;
  const fs = Math.max(120, S * 0.018);
  let labels = '';
  labels += label(half, planTop - fs * 0.6, `PLAN (top) · RAFTER ${p.rafter.size}`, 'middle');
  labels += label(half * 0.5, apexY + (eaveY - apexY) * 0.5 - fs, `RAFTER ${p.rafter.size}${p.plateOnRafter ? ' + PLATE' : ''}`, 'middle');
  labels += label(half, eaveY + dCh.d + fs * 1.4, `BOTTOM CHORD ${p.chord.size}`, 'middle');
  if (dropXs.length) labels += label(dropXs[Math.floor(dropXs.length / 2)] + dD.b, eaveY - rise * 0.35, `DROPPER ${p.dropper.size}`, 'start');
  // Column call-out kept inside the frame (just right of the left column)
  labels += label(dC.d / 2 + fs * 0.5, (eaveY + baseY) / 2, `COLUMN ${p.column.size}${p.plateOnColumn ? ' + PLATE' : ''}`, 'start');
  labels += label(half, baseY + fs * 1.6, `SECTION A-A · ${(S / 1000).toFixed(2)} m CLEAR SPAN · 1:1`, 'middle');

  // ── viewBox from bounds ──
  const pad = Math.max(600, S * 0.04);
  const minX = Math.min(...xs) - pad - dC.d, maxX = Math.max(...xs) + pad + dC.d;
  const minY = Math.min(...ys, planTop) - pad - fs * 2, maxY = Math.max(...ys, baseY) + pad + fs * 2;
  const w = maxX - minX, h = maxY - minY;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r1(minX)} ${r1(minY)} ${r1(w)} ${r1(h)}" ` +
    `style="width:100%;max-width:${r1(w)}px;display:block;" data-units="mm">` +
    `<rect x="${r1(minX)}" y="${r1(minY)}" width="${r1(w)}" height="${r1(h)}" fill="transparent"/>` +
    guides + plan + sec + labels +
    `</svg>`
  );
}
