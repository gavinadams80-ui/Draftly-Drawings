# External references — landing zone

> Findings from other sessions/chats land HERE as committed files, because the repo is the
> shared brain between conversations — chat memory doesn't cross sessions, a committed
> markdown file does.

## What goes here

One file per external resource we're evaluating or have ingested: connection-detail
libraries, span tables, standards extracts, fastener catalogues, etc. Copy
`EVALUATION-TEMPLATE.md`, fill it in, commit.

## The rules for folding an external library in

1. **Evaluate before integrating.** Four questions decide everything — licence,
   data-or-code, Australian alignment, engineering backing. The template walks through them.
2. **Integrate via this lib, never directly into an app.** `@draftly/drawings` is the parts
   catalogue; Intelligence/Drafting/Engineering must never grow a private copy of connection
   data (that's the drift disease the section catalogue cured).
3. **Ingest data, don't add dependencies.** This lib has zero runtime dependencies — keep it
   that way. External entries get translated ONCE (by a script in `scripts/`) into our
   `ConnectionVariant` format (`src/connectionCatalog.ts`), with the source URL kept in the
   entry for re-checking.
4. **No automatic green ticks.** Imports with rated capacities from a named engineering
   source may enter as `verification: 'catalogue'`. Geometry-only imports enter as
   `'requires-review'` until an engineer signs off. When in doubt: `requires-review`.
