# Evaluation: <resource name>

> Copy this file to `<resource-name>.md`, fill in every section, commit. Sections marked
> ⛔ are gates — a "no" there stops the integration until resolved.

## Identity

- **Name:**
- **URL:**
- **What it is:** (one paragraph — what does it contain, who publishes it, how current is it?)
- **Found by / date:**

## ⛔ Gate 1 — Licence

- **Licence / terms:** (link + name it: MIT? CC-BY? proprietary free-to-view?)
- **Commercial use permitted?** yes / no / unclear
- **Redistribution permitted?** (we EMBED translated copies in our catalogue — viewing
  rights are not enough) yes / no / unclear
- **Attribution required?** what form?

## Gate 2 — Data or code?

- **Form:** structured data (JSON/CSV/tables) / drawings (PDF/DWG/images) / code library
- **If structured:** what fields per detail? (capacities? fastener specs? dimensions?)
- **If drawings only:** worth redrawing as parametric generators, or reference-only?

## Gate 3 — Australian alignment

- **Standards basis:** (AS 4100 / AS 1684 / NASH / overseas?)
- **Metric + AU section sizes?** (C-sections, SHS/RHS per AU catalogues?)
- **AU fasteners?** (e.g. M12 vs imperial)
- **Translation needed:** none / units / full re-engineering

## ⛔ Gate 4 — Engineering backing

- **Rated capacities from a named source?** yes (→ may enter as `'catalogue'`) /
  no (→ enters as `'requires-review'`)
- **Source of the ratings:** (test reports? code calcs? manufacturer data?)

## Mapping to our catalogue

For each detail worth ingesting, one row:

| External detail | → `ConnectionKind` | `params` we'd capture | Verification status | Notes |
|---|---|---|---|---|
|  |  |  |  |  |

(Details that don't fit an existing kind: propose a new `ConnectionKind` — that's a
contract change, flag it for a lib version bump.)

## Recommendation

- **Verdict:** ingest / reference-only / reject
- **Effort estimate:** (one session? script + review?)
- **Open questions for Gavin:**
