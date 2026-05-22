## Update "Drop Pace" slider copy in Pure Chance panel

File: `src/components/jackpot/MultiJackpotWizard.tsx`

### 1. Rewrite `pickPureChanceVibe` (lines 293-328) with new tier copy

Use dynamic `spins.toLocaleString()` inside the copy so it always reflects the current slider value, with five tiers keyed off thresholds aligned to the requested anchor points (5k, 50k, 250k, 1M, 5M):

- `< 10,000` → ⚡ **Rapid-Fire Mode** — "Expect a hit roughly every {N} spins network-wide. Ideal for ultra-high engagement or promotional happy hours."
- `< 100,000` → 🔥 **Action-Packed** — "Expect a hit roughly every {N} spins network-wide. Perfect for keeping players glued during peak weekend traffic windows."
- `< 500,000` → 📈 **Daily Driver** — "Expect a hit roughly every {N} spins network-wide. This provides a classic, steady promotional heartbeat across your games."
- `< 2,500,000` → 🏆 **Major Milestone** — "Builds significant community buzz. Expect a rare, high-anticipation drop roughly every {N} spins network-wide."
- otherwise → 💎 **The Mega Event** — "An ultra-rare, legendary network event. Expect a drop roughly once every {N} spins network-wide. This is your headline-grabbing marketing campaign."

Change `copy: string` to accept `spins` as a parameter (either pass `spins` into the helper and build the string there, or return a function — simplest: take `spins` arg and return the resolved string in the object).

### 2. Update the panel header (lines 1545-1547)

Replace the small uppercase label "Interval (logarithmic — 1k to 10M spins)" with the two-line treatment matching the reference:

- Title: **"Drop Pace"** (uppercase, same tracking style)
- Description below it: *"How often do you want players to win? Move the slider to set the target number of total spins needed to trigger a drop."*

Slider range/log mapping and the `1 in [N] spins` numeric input stay unchanged.

### Out of scope
- No backend/payload changes; `spinsInterval` value semantics are unchanged.
- No changes to HypeCurve / other panels.
