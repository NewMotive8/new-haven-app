# Rebrand sweep → "Incentiv8"

## Scope assessment

A full project sweep for `Motive8`, `Engagd`, and `Jooba` shows the main TanStack app (`src/routes/*`, `src/lib/*`, `__root.tsx`, `admin.tsx`, `login.tsx`, `reset-password.tsx`) is **already branded "Incentiv8"** — head titles, og tags, twitter tags, logo alt attributes all read `Incentiv8`. No `Motive8` strings exist anywhere in the repo.

The remaining `Engagd` / `jooba` hits fall into two buckets:

### Safe to rebrand (user-facing copy)
1. `src/routes/sandbox-demo.tsx:767` — visible chip label `#jooba-container-root · N pools`. Rephrase the **label** to `Player widget host · N pool(s)` (keep the underlying DOM id intact — see guardrails).
2. `src/backoffice/docs/backoffice/SETUP_RUN.md:1` — doc heading `# Engagd Backoffice Setup and Run Guide` → `# Incentiv8 Backoffice Setup and Run Guide`.

### Must NOT rebrand (technical identifiers — would break runtime)
Per the guardrails you set (no breaking handshakes, keep file paths / imports intact):

- All `.jooba-*` CSS class names and `id="jooba-*"` DOM identifiers across `src/routes/sandbox-demo.tsx`, `src/Widget/**`, `src/backoffice/**`, and the CDN stylesheets (`src/Widget/cdn/styles/style{1,2,3}.css`, `pridebet-light.css`, `win-animation-default.css`). The live widget SDK mounts onto `#jooba-container-root` and styles itself with the `.jooba-*` selector contract — renaming either side desyncs them.
- File / directory names containing `jooba` (`jooba-lucky-wheel.css`, `jooba-lw-types.ts`, `public/libs/engagd/*`, `public/libs/jooba/jooba.lw.min.js`) and any imports referencing them.
- `@keyframes jooba-*` animation names (paired with `animation: jooba-* …` declarations — renaming one side without the other silently kills the animation).
- npm package names / lockfile entries inside `src/Widget/package.json` and `src/Widget/package-lock.json`.
- Lottie payload keys, Widget internal model field names, and any SDK init strings inside `src/Widget/src/**` (these are part of the wire-format contract).

## Files changed
1. `src/routes/sandbox-demo.tsx` — one-line label edit on line 767.
2. `src/backoffice/docs/backoffice/SETUP_RUN.md` — one-line heading edit on line 1.

## Out of scope
No edits to `.env`, `INTERNAL_SERVICE_SECRET`, Supabase config, API endpoint URLs, payload keys, route paths, or any of the auto-generated files (`routeTree.gen.ts`, `dist/**`).

## Verification
After the edit, re-run `grep -rn 'Motive8\|Engagd' src --include='*.tsx' --include='*.ts' --include='*.md'` and confirm no user-facing copy hits remain (only the doc title we just changed, plus the technical `engagd` directory under `public/libs/`, which is a vendor folder path).
