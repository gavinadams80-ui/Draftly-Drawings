// ── Site / locality plan ──
// Draws the lot boundary (from the lat/lng polygon Site Intelligence captures)
// with the proposed structure positioned on it, boundary edge lengths, the
// measured setbacks and a north arrow. Output is a plain SVG string that
// withTitleBlock() places on an A3 sheet like every other drawing.
//
// Accuracy: if Intelligence sends the building `footprint` (4 corners), the
// structure is drawn exactly where it was placed. Otherwise it is positioned
// indicatively from the measured offsets against the lot's bounding box.

export interface LatLng { lat: number; lng: number }

export interface SitePlanData {
  lotPts: LatLng[];
  areaM2?: number;
  footprint?: LatLng[];
  offsets?: { front?: number; rear?: number; left?: number; right?: number };
  frontBoundaryIndex?: number;
  council?: string;
  // Fallback building size (m) when no footprint is supplied:
  buildingWidth?: number;
  buildingDepth?: number;

  // ── Optional extras (all graceful: omit ⇒ legacy behaviour) ──

  /** Aerial/satellite underlay drawn beneath the lot, georeferenced to `bbox`.
   *  `bbox` is [west, south, east, north] in lng/lat degrees. Supply the image
   *  as a base64 string (raw or full data URL) or a `url`. */
  aerial?: { imageBase64?: string; url?: string; bbox: [number, number, number, number] };

  /** Ridge / roof-pitch direction across the footprint. Provide either an explicit
   *  line (`roofLine`, lat/lng endpoints) or a compass `ridgeBearing` in degrees
   *  (0 = north, 90 = east, clockwise) drawn through the footprint centroid. */
  ridgeBearing?: number;
  roofLine?: { from: LatLng; to: LatLng };

  /** Which footprint sides fix to the existing dwelling — those edges are
   *  highlighted. front = southern edge, back = north, left = west, right = east. */
  attachmentDetail?: { sides?: { front?: boolean; back?: boolean; left?: boolean; right?: boolean } };
}

interface Pt { x: number; y: number } // local metres: x east, y north

// Equirectangular projection about the lot centroid — accurate at parcel scale.
function project(pts: LatLng[]): { toM: (p: LatLng) => Pt } {
  const lat0 = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const lng0 = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
  const mPerDegLat = 110540;
  const mPerDegLng = 111320 * Math.cos((lat0 * Math.PI) / 180);
  return {
    toM: (p: LatLng): Pt => ({
      x: (p.lng - lng0) * mPerDegLng,
      y: (p.lat - lat0) * mPerDegLat,
    }),
  };
}

