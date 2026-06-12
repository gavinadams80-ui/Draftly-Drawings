# Evaluation: blocks.draftsperson.net

> Status: evaluated 2026-06-13 (connection library research session). Geometry only —
> anything ingested enters as `requires-review`, never `catalogue`.

## Identity

- **Name:** blocks.draftsperson.net — AU structural steel detailing blocks
- **URL:** https://blocks.draftsperson.net
- **What it is:** A community/free collection of Australian structural steel detailing CAD
  blocks (connection details, cleats, base plates, standard detailing symbols), metric.
  Drafting aids, not engineering documents — no capacities or ratings.
- **Found by / date:** connection library research session, 2026-06-13

## ⛔ Gate 1 — Licence

- **Licence / terms:** free community blocks; formal licence terms not clearly stated.
- **Commercial use permitted?** unclear — as with cad-steel.info, prefer redrawing details
  as our own parametric generators over embedding any downloaded file.
- **Redistribution permitted?** unclear — same approach: redraw, don't embed.
- **Attribution required?** carry the provenance string regardless:
  `"blocks.draftsperson.net, AU structural steel detailing blocks, metric"`.

## Gate 2 — Data or code?

- **Form:** drawings (CAD detailing blocks).
- **If structured:** n/a — no data fields.
- **If drawings only:** useful as visual references for what standard AU details look like
  when building/extending our connection generators (e.g. the wanted parametric
  post-footing generator). Reference material, not ingestible data.

## Gate 3 — Australian alignment

- **Standards basis:** AU detailing practice (drafting convention, not a design standard).
- **Metric + AU section sizes?** yes — metric AU detailing.
- **AU fasteners?** depicted in details, but as drawings, not specs.
- **Translation needed:** full redraw as parametric generators if any detail is adopted.

## ⛔ Gate 4 — Engineering backing

- **Rated capacities from a named source?** no — geometry only → `requires-review` at
  most; primarily reference-only.
- **Source of the ratings:** none.

## Mapping to our catalogue

| External detail | → `ConnectionKind` | `params` we'd capture | Verification status | Notes |
|---|---|---|---|---|
| Base plate / footing details | `post-footing` | (geometry reference only — params come from an engineering source) | `requires-review` | Visual reference for the wanted parametric footing generator; capacities must come from Simpson/ASI |
| Cleat / bracket details | `rafter-ledger` and friends | (geometry reference only) | `requires-review` | Same pattern — shape from here, numbers never |

## Recommendation

- **Verdict:** reference-only — drafting inspiration for our own generators; do not ingest
  as catalogue entries. **Last in priority order** alongside cad-steel.info.
- **Effort estimate:** zero standalone; consulted opportunistically while building
  generators.
- **Open questions for Gavin:** none blocking — no permission emails needed unless we
  decide to embed a file verbatim (which we shouldn't).
