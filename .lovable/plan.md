## Goal

Add an Opt-in / Opt-out button to the per-game QA overlay on `/demo`, reusing the same pattern already shipped in `/sandbox-demo` (no new UX invented). Spin is gated behind opt-in, exactly like the player widget.

## Scope (frontend only)

File: `src/components/demo/QaOverlay.tsx`

1. **Local state**
   - Add `const [optedIn, setOptedIn] = useState(false);`
   - Reset to `false` whenever `resolution.jackpot?.id` changes (switching games).

2. **Button** (placed just above the existing Spin button, right column)
   - When `!optedIn`: primary button labeled `Opt in Jackpot` (matches `texts.optInButton` from sandbox-demo).
   - When `optedIn`: secondary button labeled `Opt out`.
   - Disabled when `resolution.status !== "active"`.
   - Same visual language as sandbox-demo (`jooba-btn` primary/secondary) — translate to Tailwind already used in the overlay (amber gradient for primary, slate border for secondary) so it fits the QA panel aesthetic.

3. **Status label** under the resolved jackpot input, mirroring sandbox-demo's `userInLabel` / `userOutLabel`:
   - In: green pill "You are opted in"
   - Out: slate pill "You are opted out"

4. **Gate Spin**
   - Disable the existing Spin button when `!optedIn` (in addition to its existing `!selectedJp` / `spinning` conditions).
   - Tooltip / helper text: "Opt in to spin."

## Backend / server-fn

No changes. `placeDemoBet` doesn't take an opt-in flag — opt-in is a client-side gate in `/sandbox-demo` too. The bet endpoint behavior stays identical.

## Out of scope

- No new server functions, schema, or styles file.
- No changes to `/sandbox-demo`.
- No persistence across overlay reopen (sandbox-demo also resets per session).

## Expected result

Opening the QA modal on a game routed to an active jackpot shows:
- "You are opted out" + amber **Opt in Jackpot** button, Spin disabled.
- After clicking opt-in: "You are opted in" + slate **Opt out** button, Spin enabled.
