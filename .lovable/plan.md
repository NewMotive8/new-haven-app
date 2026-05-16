## Goal

Rename the `/backoffice` URL to `/admin` so the admin panel lives at `admin.incentiv8.co/admin` (and root `/` redirects there).

## Scope

Only the TanStack route URL changes. The internal `src/backoffice/` library directory keeps its name — it's an internal module, not a URL, and renaming it would touch hundreds of unrelated imports.

## Changes

1. **Rename route files** in `src/routes/`:
   - `backoffice.tsx` → `admin.tsx`
   - `backoffice.index.tsx` → `admin.index.tsx`
   - `backoffice.jackpots.tsx` → `admin.jackpots.tsx`
   - `backoffice.jackpots.index.tsx` → `admin.jackpots.index.tsx`
   - `backoffice.jackpots.new.tsx` → `admin.jackpots.new.tsx`
   - `backoffice.simulator.tsx` → `admin.simulator.tsx`

2. **Update `createFileRoute("/backoffice/...")` strings** inside each renamed file to `/admin/...`.

3. **Update `<Link to="/backoffice/...">`** in the nav (in `admin.tsx`) and in `src/components/jackpot/JackpotCreationForm.tsx` to point to `/admin/...`.

4. **Update the root redirect** in `src/routes/index.tsx` from `/backoffice` → `/admin`.

5. Let `routeTree.gen.ts` regenerate automatically.

## Out of scope

- The `src/backoffice/` source directory (internal module name) stays the same.
- Widget files referencing legacy backoffice URLs are unrelated to the admin route and untouched.
- No backend / API path changes.

After approval and publish, the panel will be live at `admin.incentiv8.co/admin`, with `admin.incentiv8.co/` redirecting to it.