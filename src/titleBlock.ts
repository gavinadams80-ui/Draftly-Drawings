// ── Standard Engineering Title Block ──
// Appended to the bottom of any drawing SVG.
// Follows AS1100 / council submission formatting guidelines.

export interface TitleBlockData {
  projectName:     string;
  projectNumber:   string;
  clientName:      string;
  propertyAddress: string;
  council:         string;
  designedBy:      string;
  drawnBy:         string;
  checkedBy:       string;
  approvedBy:      string;
  revision:        string;
  date:            string;
  status:          string; // 'For Approval' | 'For Construction' | 'As Constructed' | 'Preliminary'
  documentType:    string;
}

export const DEFAULT_TITLE_BLOCK: TitleBlockData = {
  projectName:     '',
  projectNumber:   '',
  clientName:      '',
  propertyAddress: '',
  council:         '',
  designedBy:      '',
  drawnBy:         'Claude M. Day',
  checkedBy:       '',
  approvedBy:      '',
  revision:        'A',
  date:            new Date().toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  status:          'For Approval',
  documentType:    'Structural Drawing',
};

/** Title-block strip height in px (≈ 28 mm). Fixed regardless of paper size. */
export const TITLE_BLOCK_H = 80;

/** Renders the title block SVG fragment positioned at (x, y) within a drawing of width W. */
export function renderTitleBlock(
  x: number, y: number, W: number,
  tb: TitleBlockData,
  drawingTitle: string,
  drawingNumber: string,
  sheet: number,
  totalSheets: number,
  scale: string,
): string {
  const H_BLOCK = TITLE_BLOCK_H;
  const mono    = 'DM Mono,monospace';
  const border  = '#c8cce0';
  const fill    = 'rgba(255,255,255,0.04)';
  const labelCol = '#9090a0';
  const valueCol = '#e8eaf0';
  const accentCol = '#c9a84c';

  // ── Column widths (fractions of W) ──
  // Layout: [left-wide] [mid] [right-narrow]
  const colA = W * 0.38; // project / client info
  const colB = W * 0.38; // drawing info
  const colC = W * 0.24; // numbers / stamps

  const bx = x, by = y;
  const rowH = H_BLOCK / 4; // 4 rows



  const cell = (cx: number, cy: number, cw: number, ch: number, label: string, value: string, accent = false) => {
    const lx = cx + 3, ly = cy + 8;
    const vx = cx + 3, vy = cy + ch - 4;
    return [
      `<rect x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" fill="${fill}" stroke="${border}" stroke-width="0.5"/>`,
      label ? `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-family="${mono}" font-size="5.5" fill="${labelCol}" font-weight="600">${label.toUpperCase()}</text>` : '',
      value ? `<text x="${vx.toFixed(1)}" y="${vy.toFixed(1)}" font-family="${mono}" font-size="${accent ? 8 : 7}" fill="${accent ? accentCol : valueCol}" font-weight="${accent ? '700' : '400'}">${value}</text>` : '',
    ].join('');
  };

  const statusColors: Record<string, string> = {
    'For Approval':    '#f59e0b',
    'For Construction': '#22c55e',
    'As Constructed':  '#3b82f6',
    'Preliminary':     '#a78bfa',
  };
  const statusCol = statusColors[tb.status] || accentCol;

  let s = '';

  // Outer border
  s += `<rect x="${bx}" y="${by}" width="${W}" height="${H_BLOCK}" fill="rgba(15,16,20,0.95)" stroke="${border}" stroke-width="0.8"/>`;

  // ── Row 0: Project name | Drawing title | DRG No ──
  const r0y = by;
  s += cell(bx,        r0y, colA, rowH, 'Project',       tb.projectName  || '—');
  s += cell(bx + colA, r0y, colB, rowH, 'Drawing Title', drawingTitle    || '—', true);
  s += cell(bx + colA + colB, r0y, colC, rowH, 'Drawing No.', drawingNumber || '—');

  // ── Row 1: Client | Address | Sheet X of Y ──
  const r1y = by + rowH;
  s += cell(bx,        r1y, colA, rowH, 'Client / Owner', tb.clientName       || '—');
  s += cell(bx + colA, r1y, colB, rowH, 'Address',        tb.propertyAddress  || '—');
  s += cell(bx + colA + colB, r1y, colC, rowH, 'Sheet', `${sheet} of ${totalSheets}`);

  // ── Row 2: Designed | Drawn | Checked | Date | Scale ──
  const r2y = by + rowH * 2;
  const qA = colA / 2, qB = colB / 2;
  s += cell(bx,            r2y, qA, rowH, 'Designed By', tb.designedBy || '—');
  s += cell(bx + qA,       r2y, qA, rowH, 'Drawn By',    tb.drawnBy    || '—');
  s += cell(bx + colA,     r2y, qB, rowH, 'Checked By',  tb.checkedBy  || '—');
  s += cell(bx + colA + qB, r2y, qB, rowH, 'Approved By', tb.approvedBy || '—');
  s += cell(bx + colA + colB, r2y, colC / 2, rowH, 'Date',  tb.date   || '—');
  s += cell(bx + colA + colB + colC / 2, r2y, colC / 2, rowH, 'Scale', scale || 'NTS');

  // ── Row 3: Council | Project No | Revision | Status | Doc Type ──
  const r3y = by + rowH * 3;
  const cW1 = colA * 0.55, cW2 = colA * 0.45;
  s += cell(bx,      r3y, cW1, rowH, 'Council', tb.council       || '—');
  s += cell(bx + cW1, r3y, cW2, rowH, 'Project No.', tb.projectNumber || '—');
  s += cell(bx + colA, r3y, colB * 0.25, rowH, 'Rev.', tb.revision || 'A');
  s += cell(bx + colA + colB * 0.25, r3y, colB * 0.75, rowH, 'Document Type', tb.documentType || '—');

  // Status stamp (right column row 3) — coloured
  const sRX = bx + colA + colB;
  s += `<rect x="${sRX.toFixed(1)}" y="${r3y.toFixed(1)}" width="${colC.toFixed(1)}" height="${rowH.toFixed(1)}" fill="rgba(15,16,20,0.95)" stroke="${border}" stroke-width="0.5"/>`;
  s += `<rect x="${(sRX + 2).toFixed(1)}" y="${(r3y + 2).toFixed(1)}" width="${(colC - 4).toFixed(1)}" height="${(rowH - 4).toFixed(1)}" fill="${statusCol}" opacity="0.15" rx="2"/>`;
  s += `<text x="${(sRX + colC / 2).toFixed(1)}" y="${(r3y + rowH / 2 + 4).toFixed(1)}" text-anchor="middle" font-family="${mono}" font-size="7.5" fill="${statusCol}" font-weight="700">${tb.status.toUpperCase()}</text>`;

  // Draftly watermark (right edge, small)
  s += `<text x="${(bx + W - 4).toFixed(1)}" y="${(by + H_BLOCK - 3).toFixed(1)}" text-anchor="end" font-family="${mono}" font-size="5" fill="${labelCol}" opacity="0.5">Generated by Draftly Structural Designer</text>`;

  return s;
}
