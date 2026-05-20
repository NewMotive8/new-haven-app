# Align Pool & Seed sections with the Figma reference

## What the image shows

Pool and Seed are **subsections inside the single "Jackpot Contribution" card** — not standalone sections. Layout, top to bottom inside that one card:

1. Fixed / Percent pill toggle
2. Fixed Contribution Amount input
3. Contribution Weight table (Pool / Seed / House)
4. **Pool** (small heading inside the card)
   - Jackpot Initial Amount (€)
   - "Player / Operator contribution" label
   - Two side-by-side number inputs: Player (%) and Operator (%)
   - Player↔Operator slider with 0% / 50% / 100% markers
5. **Seed** (small heading inside the card)
   - No seed amount (€)
   - "Player / operator contribution" label
   - Player (%) and Operator (%) side-by-side inputs
   - Player↔Operator slider
   - Full Buffer Re-Seed (€)
   - Buffer Cap (€)
   - Maximum seed amount (€)

## Differences vs current code

| # | Figma | Current | Action |
|---|---|---|---|
| 1 | Pool/Seed live inside the Jackpot Contribution card | Pool Setup and Seed Setup are separate top-level sections with their own H2 | Move Pool + Seed inside the Jackpot Contribution card; drop the separate `<h2>Pool Setup</h2>` and `<h2>Seed Setup</h2>` |
| 2 | No Fixed/Percentage toggle inside Pool | A `Fixed / Percentage` toggle exists at the top of Pool Setup | Remove the toggle from Pool Setup (the one you selected) |
| 3 | No Fixed/Percentage toggle inside Seed | Same toggle exists at top of Seed Setup | Remove it from Seed Setup as well |
| 4 | Pool has Player **and** Operator number inputs side-by-side, plus a slider | Pool has only a slider (no twin number inputs) | Add the Player/Operator twin % inputs above the slider |
| 5 | Seed has the same Player/Operator twin inputs + slider pattern | Seed has only a slider | Add the twin % inputs to Seed too |
| 6 | Seed has "Full Buffer Re-Seed", "Buffer Cap", "Maximum seed amount" fields | Those fields are missing | Add the three € inputs under the seed slider |
| 7 | Slider tick labels read `0% / 50% / 100%` under a single track with "Player" on left and "Operator" on right of the label row | Current matches roughly but tick labels and label row alignment differ slightly | Tighten labels to match |
| 8 | "Pool" and "Seed" subheadings are small/medium weight, not H2 | Currently H2 with big margin | Render as small section labels (e.g. `text-base font-semibold mb-4`) |

These same three places exist three times in the file (Classic, Must Drop, Frequency render paths) — the changes need to be applied in all three.

## Plan of work

1. **Remove** the Fixed/Percentage toggle block at the top of Pool Setup and Seed Setup in all three render paths.
2. **Demote** `<h2>Pool Setup</h2>` and `<h2>Seed Setup</h2>` to small in-card subheadings, and move the Pool/Seed JSX inside the Jackpot Contribution card so everything lives in one bordered card.
3. **Add** Player (%) / Operator (%) twin number inputs above each slider, two-way bound to the existing `playerContribution` / `operatorContribution` state.
4. **Add** "Full Buffer Re-Seed", "Buffer Cap", "Maximum seed amount" inputs under the Seed slider, wired to existing form state (or new state if missing — will be confirmed during implementation).
5. Apply the same three steps to the Classic, Must Drop, and Frequency code paths (~lines 1100, 2160, 3652 in `src/components/jackpot/JackpotCreationForm.tsx`).
6. Visual QA against the reference image at the end.

No backend / business-logic changes — purely layout + a couple of new bound inputs.
