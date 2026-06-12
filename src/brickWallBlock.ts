// ── Brick-veneer wall block ──
// One existing-dwelling wall section — timber 90×45 stud + 30 cavity + 110 brick veneer,
// with the fascia C-section and gutter profile — drawn at 1:1 in mm. A reusable "block":
// drop one on each side of a section with its inner brick face on the span line, and the
// two face each other across the clear span. Fascia/gutter heights come from the site
// set-out (Draftly Intelligence), so the detail re-renders whenever that document changes.

const TW = 90;          // timber stud strip (mm)
const CW = 30;          // cavity (mm)
const BW = 110;         // brick veneer (mm)
const BRICK_STEP = 120; // brick finishes this far below the timber top
const SLAB_H = 100;     // footing slab depth (mm)
const COURSE = 76;      // brick course height (mm)

/** Total wall thickness (inner brick face → outer timber face), mm. */
export const BRICK_WALL_THICKNESS_MM = BW + CW + TW; // 230

export interface BrickWallBlockOpts {
  innerFaceX: number;       // x of the inner brick face (the span side), mm
  fflY: number;             // finished floor level, y (mm)
  eaveHeightMm: number;     // FFL → top of timber (wall height)
  fasciaBottomMm?: number;  // mm above FFL — bottom of fascia (Intelligence `fasciaHeight`)
  fasciaTopMm?: number;     // mm above FFL — top of fascia / eave (Intelligence `gutterHeight`)
  mirror?: boolean;         // false = wall on the LEFT (span to its right); true = right wall
  showGutter?: boolean;     // default true
  showLabels?: boolean;     // member call-outs (default true)
}

const C = {
  brickFill: 'rgba(190,105,50,0.45)', brickStroke: '#c0632a',
  timberFill: 'rgba(200,168,70,0.35)', timberStroke: '#a08030',
  concFill: 'rgba(130,130,130,0.28)', concStroke: '#888',
  fascia: '#2196f3', gutter: '#c8cce0', text: '#c8cce0',
};
const FONT = 'DM Mono,monospace';
const r = (n: number) => n.toFixed(1);

/** Returns an SVG `<g>` fragment (mm coords) — embed inside a 1:1 model SVG. */
export function generateBrickWallBlock(o: BrickWallBlockOpts): string {
  const out = o.mirror ? 1 : -1;       // direction into the wall (away from span)
  const sp = -out;                     // direction into the span
  const inner = o.innerFaceX;
  const fflY = o.fflY;
  const mmToY = (mm: number) => fflY - mm;
  const eaveH = o.eaveHeightMm;
  const brickH = Math.max(0, eaveH - BRICK_STEP);
  const timberTopY = mmToY(eaveH);
  const brickTopY = mmToY(brickH);

  const rectXX = (x0: number, x1: number, y: number, h: number, fill: string, stroke: string, sw = 3) => {
    const x = Math.min(x0, x1), w = Math.abs(x1 - x0);
    return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  };
  const ln = (x1: number, y1: number, x2: number, y2: number, c: string, sw = 3, dash = '') =>
    `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${c}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;

  // ── X build-up from the inner brick face outward ──
  const brickOuterX = inner + out * BW;
  const cavOuterX = brickOuterX + out * CW;
  const timberOuterX = cavOuterX + out * TW;

  let s = `<g data-block="brick-wall">`;
  // footing slab under the wall
  s += rectXX(inner, timberOuterX, fflY, SLAB_H, C.concFill, C.concStroke, 3);
  // timber stud
  s += rectXX(cavOuterX, timberOuterX, timberTopY, fflY - timberTopY, C.timberFill, C.timberStroke, 3);
  // brick veneer (finishes lower)
  s += rectXX(inner, brickOuterX, brickTopY, fflY - brickTopY, C.brickFill, C.brickStroke, 3);
  // brick courses + timber grain (cosmetic, part of the detail)
  for (let cy = brickTopY + COURSE; cy < fflY; cy += COURSE) s += ln(inner, cy, brickOuterX, cy, C.brickStroke, 1.2);
  for (let ty = timberTopY + 110; ty < fflY; ty += 110) s += ln(cavOuterX, ty, timberOuterX, ty, C.timberStroke, 1);

  // ── Fascia C-section at the inner brick face, web projecting into the span ──
  const fBotY = o.fasciaBottomMm != null ? mmToY(o.fasciaBottomMm) : brickTopY + 10;
  const fTopY = o.fasciaTopMm != null ? mmToY(o.fasciaTopMm) : fBotY - 200;
  const fDepth = 30;
  const webX = inner + sp * fDepth;
  s += ln(webX, fTopY, webX, fBotY, C.fascia, 6);
  s += ln(webX, fTopY, inner, fTopY, C.fascia, 6);
  s += ln(webX, fBotY, inner, fBotY, C.fascia, 6);

  // ── Gutter profile, hung below the fascia, into the span ──
  if (o.showGutter !== false) {
    const fasciaH = o.fasciaTopMm != null && o.fasciaBottomMm != null ? Math.max(1, o.fasciaTopMm - o.fasciaBottomMm) : 200;
    const v = fasciaH / 200;
    const gutW = 115, gutLegL = 62 * v, gutLegR = 90 * v, gutGap = 110 * v, gutHook = 8, gutHookUp = 6;
    const gutBotY = fBotY - gutGap;
    const gInnX = inner + sp * 30;
    const gOutX = gInnX + sp * gutW;
    s += ln(gInnX, gutBotY, gOutX, gutBotY, C.gutter, 4);
    s += ln(gInnX, gutBotY, gInnX, gutBotY - gutLegL, C.gutter, 4);
    s += ln(gOutX, gutBotY, gOutX, gutBotY - gutLegR, C.gutter, 4);
    s += ln(gOutX, gutBotY - gutLegR, gOutX + sp * gutHook, gutBotY - gutLegR, C.gutter, 4);
    s += ln(gOutX + sp * gutHook, gutBotY - gutLegR, gOutX + sp * gutHook, gutBotY - gutLegR - gutHookUp, C.gutter, 4);
  }

  if (o.showLabels !== false) {
    const fs = 120;
    const tx = (timberOuterX + inner) / 2;
    s += `<text x="${r(tx)}" y="${r(fflY - eaveH / 2)}" font-family="${FONT}" font-size="${fs}" fill="${C.text}" text-anchor="middle" transform="rotate(-90 ${r(tx)} ${r(fflY - eaveH / 2)})">BRICK VENEER · 90×45 STUD</text>`;
  }
  s += `</g>`;
  return s;
}
