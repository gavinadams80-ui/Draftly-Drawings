# Releasing & consuming `@draftly/drawings`

This package is the single source of truth for Draftly drawing geometry. It is
consumed by **Draftly-Engineering** and **Draftly-Drafting** today, and is meant
to stay clean enough that external consumers (customers) can adopt the same
process later.

It is consumed as a **pinned git tag**, so every release is an immutable,
reproducible point. Nothing consumes `main` directly.

---

## Versioning policy (semver for an SVG-generator lib)

The public surface is the set of **exports** from `src/index.ts` (and
`@draftly/drawings/pdf`): function signatures, exported types, and the **SVG
contract** each generator promises (its coordinate space, viewBox convention,
and any `data-*` attributes consumers rely on).

| Bump      | When                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------- |
| **MAJOR** | A consumer must change code: a renamed/removed export, a changed function signature, or a changed SVG contract (different viewBox/units/`data-*` that consumers depend on). |
| **MINOR** | Backward-compatible additions: a new generator, a new export, a new optional parameter, a new catalog/template. Existing consumers keep working untouched. |
| **PATCH** | Geometry or bug fixes with no API change. Output may look better; the contract is unchanged.           |

> Pre-1.0 caveat: while we are `0.x`, breaking changes ride a **MINOR** bump by
> semver convention. Call them out loudly in the CHANGELOG under `### Changed`
> with a **BREAKING** prefix so consumers know a re-pin needs code review.

---

## Publishing a release (in this repo)

1. **Branch & build clean.**
   ```bash
   npm install
   npm run typecheck     # type-only, must pass
   npm run build         # emits dist/ (JS + .d.ts)
   ```
2. **Bump the version** in `package.json` (`version` field) to the new `vX.Y.Z`.
3. **Update `CHANGELOG.md`:** move items out of `[Unreleased]` into a new
   `## [X.Y.Z] — YYYY-MM-DD` section; add the `compare` link at the bottom.
4. **Commit** on a branch and open a PR to `main`:
   ```bash
   git commit -am "release: vX.Y.Z — <one-line summary>"
   ```
5. **After merge to `main`, tag the merge commit and push the tag:**
   ```bash
   git checkout main && git pull
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
   The tag is what consumers pin. Do not move or delete a published tag — cut a
   new patch instead.

`dist/` is committed and `prepare` also rebuilds it on install, so consumers get
working `dist/` whether they install from the committed tree or build on fetch.

---

## Consuming a release (in Engineering or Drafting)

One command, identical everywhere — only the version changes:

```bash
npm install @draftly/drawings@github:gavinadams80-ui/Draftly-Drawings#vX.Y.Z
```

Then **smoke-test before committing the bump:**

```bash
npx tsc -b --noEmit      # signatures/types still line up?
npm run dev              # app renders, no console errors
```

Commit the resulting `package.json` + `package-lock.json` change with a message
that names the version, e.g. `chore(deps): bump @draftly/drawings to vX.Y.Z`.

### If the bump breaks typecheck

That means the new version changed the API (should have been flagged in the
CHANGELOG). Either adapt the consumer to the new signature, or pin back to the
previous tag and coordinate the change. Never edit files under
`node_modules/@draftly/drawings` — they are overwritten on the next install.

---

## Keeping the two apps in step

Engineering and Drafting should not drift far apart on the pin. When you release
a version that both need, re-pin **both** apps in the same work session and note
it in each app's commit. A version that only one app needs is fine to adopt
asymmetrically, but record it so the other app's next bump is a conscious choice.
