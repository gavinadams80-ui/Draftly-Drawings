// ── Shared terminology key ──
// ONE vocabulary of industry-standard terms that lives in the shared library so
// Intelligence, Engineering and Drafting all speak the same language and the
// naming can't drift. Canonical names + accepted aliases + plain definitions.
//
// Canonical terms confirmed with the user (2026-06-10):
//   • span    — NOT "width" (brick-to-brick across the gable).
//   • pitch   — single name (pitchAngle / pitchDeg are aliases).
//   • standoff — gap between the new structure and the existing BRICK WALL face.
//   • offset   — between TWO walls, the difference between their face positions
//                (a DIFFERENT thing from standoff — both are kept).
//   • gable chord = bottom chord (synonyms — the gable-end tie member).
//   • apex = the highest POINT; ridge = the LINE that runs along the apex.

// ── Canonical enumerations (use these unions everywhere) ──
export type StructureType = 'carport' | 'patio' | 'pergola' | 'verandah';
export type RoofType = 'gable' | 'skillion' | 'hip';
export type Attachment = 'freestanding' | 'attached' | 'three-side';
/** Portal-frame position along the depth (drives the section variant: A-A/B-B/C-C). */
export type FrameType = 'back' | 'intermediate' | 'front';
/** Structural member role. `column` and `post` are synonyms; `gableChord`/`bottomChord` too. */
export type MemberRole =
  | 'rafter' | 'purlin' | 'post' | 'column' | 'ledger' | 'beam'
  | 'bottomChord' | 'gableChord' | 'gableDropper' | 'brace' | 'knee';

export type TermCategory =
  | 'Structure form' | 'Geometry' | 'Member' | 'Set-out height'
  | 'Wall build-up' | 'Connection' | 'Roof / cladding' | 'Drainage';

export interface GlossaryTerm {
  /** Canonical, industry-standard name. */
  term: string;
  category: TermCategory;
  /** Plain-language definition. */
  definition: string;
  /** Other names seen in code or accepted as synonyms. */
  aliases?: string[];
  /** Code field/key this maps to in the DesignSet / DrawingParams, where applicable. */
  field?: string;
  unit?: string;
}

