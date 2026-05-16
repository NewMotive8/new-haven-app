## Problem

Clicking "+ Create New Jackpot" navigates to `/backoffice/jackpots/new` but renders a blank page.

In TanStack Router's flat file-routing, `backoffice.jackpots.new.tsx` is treated as a **child** of `backoffice.jackpots.tsx`. A parent route must render `<Outlet />` for its children to appear — the current `backoffice.jackpots.tsx` (the list page) does not, so the child route matches the URL but renders nothing.

## Fix

Split the jackpots routes into the layout-with-children pattern:

1. **Rename** `src/routes/backoffice.jackpots.tsx` → `src/routes/backoffice.jackpots.index.tsx`
   - Keeps the list page at `/backoffice/jackpots` but as an explicit index child.
   - No code changes inside, just the filename and the `createFileRoute("/backoffice/jackpots/")` path string.

2. **Create** `src/routes/backoffice.jackpots.route.tsx` as a thin layout:
   ```tsx
   export const Route = createFileRoute("/backoffice/jackpots")({
     ssr: false,
     component: () => <Outlet />,
   });
   ```
   This gives the parent path an `<Outlet />` so both the index list and `/new` form can render.

3. **Keep** `src/routes/backoffice.jackpots.new.tsx` as-is — it will now correctly render inside the layout's Outlet.

## Verify

After the rename:
- `/backoffice/jackpots` still shows the table with the "+ Create New Jackpot" button.
- `/backoffice/jackpots/new` shows the wizard form.
- Cancel / success redirect back to the list.

No DB or API changes; this is purely a route-tree fix.