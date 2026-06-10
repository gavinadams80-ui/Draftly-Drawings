# Changelog

All notable changes to `@draftly/drawings` are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/), and this
package follows [Semantic Versioning](https://semver.org/) as defined for a
pure-SVG-generator library — see [`RELEASING.md`](./RELEASING.md) for what
counts as MAJOR / MINOR / PATCH and the full publish + consume recipe.

Consumers (Draftly-Engineering, Draftly-Drafting) pin a git tag, e.g.
`"@draftly/drawings": "github:gavinadams80-ui/Draftly-Drawings#v0.3.0"`.

## [Unreleased]

_Nothing yet._

## [0.8.0] — 2026-06-10

### Added
- **Wall section sets out the standoff + clearance from the existing dwelling
  gutter.** `WallSectionHeights` gains optional `standoff` (`geometry.standoff`)
  and `existingGutterOverhangMm` (`results.existingGutterOverhangMm`). When a
  standoff is handed over, the section draws the existing dwelling to the left of
  the new structure (the viewBox widens leftward so it isn't clipped), projects
  its gutter overhang back toward the structure, and dimensions the **clearance**
  (`standoff − overhang`) and the **standoff**. A non-positive clearance is
  flagged **CLASH** in red. Both fields optional — older exports omit them and
  the section renders exactly as before.
- **New stormwater drainage sheet** — `generateDrainageSheetSVG(drainage, { siteNotes })`
  (plus the `requiredFlowLs` helper) renders the design storm (intensity mm/hr +
  AEP %), the total catchment, and a downpipe schedule listing each pipe's area
  served, **required** flow (`intensity × area ÷ 3600`) and **rated** capacity.
  Over-capacity downpipes and the system-level `anyOverCapacity` flag are called
  out in red. Returns `''` when no drainage design is present, so callers keep
  their previous behaviour. `results.siteNotes` is also surfaced as a planning-
  notes footer on this sheet.
- **`DesignResults` documents the carried drainage/clearance fields** —
  `existingGutterOverhangMm` and `drainage` (new `DesignDrainage` /
  `DesignDownpipe` types) join the typed optional members alongside the existing
  `[k: string]: unknown` extension point. No schema/version bump — the payload is
  unchanged on the wire (DesignSet schema stays v1).
- **Fixture + verification:** `fixtures/sample.designset.json` carries
  `geometry.standoff`, `results.existingGutterOverhangMm` and `results.drainage`;
  `scripts/verify-wall-section.mjs` asserts the dwelling/standoff/clearance
  set-out, and the new `scripts/verify-drainage.mjs` parses the fixture and
  renders the drainage sheet, asserting the storm, catchment, downpipe schedule
  and over-capacity flagging.

## [0.7.0] — 2026-06-10

### Added
- **Wall section now sets out from the as-sited heights handed over in a
  `DesignSet`.** `generateWallSectionSVG` gains a trailing optional
  `heights: WallSectionHeights` argument (new exported type) carrying
  `eaveHeight`, `gutterHeight`, `fasciaHeight`, `ridgeHeight` and `siteNotes`:
  - `eaveHeight` drives the timber/brick wall height (brick keeps its 120mm step).
  - `fasciaHeight` (bottom) + `gutterHeight` (top) **auto-size the fascia**, and
    the gutter profile scales with it so its top stays pinned to the eave line.
  - `ridgeHeight` overrides the pitch-derived apex (gable ridge / skillion high
    eave); the drawn plumb-cuts and flashing use the resulting effective pitch.
  - `siteNotes` renders a **SITE NOTES block** on the section so the planner's
    free-text concerns travel with the drawing instead of being lost.
  - All fields optional — older exports omit them and the section falls back to
    the previous derived defaults, so existing consumers are untouched.
- **`DesignResults` documents the carried setout fields** (`eaveHeight`,
  `gutterHeight`, `fasciaHeight`, `ridgeHeight`, `siteNotes`) as typed optional
  members alongside its existing `[k: string]: unknown` extension point. No
  schema/version bump — the payload is unchanged on the wire.
- **Fixture + verification:** `fixtures/sample.designset.json` carries the new
  fields and `scripts/verify-wall-section.mjs` parses it through
  `parseDesignSet` and renders the section, asserting the fascia/gutter/ridge
  land at the carried heights and the notes block appears.

### Exports
- `WallSectionHeights` (type) from `./wallSection.js`.

## [0.6.0] — 2026-06-09

### Added
- **`DesignSet` — the Engineering ⇄ Drafting handover contract (`designSet.ts`).**
  The shared, versioned payload Engineering emits (geometry + selected sections +
  per-member checks + loads + schedule + title-block project data) and Drafting
  ingests to generate drawings, then hands back for re-calculation. New exports:
  - Types: `DesignSet`, `DesignSetInput`, `DesignMember`, `MemberCheck`,
    `DesignGeometry`, `DesignResults`, `DesignLoads`, `DesignSchedule`,
    `ScheduleLine`, `DesignStatus`.
  - `DESIGNSET_FORMAT`, `DESIGNSET_SCHEMA_VERSION`.
  - `makeDesignSet` (stamps format/schema/units/generated + derives status),
    `serializeDesignSet` (→ pretty `.designset.json`), `parseDesignSet` /
    `validateDesignSet` (throw `DesignSetParseError` on bad input, and reject a
    schema newer than the library supports), `computeDesignStatus`.
  - `project` reuses the shared `TitleBlockData`; each member carries a stable
    `id` matching Drafting's `data-member-id`, so edits survive the round-trip.

## [0.5.0] — 2026-06-08

### Added
- **Paper-size-aware shared sheet (`sheet.ts`)** — one drawing-sheet template both
  apps render, so a Drafting sheet and an Engineering submission sheet are
  identical by construction. New exports:
  - `PaperSize` ('A4' | 'A3' | 'A2' | 'A1'), `SHEET_MM`, `SHEET_BORDER`,
    `sheetPx(size)`, `getSheetWorkingArea(size)`.
  - `generateSheetTemplate(tb, title, number, opts)` — the blank sheet "stencil"
    (border + working-area frame + AS1100 title block, no content) for dropping
    onto a paper-space layout.
  - `placeOnSheet(svg, tb, title, number, opts)` — generalises the A3-only
    composer to any paper size, scaling + centring the drawing in the working area.
  - `SheetOptions` ({ paperSize, sheet, totalSheets, scale }).
- `renderTitleBlock` and `TITLE_BLOCK_H` are now exported from `titleBlock.ts`
  for reuse by sheet composition and consumers.

### Changed
- `withTitleBlock()` is preserved with its exact signature and A3 output
  (`1190×842`) for Engineering's existing call sites; it now delegates to
  `placeOnSheet('A3', …)`. Its source moved from `titleBlock.ts` to `sheet.ts`
  (re-exported from the package root — no consumer change required).

## [0.4.0] — 2026-06-08

### Added
- **Section catalog — the single source of truth for standard sections.** Ported
  the full AS/NZS section database (cold-formed C, steel SHS/RHS, timber,
  aluminium, grouped by role) into the lib: `CSECTION_SECTIONS`,
  `STEEL_SECTIONS`, `TIMBER_SECTIONS`, `ALUMINIUM_SECTIONS`, `getSectionDB`, and
  the `SectionDB` type.
- `SECTION_CATALOG` — a flat, de-duplicated list of every standard size with its
  family, material and structural properties — plus `searchSections(query)` for
  CAD-style incremental search (tolerant of spacing and × vs x), and the
  `SectionMaterial` / `SectionCatalogEntry` types. Powers the Drafting
  material-block selector.

## [0.3.0] — 2026-06-08

### Changed
- Synced the Engineering drawing evolution into the shared lib so Engineering and
  Drafting render from one source (frame, title block, plan/elevation/section,
  connection and socket-joint details, parametric `DrawingParams`).

## [0.2.1] — 2026-06-07

### Added
- Surfaced `parseSectionDims` and the `ParsedDims` type from the package root so
  consumers can read section dimensions without reaching into a submodule.

## [0.2.0] — 2026-06-07

### Added
- `generateMemberProfile` — single editable member-profile renderer for Drafting
  blocks, plus the `MemberView` / `MemberProfileOptions` types.

## [0.1.0] — 2026-06-06

### Added
- Initial shared library: framework-agnostic SVG generators (drawing frame,
  title block, plan/roof geometry, wall section, full & side elevation, site
  plan, three-view member preview, gable infill) with the DOM-dependent PDF
  exporter isolated in the `@draftly/drawings/pdf` entry.

[Unreleased]: https://github.com/gavinadams80-ui/Draftly-Drawings/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/gavinadams80-ui/Draftly-Drawings/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/gavinadams80-ui/Draftly-Drawings/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/gavinadams80-ui/Draftly-Drawings/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/gavinadams80-ui/Draftly-Drawings/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/gavinadams80-ui/Draftly-Drawings/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/gavinadams80-ui/Draftly-Drawings/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/gavinadams80-ui/Draftly-Drawings/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/gavinadams80-ui/Draftly-Drawings/releases/tag/v0.1.0
