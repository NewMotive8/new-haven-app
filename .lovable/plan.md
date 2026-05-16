## Why nothing looks different

The per-type fields (Classic / Frequency / Must Drop / Multi-Level) only render after you select a type in the left column's **Jackpot Type** dropdown. Until then the right column shows the placeholder. Verified live in the preview — the page rendered correctly with the dropdown set to "Select a type…".

## Proposed fix — make the change visible immediately

1. **Default the dropdown to `Classic`** so the right column populates the moment the page loads (Base Seed Amount, Contribution slider, Volatility slider, Maximum Cap toggle).
2. **Brighten the empty-state placeholder** to read "Select a type from the left to configure" with a clearer arrow indicator — only relevant if the user later clears the selection.
3. **Add a tiny "Required" hint on the dropdown** so it's obvious that picking a type is what unlocks the right side.

Single file: `src/routes/backoffice.jackpots.new.tsx`. No DB / schema / server changes.

## Quickest path to verify the existing build right now

Open the dropdown and pick **Classic**, **Frequency**, **Must Drop**, or **Multi-Level** — the right column will swap in the exact spec'd fields (currency input, percent slider, volatility slider, cap toggle, segmented Value/Time toggle, level tier grid, etc.). If you confirm those render as expected, I'll apply the default-to-Classic change so it's obvious on first load.