// ── The glossary (single source of the shared key) ──
export const GLOSSARY: GlossaryTerm[] = [
  // Structure form
  { term: 'structure type', category: 'Structure form', field: 'structureType',
    definition: 'The kind of structure: carport / patio / pergola / verandah.' },
  { term: 'roof type', category: 'Structure form', field: 'roofType',
    definition: 'Gable (two-sided, apex) / skillion (mono-pitch) / hip.' },
  { term: 'attachment', category: 'Structure form', field: 'attachment',
    definition: 'How it ties to the dwelling: freestanding / attached / three-side.' },
  { term: 'frame type', category: 'Structure form', field: 'frameType',
    definition: 'Portal-frame position along the depth — back / intermediate / front (sections A-A / B-B / C-C).' },

  // Geometry
  { term: 'span', category: 'Geometry', field: 'width', aliases: ['width'], unit: 'mm',
    definition: 'Brick-to-brick dimension across the gable (the gable width).' },
  { term: 'depth', category: 'Geometry', field: 'depth', unit: 'mm',
    definition: 'Front-to-back dimension (house wall to front).' },
  { term: 'height', category: 'Geometry', field: 'height', unit: 'mm',
    definition: 'Overall / wall height reference.' },
  { term: 'pitch', category: 'Geometry', field: 'pitch', aliases: ['pitchAngle', 'pitchDeg'], unit: 'degrees',
    definition: 'Roof slope angle.' },
  { term: 'bay', category: 'Geometry', field: 'bayWidth', unit: 'mm',
    definition: 'Spacing between adjacent portal frames (centre-to-centre).' },
  { term: 'portal frame count', category: 'Geometry', field: 'portalFrameCount', unit: 'no.',
    definition: 'Number of portal frames along the depth.' },
  { term: 'standoff', category: 'Geometry', field: 'standoff', unit: 'mm',
    definition: 'Gap between the new structure and the existing BRICK WALL face.' },
  { term: 'offset', category: 'Geometry', field: 'setbacks', aliases: ['setback', 'rightOffsetMm', 'leftOffsetMm', 'backOffsetMm'], unit: 'mm',
    definition: 'Between two walls — the difference between their face positions (e.g. a side wall stopping short of the front). DISTINCT from standoff.' },
  { term: 'north rotation', category: 'Geometry', field: 'northRotation', unit: 'degrees',
    definition: 'Clockwise rotation of true north relative to the plan (0 = north up).' },

  // Members
  { term: 'rafter', category: 'Member', definition: 'Sloping roof member from eave to apex.' },
  { term: 'purlin', category: 'Member', definition: 'Member spanning between frames, carrying the roof sheeting.' },
  { term: 'post', category: 'Member', aliases: ['column'], definition: 'Vertical support member (a.k.a. column).' },
  { term: 'ledger', category: 'Member', definition: 'Horizontal member fixed to the existing wall that the structure bears on.' },
  { term: 'beam', category: 'Member', definition: 'Primary horizontal spanning member.' },
  { term: 'gable chord', category: 'Member', aliases: ['bottomChord', 'bottom chord'],
    definition: 'The tie across the bottom of a gable-end frame (gable chord = bottom chord).' },
  { term: 'gable dropper', category: 'Member', definition: 'Short vertical infill member in the gable end.' },
  { term: 'brace', category: 'Member', definition: 'Diagonal member resisting lateral / racking loads.' },
  { term: 'knee', category: 'Member', definition: 'The braced joint / knee brace at the rafter-to-post corner of a portal frame.' },
  { term: 'apex', category: 'Member', definition: 'The highest POINT of the roof.' },
  { term: 'ridge', category: 'Member', definition: 'The LINE that runs along the apex (ridge line / ridge beam).' },

  // Set-out heights (mm above FFL = finished floor level)
  { term: 'finished floor level', category: 'Set-out height', aliases: ['FFL'],
    definition: 'The datum (0) all set-out heights are measured up from.' },
  { term: 'eave height', category: 'Set-out height', field: 'eaveHeight', unit: 'mm',
    definition: 'Top of wall / where the rafter bears.' },
  { term: 'gutter height', category: 'Set-out height', field: 'gutterHeight', unit: 'mm',
    definition: 'Top of gutter / eave line.' },
  { term: 'fascia height', category: 'Set-out height', field: 'fasciaHeight', unit: 'mm',
    definition: 'Bottom of the fascia board.' },
  { term: 'ridge height', category: 'Set-out height', field: 'ridgeHeight', unit: 'mm',
    definition: 'Height of the apex / ridge line (highest point).' },
  { term: 'existing-gutter overhang', category: 'Set-out height', field: 'existingGutterOverhangMm', unit: 'mm',
    definition: 'How far the EXISTING dwelling gutter overhangs its wall face (sets the clearance to the new structure).' },

  // Wall build-up (the existing dwelling)
  { term: 'brick veneer', category: 'Wall build-up', field: 'brickThickness', unit: 'mm',
    definition: 'Outer brick skin of the existing dwelling.' },
  { term: 'cavity', category: 'Wall build-up', field: 'cavityWidth', unit: 'mm',
    definition: 'Air gap between the brick veneer and the timber frame.' },
  { term: 'timber stud', category: 'Wall build-up', field: 'studSize',
    definition: 'Vertical member of the timber wall frame.' },
  { term: 'fascia', category: 'Wall build-up', field: 'fasciaThickness',
    definition: 'Board on the eave face that the gutter fixes to.' },
  { term: 'gutter', category: 'Wall build-up', field: 'gutterType',
    definition: 'Channel collecting roof water at the eave.' },
  { term: 'SHS standoff', category: 'Wall build-up', field: 'shsStandoff',
    definition: 'Square-hollow-section bracket holding the structure off the wall.' },
  { term: 'lag screw', category: 'Wall build-up', field: 'lagScrewSize',
    definition: 'Coach/lag screw fixing the structure or ledger to the wall.' },

  // Connection details (the detail blocks — DRF-00x)
  { term: 'socket joint', category: 'Connection', field: 'DRF-007', definition: 'Stub-in-rafter socket connection.' },
  { term: 'fascia penetration', category: 'Connection', field: 'DRF-008', definition: 'Where an SHS passes through the fascia.' },
  { term: 'corner post', category: 'Connection', field: 'DRF-003', definition: 'Post + base plate at a free corner.' },
  { term: 'rafter-to-ledger', category: 'Connection', field: 'DRF-004', definition: 'Rafter bearing/fixing onto the wall ledger.' },
  { term: 'cross-bracing', category: 'Connection', field: 'DRF-005', definition: 'Diagonal bracing connection.' },
  { term: 'ledger connection', category: 'Connection', field: 'DRF-006', definition: 'Bracket fixing the ledger to the wall.' },
  { term: 'birdsmouth', category: 'Connection', field: 'birdsmouthDepth', unit: 'mm',
    definition: 'Notch cut in a rafter so it seats on a bearing.' },
  { term: 'base plate', category: 'Connection', field: 'basePlateSize', definition: 'Steel plate at the foot of a post.' },
  { term: 'anchor', category: 'Connection', field: 'anchorSize', definition: 'Bolt fixing a base plate into concrete.' },
  { term: 'bolt', category: 'Connection', field: 'boltSize', definition: 'Structural bolt (e.g. M12).' },
  { term: 'fillet weld', category: 'Connection', field: 'weldSize', unit: 'mm', definition: 'Weld at a member junction.' },
  { term: 'bracket', category: 'Connection', field: 'bracketType', definition: 'Fabricated connector (angle / plate / box).' },
  { term: 'packer', category: 'Connection', field: 'packerSize', definition: 'Shim/spacer plate taking up a gap in a joint.' },
  { term: 'stub', category: 'Connection', field: 'stubShs', definition: 'Short SHS section forming part of a socket joint.' },

  // Roof / cladding
  { term: 'cladding', category: 'Roof / cladding', field: 'cladding', aliases: ['sheeting'],
    definition: 'Roof (or wall) sheeting / covering.' },
  { term: 'ridge flashing', category: 'Roof / cladding', definition: 'Capping over the apex where roof sheets meet.' },
  { term: 'eave flashing', category: 'Roof / cladding', definition: 'Flashing at the eave/gutter line.' },
  { term: 'overhang', category: 'Roof / cladding', definition: 'Roof projection past the supporting line.' },

  // Drainage
  { term: 'downpipe', category: 'Drainage', definition: 'Vertical pipe taking gutter water to ground / stormwater.' },
  { term: 'catchment area', category: 'Drainage', field: 'totalCatchmentAreaM2', unit: 'm²',
    definition: 'Roof area draining to the system / a downpipe.' },
  { term: 'design intensity', category: 'Drainage', field: 'designIntensityMmHr', unit: 'mm/hr',
    definition: 'Rainfall intensity for the chosen design storm.' },
  { term: 'AEP', category: 'Drainage', field: 'aepPercent', unit: '%',
    definition: 'Annual Exceedance Probability — the design storm likelihood (e.g. 5% AEP).' },
];

/** Resolve any alias to the canonical glossary term (case-insensitive). */
export function canonicalTerm(name: string): GlossaryTerm | undefined {
  const n = name.trim().toLowerCase();
  return GLOSSARY.find(t =>
    t.term.toLowerCase() === n ||
    (t.aliases ?? []).some(a => a.toLowerCase() === n) ||
    (t.field ?? '').toLowerCase() === n,
  );
}

/** Glossary entries grouped by category (for term-list UIs / docs). */
export function glossaryByCategory(): Record<TermCategory, GlossaryTerm[]> {
  const out = {} as Record<TermCategory, GlossaryTerm[]>;
  for (const t of GLOSSARY) (out[t.category] ??= []).push(t);
  return out;
}
