# Proposal: rated-capacity fields on ConnectionVariant

> From the connection library research session, 2026-06-13. Companion to the per-library
> evaluations in this folder. Status: PROPOSAL — adopting it is a contract change to
> `ConnectionVariant` (`src/frames.ts`) and therefore a lib version bump.

## Why

The two manufacturer data sources worth ingesting ([Lysaght](lysaght-zeds-cees-2023.md),
[Simpson Strong-Tie](simpson-strong-tie-au.md)) and the ASI DCT ([Vol. 4](asi-dct-vol4.md))
all publish *rated capacities per load direction*. Today `ConnectionVariant.params` is an
untyped `Record<string, number | string>` — fine for geometry knobs, wrong for engineering
data that Engineering must read programmatically and that must never lose its provenance.

## Shape

Capacities live per connector SKU, keyed by load direction, with a provenance string on
**every** entry (the no-orphaned-numbers rule):

```jsonc
{
  // on ConnectionVariant
  "capacities": {
    "connector_sku": "PB100",          // manufacturer SKU the numbers belong to
    "uplift_kN": 12.5,
    "download_kN": 30.0,
    "lateral_kN": 8.2,
    "provenance": "Simpson Strong-Tie, load tables per AS 1720.1, φ=0.85 Category 1"
  }
}
```

- A variant without rated data simply omits `capacities` (current catalogue entries).
- Directions a source doesn't rate are omitted, never zero-filled — absence means
  "not rated", zero means "rated at zero".
- The provenance string is the exact citation format agreed per source (see each
  evaluation file); it travels with the entry into both apps untouched.

## Rules of engagement

1. Capacities enter ONLY via a one-time translation script in `scripts/` (landing-zone
   rule 3) — never hand-typed into the catalogue.
2. `verification: 'catalogue'` requires Gate 1 (licence) **and** Gate 4 (named engineering
   source) closed; otherwise `requires-review` (landing-zone rule 4).
3. `bumpVariant` already resets verification on edit — editing a variant with capacities
   must also DROP the capacities (the numbers were rated for the original configuration).

## Open questions

- One SKU per variant (as above), or a per-variant table of SKUs? Start with one — a
  different SKU is a different dropdown option, which matches how the dropdowns work.
- Where does Engineering's demand-vs-capacity check live? (Engineering repo; this lib just
  carries the data.)
