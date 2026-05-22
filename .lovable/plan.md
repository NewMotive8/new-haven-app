## Move Trigger Probability into Win Logic & Model (Classic mode)

Currently in Classic Progressive mode, the "Win Logic & Model" card only contains a compliance alert, and the "Trigger Probability" block renders as a separate top-level section further down the page.

### Change
In `src/components/jackpot/JackpotCreationForm.tsx` (Classic branch only):

1. Inside the Classic "Win Logic & Model" card (around line 1673), render the existing `triggerProbabilitySection` immediately after the compliance alert — but without its outer `<section>` wrapper/heading, so the denominator input, helper text, and RNG boundary note appear inline under "Win Logic & Model" as a subsection (e.g. small "Trigger Probability" sub-heading).
2. Remove the standalone `{triggerProbabilitySection}` render at line 2203 in the Classic branch so it no longer appears as its own top-level section.
3. Leave Must-Drop and Frequency branches untouched (they already exclude Trigger Probability per Option A).

### Out of scope
- No changes to state, validation, payload, or mode-exclusivity logic.
- No changes to Must-Drop / Frequency / Multi-Level layouts.