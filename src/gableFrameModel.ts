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
import { generateBrickWallBlock, BRICK_WALL_THICKNESS_MM } from './brickWallBlock.js';

export interface GableFrameModelParams {
  spanMm: number;          // clear span, column centreline to column centreline
  depthMm: number;         // building depth (front → back) — the plan's other axis
  pitchDeg: number;
  eaveHeightMm: number;    // column height (ground → eave bearing)
  nFrames: number;         // number of frames along the depth
  purlinSpacingMm: number; // purlin spacing across the span (from engineering)
  // 'gable-end' = tied truss + infill (rafters/chord/droppers, e.g. RHS 100×50×3);
  // 'portal'    = untied moment frame (rafters + columns only, e.g. C300×70 + plate).
  frameType: 'gable-end' | 'portal';
  label?: string;          // section call-out, e.g. 'A-A' / 'B-B' / 'C-C'
  cutFrameIndex?: number;  // which frame (0..nFrames-1) this section cuts — highlighted in plan
  rafter: Section;         // sloping rafter
  column: Section;         // column
  chord?: Section;         // gable bottom-chord tie (gable-end only)
  dropper?: Section;       // gable infill dropper (gable-end only)
  purlin?: Section;        // purlin (for the roof-plan line width)
  nBays?: number;          // infill bays across the span (interior droppers = nBays − 1)
  dropperSpacingMm?: number; // infill dropper spacing (centred on the apex, symmetric)
  rafterOffsetMm?: number; // rafter set-back from the wall/fascia to clear the gutter
  gutterWidthMm?: number;  // gutter width (Intelligence) — passed through to the wall block
  plateOnRafter?: boolean; // close the C open face with a plate
  plateOnColumn?: boolean;
  // When the structure attaches to an existing brick-veneer dwelling, draw that wall
  // detail on both sides instead of steel columns. The clear span (spanMm) is the gap
  // between the inner brick faces. Fascia/gutter heights come from Site Intelligence.
  wall?: { eaveHeightMm: number; fasciaBottomMm?: number; fasciaTopMm?: number };
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
  const isGableEnd = p.frameType === 'gable-end';
  const dR = parseSectionDims(p.rafter);
  const dC = parseSectionDims(p.column);
  const dCh = parseSectionDims(p.chord ?? p.rafter);
  const dD = parseSectionDims(p.dropper ?? p.rafter);
  const S = p.spanMm;
  const half = S / 2;
  const pitch = (p.pitchDeg * Math.PI) / 180;
  const tan = Math.tan(pitch);
  const H = p.eaveHeightMm;
  const fs = Math.max(120, S * 0.018); // call-out font size (mm)

  // Rafter set-back from the wall/fascia to clear the gutter (gable-end only). The rafter
  // begins here and must not run past it toward the wall; the bottom chord runs the full
  // span to the fascia underneath it.
  const offset = isGableEnd ? Math.max(0, p.rafterOffsetMm ?? 0) : 0;
  const run = Math.max(1, half - offset);
  const rafterRise = run * tan;
  const vThick = dR.d / Math.cos(pitch);   // plumb-cut (vertical) thickness of the rafter

  // ── SECTION vertical datum: apex PEAK at y=0, working downward ──
  const ridgeTopY = 0;                     // top face at the ridge (apex peak)
  const ridgeUnderY = ridgeTopY + vThick;  // rafter underside at the ridge
  const bearY = ridgeUnderY + rafterRise;  // eave bearing = chord top = rafter underside at eave
  const baseY = bearY + H;                  // FFL / ground
  const apexY = ridgeTopY;                  // aliases for the plan placement below
  const eaveY = bearY;

  const xs: number[] = [], ys: number[] = [];
  const track = (m: { xs: number[]; ys: number[] }) => { xs.push(...m.xs); ys.push(...m.ys); };
  ys.push(ridgeTopY, bearY, baseY);
  let sec = '';

