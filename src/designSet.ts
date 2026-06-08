// ── DesignSet — the Engineering ⇄ Drafting handover contract ──
// Engineering computes a structural design (geometry + selected sections + the
// pass/fail checks) and emits a DesignSet. Drafting ingests it, generates the
// drawings with the shared generators, lets the user amend freely, then hands
// the (possibly-edited) DesignSet back so Engineering can re-run the calcs,
// re-check each member, value it, and produce the calculations PDF.
//
// This file is the single shared definition of that payload + lossless
// serialize/parse, so both apps read and write it identically. Pure data — no
// React, no DOM.

import { type TitleBlockData } from './titleBlock.js';

export const DESIGNSET_FORMAT = 'draftly-designset';
export const DESIGNSET_SCHEMA_VERSION = 1;

/** Result of Engineering's check on one member. `pass:false` = no longer green. */
export interface MemberCheck {
  pass: boolean;
  /** Demand/capacity ratio (0–1+); optional. */
  utilisation?: number;
  /** Free-text note, e.g. the governing case or why it failed. */
  note?: string;
}

/** A selected structural member: identity + drawing dims + the check result. */
export interface DesignMember {
  /** Stable id — the SAME value Drafting stamps as `data-member-id`. Survives the round-trip. */
  id: string;
  /** e.g. 'rafter' | 'post' | 'purlin' | 'ledger' | 'gableChord' | 'gableDropper' | 'brace'. */
  role: string;
  /** Catalog size string, e.g. '150 x 50 x 4.0 RHS' or 'C15015'. */
  section: string;
  /** Drawing dimensions (mm) — depth, optional flange width, thickness. */
  d: number;
  b?: number;
  t?: number;
  /** Quantity of this member in the structure (optional). */
  qty?: number;
  check?: MemberCheck;
}

/** Building geometry — mirrors Engineering's `config`. Lengths in mm, angles in degrees. */
export interface DesignGeometry {
  structureType: string;            // e.g. 'carport' | 'patio' | 'shed'
  roofType: 'gable' | 'skillion';
  attachment: 'freestanding' | 'attached' | 'three-side';
  width: number;
  depth: number;
  height: number;
  pitch: number;                    // degrees
  portalFrameCount: number;
  standoff?: number;
  setbacks?: { left?: number; right?: number; front?: number; back?: number };
  northRotation?: number;
  cladding?: string;
}

/** Computed values the drawings annotate (optional, free-form-ish). */
export interface DesignResults {
  purlinSpacing?: number;
  rafterLength?: number;
  gable?: { width: number; height: number; bays: number; dropperSpacing: number };
  [k: string]: unknown;
}

/** Design loads + site inputs so the handback can be re-calculated. */
export interface DesignLoads {
  windRegion?: string;
  terrainCategory?: number;
  importanceLevel?: number;
  deadKpa?: number;
  liveKpa?: number;
  windUltimateKpa?: number;
  [k: string]: unknown;
}

export interface ScheduleLine {
  member: string;
  size: string;
  qty: number;
  totalLengthM: number;
  totalKg: number;
  cost: number;
}

export interface DesignSchedule {
  currency: string;
  ratePerKg: number;
  totalKg: number;
  totalCost: number;
  lines: ScheduleLine[];
}

/** Overall status: green across all members, or at least one failing. */
export type DesignStatus = 'all-pass' | 'has-fail' | 'unchecked';

/** The full handover payload. */
export interface DesignSet {
  format: typeof DESIGNSET_FORMAT;
  schemaVersion: number;
  units: 'mm';
  generated: { by: string; at: string; libVersion?: string };
  /** Title-block fields — the same shared TitleBlockData both apps render. */
  project: Partial<TitleBlockData>;
  geometry: DesignGeometry;
  members: DesignMember[];
  results?: DesignResults;
  loads?: DesignLoads;
  schedule?: DesignSchedule;
  status: DesignStatus;
}

/** The fields a producer supplies; format/schema/units/generated/status are stamped/derived. */
export interface DesignSetInput {
  project: Partial<TitleBlockData>;
  geometry: DesignGeometry;
  members: DesignMember[];
  results?: DesignResults;
  loads?: DesignLoads;
  schedule?: DesignSchedule;
  status?: DesignStatus;
}

/** Derive overall status from member checks. */
export function computeDesignStatus(members: DesignMember[]): DesignStatus {
  const checked = members.filter(m => m.check);
  if (!checked.length) return 'unchecked';
  return checked.every(m => m.check!.pass) ? 'all-pass' : 'has-fail';
}

/** Build a complete DesignSet (stamping format/schema/units/generated + derived status). */
export function makeDesignSet(input: DesignSetInput, opts: { by?: string; libVersion?: string } = {}): DesignSet {
  return {
    format: DESIGNSET_FORMAT,
    schemaVersion: DESIGNSET_SCHEMA_VERSION,
    units: 'mm',
    generated: { by: opts.by ?? 'unknown', at: new Date().toISOString(), libVersion: opts.libVersion },
    project: input.project,
    geometry: input.geometry,
    members: input.members,
    results: input.results,
    loads: input.loads,
    schedule: input.schedule,
    status: input.status ?? computeDesignStatus(input.members),
  };
}

/** Serialize a design to a pretty `.designset.json` string. */
export function serializeDesignSet(input: DesignSetInput | DesignSet, opts: { by?: string; libVersion?: string } = {}): string {
  const ds = 'format' in input ? input : makeDesignSet(input, opts);
  return JSON.stringify(ds, null, 2);
}

/** Thrown when a string isn't a valid DesignSet. */
export class DesignSetParseError extends Error {}

/** Structural validation of a parsed object. Returns the typed DesignSet or throws DesignSetParseError. */
export function validateDesignSet(obj: unknown): DesignSet {
  if (!obj || typeof obj !== 'object') throw new DesignSetParseError('Not a DesignSet object.');
  const o = obj as Record<string, unknown>;
  if (o.format !== DESIGNSET_FORMAT) throw new DesignSetParseError(`Not a Draftly DesignSet (format="${String(o.format)}").`);
  const ver = Number(o.schemaVersion);
  if (!Number.isFinite(ver)) throw new DesignSetParseError('Missing schemaVersion.');
  if (ver > DESIGNSET_SCHEMA_VERSION) {
    throw new DesignSetParseError(`DesignSet schema v${ver} is newer than this library supports (v${DESIGNSET_SCHEMA_VERSION}). Update @draftly/drawings.`);
  }
  if (!o.geometry || typeof o.geometry !== 'object') throw new DesignSetParseError('Missing geometry.');
  if (!Array.isArray(o.members)) throw new DesignSetParseError('Missing members[].');
  return obj as DesignSet;
}

/** Parse a `.designset.json` string into a typed DesignSet (throws DesignSetParseError on bad input). */
export function parseDesignSet(json: string): DesignSet {
  let obj: unknown;
  try { obj = JSON.parse(json); }
  catch { throw new DesignSetParseError('File is not valid JSON.'); }
  return validateDesignSet(obj);
}
