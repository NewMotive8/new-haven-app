# Port JackpotCreationForm to the Admin project

Copy the current `JackpotCreationForm.tsx` (with all recent layout polish — Fixed/Percent pills, Jackpot Contribution placement, 140/200/200 weight table, narrowed Fixed Contribution input, multi-level tier cards, etc.) into the [Admin](/projects/a9c97024-0dfc-4431-909f-455fbd4c43ad) project.

## What gets copied

- `src/components/jackpot/JackpotCreationForm.tsx` — full file overwrite

The Admin project already has:
- The same TanStack Start + Tailwind + shadcn/ui stack
- The same `@/components/ui/*` primitives the form imports
- The same `src/assets/jackpot/*` images the form references
- An existing `JackpotCreationForm.tsx` at the same path (will be overwritten)

So no other files need to move — imports resolve as-is.

## Out of scope

- Backend / `src/lib/jackpot/*` helpers — only port if the Admin form complains about a mismatch after the copy. We'll check after.
- Routes that mount the form — assumed to already exist in Admin since the file is already there.
- The legacy `src/backoffice/` folder in this repo — not touched.

## After porting

Open the Admin project's `/admin/jackpots/new` route, confirm the Jackpot Contribution section matches the reference (Fixed/Percent pills, narrow Fixed Contribution input, compact 3-column weight table), and adjust if any imports differ.