  // Sides: existing brick-veneer walls and/or steel columns. Gable-end trusses bear on
  // the walls; the portal keeps its moment-frame columns standing against the wall line.
  if (p.wall) {
    const common = { fflY: baseY, eaveHeightMm: p.wall.eaveHeightMm, fasciaBottomMm: p.wall.fasciaBottomMm, fasciaTopMm: p.wall.fasciaTopMm, gutterWidthMm: p.gutterWidthMm };
    sec += generateBrickWallBlock({ ...common, innerFaceX: 0, mirror: false });
    sec += generateBrickWallBlock({ ...common, innerFaceX: S, mirror: true });
    xs.push(-BRICK_WALL_THICKNESS_MM, S + BRICK_WALL_THICKNESS_MM);
    ys.push(baseY + 100);
  }
  if (!p.wall || !isGableEnd) {
    for (const cx of [0, S]) {
      sec += `<rect x="${r1(cx - dC.d / 2)}" y="${r1(bearY)}" width="${r1(dC.d)}" height="${r1(baseY - bearY)}" fill="${COL.column.fill}" stroke="${COL.column.stroke}" stroke-width="3"/>`;
      if (p.plateOnColumn) {
        const px = cx > 0 ? cx - dC.d / 2 : cx + dC.d / 2;
        sec += `<line x1="${r1(px)}" y1="${r1(bearY)}" x2="${r1(px)}" y2="${r1(baseY)}" stroke="${COL.plate}" stroke-width="5"/>`;
      }
      xs.push(cx - dC.d / 2, cx + dC.d / 2); ys.push(bearY, baseY);
    }
  }
  // Bottom-chord tie — runs the full clear span to the fascia (gable-end only); top at the
  // bearing line so the rafter underside sits on it.
  if (isGableEnd) {
    const m = memberBand(0, bearY, S, bearY, dCh.d, COL.chord, dCh.t, false);
    sec += m.svg; track(m);
  }
  // Rafter underside height at span position x (used by the droppers).
  const rafterUnderY = (x: number) => {
    const dist = x <= half ? (x - offset) : ((S - offset) - x);
    return bearY - Math.max(0, dist) * tan;
  };
  // Rafters — parallelogram with plumb (vertical) cuts at the eave (offset) and ridge so
  // the two butt cleanly at the apex (no overlap). Underside bears on the chord top.
  const rafterQuad = (eaveX: number) => {
    const pts: [number, number][] = [[eaveX, bearY], [half, ridgeUnderY], [half, ridgeTopY], [eaveX, bearY - vThick]];
    let s = `<polygon points="${pts.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}" fill="${COL.rafter.fill}" stroke="${COL.rafter.stroke}" stroke-width="3"/>`;
    s += `<line x1="${r1(eaveX)}" y1="${r1(bearY - vThick)}" x2="${r1(half)}" y2="${r1(ridgeTopY)}" stroke="${COL.rafter.stroke}" stroke-width="1.6" opacity="0.5"/>`;
    if (p.plateOnRafter) s += `<line x1="${r1(eaveX)}" y1="${r1(bearY)}" x2="${r1(half)}" y2="${r1(ridgeUnderY)}" stroke="${COL.plate}" stroke-width="5"/>`;
    xs.push(eaveX, half); ys.push(ridgeTopY, bearY);
    return s;
  };
  sec += rafterQuad(offset) + rafterQuad(S - offset);

  // Infill droppers (gable-end) — drawn with the 100mm face toward the viewer (side view),
  // centred on the apex and symmetric to both sides; chord top → rafter underside.
  const dropXs: number[] = [];
  if (isGableEnd && p.dropper) {
    const sp = Math.max(150, p.dropperSpacingMm ?? 900);
    for (let x = half; x > offset + 1; x -= sp) {
      dropXs.push(x);
      if (Math.abs(x - half) > 1) dropXs.push(S - x);
    }
    for (const x of dropXs) {
      const underY = rafterUnderY(x);
      sec += `<rect x="${r1(x - dD.d / 2)}" y="${r1(underY)}" width="${r1(dD.d)}" height="${r1(bearY - underY)}" fill="${COL.dropper.fill}" stroke="${COL.dropper.stroke}" stroke-width="3"/>`;
      xs.push(x - dD.d / 2, x + dD.d / 2); ys.push(underY, bearY);
    }
  }
  // Ground line
  sec += `<line x1="${r1(-BRICK_WALL_THICKNESS_MM - 100)}" y1="${r1(baseY)}" x2="${r1(S + BRICK_WALL_THICKNESS_MM + 100)}" y2="${r1(baseY)}" stroke="#666" stroke-width="4"/>`;

