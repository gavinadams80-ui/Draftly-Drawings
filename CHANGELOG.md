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

[Unreleased]: https://github.com/gavinadams80-ui/Draftly-Drawings/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/gavinadams80-ui/Draftly-Drawings/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/gavinadams80-ui/Draftly-Drawings/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/gavinadams80-ui/Draftly-Drawings/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/gavinadams80-ui/Draftly-Drawings/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/gavinadams80-ui/Draftly-Drawings/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/gavinadams80-ui/Draftly-Drawings/releases/tag/v0.1.0
