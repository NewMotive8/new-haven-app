# Fix: Sandbox demo needs a default brand id

## What's happening

You don't have a brand id to type in because the project never asked you for one — the admin app uses a hardcoded mock brand (`brandId: 1`, defined in `src/backoffice/app.tsx`). Every jackpot you create from `/admin/jackpots/new` is saved under that brand. The `/sandbox-demo` page, however, starts with an empty brand input and just sits there waiting.

## Fix

In `src/routes/sandbox-demo.tsx`, default the brand id to `"1"` so the demo works out of the box, matching the rest of the admin:

- When `localStorage` has no stored value, initialize `brandId` to `"1"` instead of `""`.
- Keep the text input so it can still be overridden later if multi-brand support is added.
- Add a small inline hint under the input: "Defaults to the admin mock brand (1)."

That's the only change. The header-name fix from the last turn is already in place, so once a brand id is present, polling will succeed and your jackpot will appear within ~2s.

## Files touched

- `src/routes/sandbox-demo.tsx` — default `brandId` state to `"1"`, add hint text.
