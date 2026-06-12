# Evaluation: Simpson Strong-Tie AU/NZ

> Status: evaluated 2026-06-13 (connection library research session). ⛔ Gate 1 OPEN —
> do not ingest until Simpson Strong-Tie AU grants written permission.

## Identity

- **Name:** Simpson Strong-Tie Australia/New Zealand connector catalogue
- **URL:** https://www.strongtie.com.au
- **What it is:** Manufacturer catalogue of structural connectors — post bases, brackets,
  hangers, straps — with published load tables rated for the AU market. Load tables are
  characteristic capacities with φ = 0.85 per AS 1720.1 (Category 1 connectors). Maintained
  by the manufacturer; current.
- **Found by / date:** connection library research session, 2026-06-13

## ⛔ Gate 1 — Licence

- **Licence / terms:** proprietary, free-to-view manufacturer catalogue. Embedding the
  load tables in a commercial product needs explicit permission.
- **Commercial use permitted?** unclear — **written permission required before ingest**
  (blocking action: email Simpson Strong-Tie AU re commercial embedding).
- **Redistribution permitted?** unclear — same permission request covers it.
- **Attribution required?** assume yes; every ingested entry carries the provenance string
  `"Simpson Strong-Tie, load tables per AS 1720.1, φ=0.85 Category 1"`.

## Gate 2 — Data or code?

- **Form:** structured data — per-SKU load tables (uplift / download / lateral), plus
  installation drawings.
- **If structured:** per connector SKU: rated capacities by load direction, fastener
  spec (type, count, size), member size compatibility.
- **If drawings only:** n/a — drawings are supporting; the load tables are the asset.

## Gate 3 — Australian alignment

- **Standards basis:** AS 1720.1 (timber structures) — capacities published with φ = 0.85,
  Category 1. Note: timber code basis; fine for timber-post / timber-member interfaces,
  flag any steel-to-steel use for engineering review.
- **Metric + AU section sizes?** yes — AU/NZ catalogue, metric.
- **AU fasteners?** yes (metric bolt/screw specs in the tables).
- **Translation needed:** none for units; format translation only (tables → catalogue JSON).

## ⛔ Gate 4 — Engineering backing

- **Rated capacities from a named source?** yes → eligible for `verification: 'catalogue'`
  once licence is granted.
- **Source of the ratings:** manufacturer test-based load tables published to AS 1720.1.

## Mapping to our catalogue

| External detail | → `ConnectionKind` | `params` we'd capture | Verification status | Notes |
|---|---|---|---|---|
| Post bases (e.g. PB/ABU series) | `post-footing` | connector SKU, post size, fastener spec, capacities per direction | `catalogue` | Direct fit — fills the "parametric footing generator wanted" gap with rated options |
| Brackets / hangers | `rafter-ledger` (member-to-member) | connector SKU, member sizes, fastener spec, capacities | `catalogue` | Map per-SKU; anything not matching an existing kind gets flagged rather than forced |
| Capacity data shape | — | `[connector_sku] → { uplift_kN, download_kN, lateral_kN }` + provenance string | — | Per the capacity-schema proposal ([connection-capacity-schema.md](connection-capacity-schema.md)) |

## Recommendation

- **Verdict:** ingest — **second in priority order** (after Lysaght) once permission is
  in hand.
- **Effort estimate:** script + review — more SKUs than Lysaght; one session for the
  translation script, a second for the mapping review.
- **Open questions for Gavin:**
  - ⛔ Email Simpson Strong-Tie AU for written permission to embed load tables in a
    commercial product (the blocking action).
  - Which SKU families matter for our frames (post bases certainly — which brackets)?
