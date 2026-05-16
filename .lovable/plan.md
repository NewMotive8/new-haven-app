## Goal

Replace the current bare-bones `/backoffice/jackpots` table with the Figma "Jackpot Dashboard" — sticky header, page header + Create button, 4 stat cards, filter chips, search, and a styled table with status badges and per-row actions — wired to our real `/api/v2/jackpots` backend.

## What's in the GitHub repo

Pulled the Figma `Dashboard.tsx` (518 lines) from `NewMotive8/Redesignjackpotcreationflow`. Findings:

- **No new image assets are needed.** The dashboard uses only emoji glyphs (🎰 💰 💎 🏆) and `lucide-react` icons (Clock, LogOut, Search, Plus, Edit, Copy, Trash2). The 4 PNGs in that repo's `src/assets/` are the creation-flow widget previews we already imported into `src/assets/jackpot/` last week.
- **All shadcn primitives already exist** in our project (`button`, `input`, `card`, etc.) — no new UI components to install.
- **No new fonts, no new CSS variables** beyond what `src/styles.css` already provides (we'll lean on existing `bg-neutral-*` / `text-*` Tailwind utilities exactly as the Figma source does).

So nothing is missing — I can build it 1:1 against what's already in our project.

## Real data vs. Figma mock — and what's missing on the backend

This is the only real gap and I want to call it out before building. The Figma uses this mock shape:

```ts
{ id, name, type: 'Classic'|'Must Drop'|'Multi-Level'|'Frequency',
  status: 'active'|'template'|'disabled',
  currentValue, totalWins, totalPayout, lastWin, createdDate }
```

Our backend (`JackpotDTO` from `/api/v2/jackpots`) returns:

```ts
{ id, name, enabled, poolBalance, seedAmount, contributionRate,
  triggerThreshold, brandId, createdAt, updatedAt,
  volatility?, jackpotType?, config? }
```

Mapping I plan to use (no schema change, no migration):

| Figma column | Source |
|---|---|
| Name | `name` |
| Type | `jackpotType` ("Classic" / "Must Drop" / "Multi-Level" / "Frequency"); falls back to "Classic" |
| Status | `enabled === false` → `disabled`, otherwise `active`. **No `template` concept exists in our DB yet** — the Template chip will show count 0 and Template filter will show empty until we add a `is_template` column. I'll leave the chip in place so the UI matches Figma. |
| Current Value | `poolBalance` |
| Total Wins | **Not in DTO.** Will render `—` for now. |
| Total Payout | **Not in DTO.** Will render `—` for now. |
| Last Win | **Not in DTO.** Will render `—`. |
| Created | `createdAt` (formatted `YYYY-MM-DD`) |

Stat cards:
- Total Jackpots = `totalElements`
- Current Pool Value = sum of `poolBalance` across the current page (annotated "page total" so it's not misleading)
- Total Payouts / Total Wins = `—` until we expose aggregates

If you want real Total Wins / Total Payout / Last Win, that's a follow-up task — needs new columns or a join against a `jackpot_wins` table. I'll flag this in the closing message but won't block this redesign on it.

## Implementation

### 1. `src/routes/backoffice.jackpots.index.tsx` — rewrite

- Keep the existing `useJackpotsPage` hook + `BrandContext` — only the rendering changes.
- Increase default page size to 50 so all jackpots fit comfortably (current 20 is fine; bump only if needed for visual parity).
- Drop the inline `style={{}}` blocks; switch to Tailwind classes from Figma (`bg-neutral-950`, `border-neutral-800`, etc.).
- Render:
  - Sticky header bar (Incentiv8 logo block + live UTC clock + Logout button) — Logout posts to existing supabase signOut.
  - Page header + "Create New Jackpot" `<Link>` to `/backoffice/jackpots/new` (replaces `useNavigate('/create')`).
  - 4 stat cards (with the mapped-or-`—` rule above).
  - Filter chips (All / Active / Template / Disabled) — local state, filters the current page client-side.
  - Search input — client-side filter on `name` + `jackpotType`.
  - Table with the 9 Figma columns, status badge styling, and the action group:
    - Active rows → "Disable" button → calls existing `POST /api/v1/jackpots/disable.$id`, invalidates the query.
    - Template/Disabled rows → Edit / Copy / Trash icon buttons (Edit links to a future detail route, Copy/Trash wired as no-ops with a `TODO` comment — Figma shows them as decorative on templates).
  - Pagination row kept underneath the table (Figma omits it but our data is paginated; I'll style it to match the dark theme).

### 2. No backend changes, no new files

- No migration. No new API route. No new asset import. No new dependency.
- `lucide-react` is already installed (used throughout `src/components/ui/*`).

### 3. Auth wrapper / shell

The route already mounts inside our `/backoffice` shell (`src/routes/backoffice.tsx`), which provides brand context + auth. The Figma's own `<header>` will sit inside that shell — I'll trim the duplicated logo if our outer shell already shows one (need to peek at `backoffice.tsx` during implementation; will hide the Figma header if it duplicates).

## Out of scope (call out, don't build)

- Adding `is_template`, `total_wins`, `total_payout`, `last_win_at` columns to `jackpots` — needs a migration + write-path changes from the simulator/win events.
- Real-time clock in the header — included (1s `setInterval`), matches Figma.
- Edit / Copy / Delete row actions for templates — wired as placeholders only.

## Verification

1. Visit `/backoffice/jackpots`. Confirm sticky header, 4 stat cards, filter chips, search, and table render as in the screenshot.
2. Click a filter chip → table filters; counts on chips stay accurate.
3. Type in search → table filters by name/type.
4. Click "Disable" on an active row → row flips to Disabled badge, network shows successful POST.
5. Click "Create New Jackpot" → navigates to `/backoffice/jackpots/new`.
6. Confirm no console errors and the page works on the current 1239×784 viewport.