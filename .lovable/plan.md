## Goal

Replace the static "Engagd Backoffice" badge landing with a dashboard grid of nav cards so the user always has somewhere to click from `/backoffice`.

## Cards (one per top-level area from the original backoffice)

Each card: icon + title + short description + status badge.

| Card             | Target route                  | Status        |
|------------------|-------------------------------|---------------|
| Jackpots         | `/backoffice/jackpots`        | Active (link) |
| Simulator        | `/backoffice/jackpots/simulator` | Coming soon |
| Lucky Wheel      | `/backoffice/lucky-wheel`     | Coming soon  |
| Raffles          | `/backoffice/raffles`         | Coming soon  |
| Spin Sprint      | `/backoffice/spinsprint`      | Coming soon  |
| Tournament       | `/backoffice/tournament`      | Coming soon  |
| Admin            | `/backoffice/admin`           | Coming soon  |
| Root / Catalog   | `/backoffice/root`            | Coming soon  |

Active cards render as TanStack `<Link>`s. Coming-soon cards render as a non-clickable tile with a muted "Coming soon" pill — no dead routes, no 404s.

## Implementation

1. Replace `BackofficeLanding` (`src/backoffice/src/components/backofficeLanding/BackofficeLanding.tsx`) with a responsive grid:
   - Header row: small "Engagd Backoffice" eyebrow + welcome line ("Pick a module to get started.") using the existing `TextTranslated`/`Typography` flow so it still routes through i18n.
   - Grid: `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))`, gap 16px, max-width container.
   - Each card: dark panel matching the current shell palette (`#0f172a` / `#1f2a44` border), 20px padding, 12px radius, icon (`react-icons/fa`) top-left, title, description, status pill bottom-right.
   - Hover state on active cards: subtle lift + border highlight. Disabled cards: `opacity: 0.55`, `cursor: not-allowed`.
2. Move the existing "No default page set" copy into a small footnote under the grid so the translation key still resolves (keeps the i18n wiring honest).
3. No SCSS module changes required beyond what we already have; keep styles inline (matches the rest of the ported shell) to avoid pulling in more of the legacy SCSS toolchain at this step.
4. No header/nav changes — Home and Jackpots stay as-is. We will grow the header nav as each "coming soon" card gets a real screen in later steps.

## Out of scope

- Porting any of the "coming soon" screens (Simulator, Admin, etc.). That belongs in Step 3.
- Restyling the global header.
- Adding a real default-page setting per user.

## Files touched

- `src/backoffice/src/components/backofficeLanding/BackofficeLanding.tsx` (rewritten)
