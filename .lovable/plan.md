## Issue
The simulator screen only renders a "← Back to Editor" button when `cameFromCreationFlow === true` (i.e. when you arrived from `/admin/jackpots/new` carrying state). When you open `/admin/simulator` directly (your current case), the conditional block at lines 225–247 of `src/routes/admin.simulator.tsx` is hidden, so there's no way back to the admin area.

## Plan
Add a persistent "Back" control to the simulator header so it's always visible, independent of how the user landed on the page.

1. In `src/routes/admin.simulator.tsx`, add a small `← Back` link at the top of the page (inside the page header, before the title).
   - Uses `<Link to="/admin/jackpots">` (the jackpots list) as the default destination — that's the natural parent in the admin nav.
   - Styled to match the existing muted ghost-button look (`#9fb0c8` text, `1px solid #1f2a44` border, transparent bg, 8px radius).
2. Keep the existing conditional "← Back to Editor" button intact — it's still useful when the user came from the creation flow (it preserves the in-memory payload via `originalPayloadRef`). The new header Back is just the always-available escape hatch.

No business logic, simulator engine, or DTO changes. Pure UI addition.