function shoelaceArea(pts: Pt[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(a) / 2;
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const VB_W = 660;
const VB_H = 500;
const MARGIN = 78;

const mono = 'DM Mono,monospace';
const lineCol = '#c8cce0';
const dimCol = '#9aa0bc';
const bldgStroke = '#c9a84c';
const bldgFill = 'rgba(201,168,76,0.18)';
const ridgeCol = '#e8c060';   // ridge / roof-direction line
const connCol = '#e8643c';    // highlighted side fixed to the dwelling

// Escape a value for safe use inside an XML attribute (image href / url).
function xmlAttr(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Returns an SVG string for the site plan, or '' if there isn't enough geometry. */
export function generateSitePlanSVG(d: SitePlanData): string {
  if (!d.lotPts || d.lotPts.length < 3) return '';

  const proj = project([...d.lotPts, ...(d.footprint ?? [])]);
  const lot = d.lotPts.map(proj.toM);

  // Building footprint in metres — exact from footprint, else indicative from offsets.
  let bldg: Pt[] | null = null;
  let indicative = false;
  if (d.footprint && d.footprint.length >= 3) {
    bldg = d.footprint.map(proj.toM);
  } else if (d.buildingWidth && d.buildingDepth) {
    indicative = true;
    const minX = Math.min(...lot.map((p) => p.x));
    const maxX = Math.max(...lot.map((p) => p.x));
    const minY = Math.min(...lot.map((p) => p.y));
    const front = d.offsets?.front ?? 1;
    const left = d.offsets?.left ?? 1;
    const x0 = minX + left;
    const y0 = minY + front; // front taken as the southern (lower) boundary
    const w = Math.min(d.buildingWidth, maxX - minX - left);
    const dep = d.buildingDepth;
    bldg = [
      { x: x0, y: y0 },
      { x: x0 + w, y: y0 },
      { x: x0 + w, y: y0 + dep },
      { x: x0, y: y0 + dep },
    ];
  }

  // ── Fit transform (north up) ──
  const all = [...lot, ...(bldg ?? [])];
  const minX = Math.min(...all.map((p) => p.x));
  const maxX = Math.max(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const maxY = Math.max(...all.map((p) => p.y));
  const spanX = Math.max(0.001, maxX - minX);
  const spanY = Math.max(0.001, maxY - minY);
  const scale = Math.min((VB_W - 2 * MARGIN) / spanX, (VB_H - 2 * MARGIN) / spanY);
  const offX = (VB_W - spanX * scale) / 2;
  const offY = (VB_H - spanY * scale) / 2;
  const sx = (x: number) => offX + (x - minX) * scale;
  const sy = (y: number) => VB_H - offY - (y - minY) * scale; // flip: north up

  const poly = (pts: Pt[]) => pts.map((p) => `${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}">`;

  // ── Aerial underlay (drawn first, beneath everything; georeferenced to bbox) ──
  if (d.aerial && (d.aerial.imageBase64 || d.aerial.url)) {
    const [w, sLat, e, n] = d.aerial.bbox;
    // bbox corners → local metres → screen. Projection is linear in lat/lng and
    // north is up, so the image maps to an axis-aligned rect (NW = west/north).
    const nw = proj.toM({ lat: n, lng: w });
    const se = proj.toM({ lat: sLat, lng: e });
    const xL = sx(nw.x), xR = sx(se.x);
    const yT = sy(nw.y), yB = sy(se.y);
    const iw = xR - xL, ih = yB - yT;
    if (iw > 0 && ih > 0) {
      const raw = d.aerial.imageBase64
        ? (d.aerial.imageBase64.startsWith('data:') ? d.aerial.imageBase64 : `data:image/png;base64,${d.aerial.imageBase64}`)
        : (d.aerial.url as string);
      // Clip the underlay to the viewBox so an oversized bbox can't bleed past the sheet.
      s += `<clipPath id="sheetClip"><rect x="0" y="0" width="${VB_W}" height="${VB_H}"/></clipPath>`;
      s += `<image href="${xmlAttr(raw)}" x="${xL.toFixed(1)}" y="${yT.toFixed(1)}" width="${iw.toFixed(1)}" height="${ih.toFixed(1)}" preserveAspectRatio="none" opacity="0.85" clip-path="url(#sheetClip)"/>`;
    }
  }

  // Lot boundary
  s += `<polygon points="${poly(lot)}" fill="rgba(255,255,255,0.03)" stroke="${lineCol}" stroke-width="1.4"/>`;

  // Boundary edge lengths (+ FRONT label on the labelled edge)
  for (let i = 0; i < lot.length; i++) {
    const a = lot[i];
    const b = lot[(i + 1) % lot.length];
    const len = dist(a, b);
    const mx = (sx(a.x) + sx(b.x)) / 2;
    const my = (sy(a.y) + sy(b.y)) / 2;
    s += `<text x="${mx.toFixed(1)}" y="${my.toFixed(1)}" font-family="${mono}" font-size="8" fill="${dimCol}" text-anchor="middle">${len.toFixed(2)} m</text>`;
    if (d.frontBoundaryIndex === i) {
      s += `<text x="${mx.toFixed(1)}" y="${(my + 10).toFixed(1)}" font-family="${mono}" font-size="7" fill="${bldgStroke}" text-anchor="middle">FRONT</text>`;
    }
  }

  // Building footprint
  if (bldg) {
    s += `<polygon points="${poly(bldg)}" fill="${bldgFill}" stroke="${bldgStroke}" stroke-width="1.6"/>`;

    // Footprint centroid (metres + screen)
    const cM = {
      x: bldg.reduce((t, p) => t + p.x, 0) / bldg.length,
      y: bldg.reduce((t, p) => t + p.y, 0) / bldg.length,
    };
    const cx = sx(cM.x);
    const cy = sy(cM.y);

    // ── Connection sides — highlight footprint edges fixed to the dwelling ──
    const sides = d.attachmentDetail?.sides;
    if (sides && (sides.front || sides.back || sides.left || sides.right)) {
      for (let i = 0; i < bldg.length; i++) {
        const a = bldg[i];
        const b = bldg[(i + 1) % bldg.length];
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const dx = mid.x - cM.x, dy = mid.y - cM.y;
        // Classify by outward direction: +y = north (back), -y = south (front).
        const side = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'back' : 'front');
        if (sides[side as 'front' | 'back' | 'left' | 'right']) {
          s += `<line x1="${sx(a.x).toFixed(1)}" y1="${sy(a.y).toFixed(1)}" x2="${sx(b.x).toFixed(1)}" y2="${sy(b.y).toFixed(1)}" stroke="${connCol}" stroke-width="3.4" stroke-linecap="round" opacity="0.9"/>`;
        }
      }
    }

    // ── Ridge / roof-direction line across the footprint ──
    let ridge: { from: Pt; to: Pt } | null = null;
    if (d.roofLine) {
      ridge = { from: proj.toM(d.roofLine.from), to: proj.toM(d.roofLine.to) };
    } else if (d.ridgeBearing !== undefined) {
      // Bearing: 0 = north, clockwise. Direction in (east=x, north=y).
      const th = (d.ridgeBearing * Math.PI) / 180;
      const dir = { x: Math.sin(th), y: Math.cos(th) };
      // Extend ± half the footprint diagonal so the line spans across it.
      const xs = bldg.map((p) => p.x), ys = bldg.map((p) => p.y);
      const diag = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      const half = diag / 2;
      ridge = {
        from: { x: cM.x - dir.x * half, y: cM.y - dir.y * half },
        to: { x: cM.x + dir.x * half, y: cM.y + dir.y * half },
      };
    }
    if (ridge) {
      s += `<line x1="${sx(ridge.from.x).toFixed(1)}" y1="${sy(ridge.from.y).toFixed(1)}" x2="${sx(ridge.to.x).toFixed(1)}" y2="${sy(ridge.to.y).toFixed(1)}" stroke="${ridgeCol}" stroke-width="1.8" stroke-dasharray="7,4"/>`;
      s += `<text x="${sx(ridge.to.x).toFixed(1)}" y="${(sy(ridge.to.y) - 4).toFixed(1)}" font-family="${mono}" font-size="7" fill="${ridgeCol}" text-anchor="middle">RIDGE</text>`;
    }

    s += `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" font-family="${mono}" font-size="9" fill="${bldgStroke}" text-anchor="middle" font-weight="700">PROPOSED</text>`;
    s += `<text x="${cx.toFixed(1)}" y="${(cy + 11).toFixed(1)}" font-family="${mono}" font-size="7.5" fill="${bldgStroke}" text-anchor="middle">STRUCTURE</text>`;
  }

  // Setback callouts
  const o = d.offsets;
  if (o) {
    const parts: string[] = [];
    if (o.front !== undefined) parts.push(`Front ${o.front} m`);
    if (o.rear !== undefined) parts.push(`Rear ${o.rear} m`);
    if (o.left !== undefined) parts.push(`Left ${o.left} m`);
    if (o.right !== undefined) parts.push(`Right ${o.right} m`);
    if (parts.length) {
      s += `<text x="12" y="${VB_H - 14}" font-family="${mono}" font-size="8" fill="${dimCol}">Setbacks — ${parts.join(' · ')}</text>`;
    }
  }

  // Lot area
  const area = d.areaM2 ?? shoelaceArea(lot);
  s += `<text x="12" y="20" font-family="${mono}" font-size="9" fill="${lineCol}">Lot area ${Math.round(area)} m²</text>`;

  // North arrow (north = up in this frame)
  const nx = VB_W - 30;
  const ny = 40;
  s += `<line x1="${nx}" y1="${ny + 18}" x2="${nx}" y2="${ny - 14}" stroke="${lineCol}" stroke-width="1.4"/>`;
  s += `<polygon points="${nx},${ny - 20} ${nx - 5},${ny - 8} ${nx + 5},${ny - 8}" fill="${lineCol}"/>`;
  s += `<text x="${nx}" y="${ny + 30}" font-family="${mono}" font-size="9" fill="${lineCol}" text-anchor="middle">N</text>`;

  if (indicative) {
    s += `<text x="12" y="${VB_H - 28}" font-family="${mono}" font-size="7.5" fill="${dimCol}" font-style="italic">Structure position indicative (from setbacks) — confirm against survey.</text>`;
  }

  // Connection legend — only when sides are highlighted
  const sd = d.attachmentDetail?.sides;
  if (bldg && sd && (sd.front || sd.back || sd.left || sd.right)) {
    const which = (['front', 'back', 'left', 'right'] as const).filter((k) => sd[k]);
    const legY = indicative ? VB_H - 42 : VB_H - 28;
    s += `<line x1="14" y1="${legY - 3}" x2="30" y2="${legY - 3}" stroke="${connCol}" stroke-width="3.4" stroke-linecap="round"/>`;
    s += `<text x="36" y="${legY}" font-family="${mono}" font-size="7.5" fill="${dimCol}">Fixed to dwelling — ${which.join(', ')}</text>`;
  }

  s += `</svg>`;
  return s;
}