  // ── PLAN (roof, top view) — span × building depth, above the section, same span axis ──
  // The whole roof from above at 1:1: each portal frame is a rafter band running across
  // the span; purlins run along the depth at their span spacing; ridge + eaves down the
  // centre/edges. Span (x) is shared with the section, so eaves/ridge/purlins project.
  const D = p.depthMm;
  const nF = Math.max(2, p.nFrames);
  const dP = p.purlin ? parseSectionDims(p.purlin) : dD;
  const planGap = Math.max(800, H * 0.35);
  const planBot = apexY - planGap;       // plan sits above the section apex
  const planTop = planBot - D;
  let plan = '';
  // roof extent
  plan += `<rect x="0" y="${r1(planTop)}" width="${r1(S)}" height="${r1(D)}" fill="rgba(120,130,160,0.05)" stroke="#6b7090" stroke-width="2"/>`;
  // purlin lines (along the depth): one 50mm from the apex, marching to the eave, with the
  // eave-end purlin flush with the rafter end face (at the rafter offset).
  const purlinXs: number[] = [];
  for (let x = half - 50; x > offset + 1; x -= p.purlinSpacingMm) { purlinXs.push(x); purlinXs.push(S - x); }
  purlinXs.push(offset, S - offset);
  for (const x of purlinXs) {
    plan += `<rect x="${r1(x - dP.b / 2)}" y="${r1(planTop)}" width="${r1(dP.b)}" height="${r1(D)}" fill="${COL.dropper.fill}" stroke="${COL.dropper.stroke}" stroke-width="1.5" opacity="0.75"/>`;
  }
  // frames (rafter bands) across the span at each depth station; highlight the cut frame
  const cutIdx = p.cutFrameIndex ?? 0;
  for (let i = 0; i < nF; i++) {
    const y = planTop + (i / (nF - 1)) * D;
    const isCut = i === cutIdx;
    const bandW = Math.max(dR.b, 60);
    plan += `<rect x="0" y="${r1(y - bandW / 2)}" width="${r1(S)}" height="${r1(bandW)}" fill="${isCut ? 'rgba(224,86,78,0.18)' : COL.rafter.fill}" stroke="${isCut ? COL.plate : COL.rafter.stroke}" stroke-width="${isCut ? 5 : 3}"/>`;
  }
  // cut line + label for this section through the highlighted frame
  {
    const yCut = planTop + (cutIdx / (nF - 1)) * D;
    const lab = p.label ?? 'A-A';
    plan += `<text x="${r1(-fs)}" y="${r1(yCut + fs * 0.35)}" font-family="${FONT}" font-size="${r1(fs)}" fill="${COL.plate}" text-anchor="end">${lab}</text>`;
    plan += `<text x="${r1(S + fs)}" y="${r1(yCut + fs * 0.35)}" font-family="${FONT}" font-size="${r1(fs)}" fill="${COL.plate}" text-anchor="start">${lab}</text>`;
  }
  // ridge + eaves down the plan
  for (const [x, w] of [[0, 3], [half, 4], [S, 3]] as [number, number][]) {
    plan += `<line x1="${r1(x)}" y1="${r1(planTop)}" x2="${r1(x)}" y2="${r1(planBot)}" stroke="${x === half ? '#e8c060' : '#9aa0bb'}" stroke-width="${w}"/>`;
  }
  xs.push(0, S); ys.push(planTop, planBot);

  // ── Projection guides: eaves, ridge, purlins — plan → section ──
  let guides = '';
  const guideXs = [0, half, S, ...purlinXs];
  for (const gx of guideXs) {
    guides += `<line x1="${r1(gx)}" y1="${r1(planTop)}" x2="${r1(gx)}" y2="${r1(baseY)}" stroke="${COL.guide}" stroke-width="1.5" stroke-dasharray="6 10" opacity="0.45"/>`;
  }

  // ── Member call-outs ──
  const label = (x: number, y: number, s: string, anchor = 'start') =>
    `<text x="${r1(x)}" y="${r1(y)}" font-family="${FONT}" font-size="${r1(fs)}" fill="${COL.text}" text-anchor="${anchor}">${s}</text>`;
  const lab = p.label ?? 'A-A';
  const frameKind = isGableEnd ? 'GABLE END · INFILL' : 'PORTAL FRAME';
  let labels = '';
  labels += label(half, planTop - fs * 0.6, `ROOF PLAN (1:1) · ${nF} frames · purlins ${p.purlin?.size ?? ''}`, 'middle');
  labels += label((offset + half) / 2, (ridgeTopY + bearY) * 0.5 - fs, `RAFTER ${p.rafter.size}${p.plateOnRafter ? ' + PLATE' : ''}`, 'middle');
  if (isGableEnd && p.chord) labels += label(half, bearY + dCh.d + fs * 1.4, `BOTTOM CHORD ${p.chord.size}`, 'middle');
  if (isGableEnd && p.dropper && dropXs.length) labels += label(half + dD.d, bearY - (bearY - ridgeUnderY) * 0.45, `DROPPER ${p.dropper.size}`, 'start');
  // Column call-out (steel columns only — brick walls label themselves)
  if (!p.wall) labels += label(dC.d / 2 + fs * 0.5, (bearY + baseY) / 2, `COLUMN ${p.column.size}${p.plateOnColumn ? ' + PLATE' : ''}`, 'start');
  labels += label(half, baseY + fs * 1.6, `SECTION ${lab} · ${frameKind} · ${(S / 1000).toFixed(2)} m SPAN · 1:1`, 'middle');

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
