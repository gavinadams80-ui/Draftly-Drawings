// ── Types consumed by the @draftly/drawings generators ──
// Mirrored from Draftly-Engineering's core types. Only the members the
// drawing generators actually reference live here, keeping this package
// framework- and app-agnostic.

export interface Section {
  size: string;
  d: number;        // depth mm
  b?: number;       // flange width mm
  t: number;        // thickness mm
  Z: number;        // section modulus mm³
  I: number;        // second moment of area mm⁴
  E: number;        // Young's modulus MPa
  fy: number;       // yield strength MPa
  wt: number;       // kg/m
  grade: string;
  fb?: number;      // bending strength (if different from fy)
}

export type MemberForm = 'open' | 'b2b' | 'rhs' | 'plate';
