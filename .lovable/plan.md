## Problem

In `src/components/jackpot/JackpotCreationForm.tsx`, three helper components — `BrightLabel`, `CurrencyInput`, and `PercentageInput` — are defined **inside** the `JackpotCreationForm` function body (lines 160–178).

Because they're redeclared on every render, React treats them as a new component type on each keystroke and unmounts/remounts the underlying `<Input>` / `<Label>`. The DOM input loses focus immediately, which is why typing or entering numbers in fields like Internal Name, currency amounts (Initial Jackpot, Min/Max Wager, Min/Max Win, Fixed Win Amount, Re-Seeding Amount, Maximum Seed Amount, etc.) and percentage fields (Pool Contribution %, Seed Contribution %) doesn't work.

The same root cause also affects the Textarea (Internal Description), because re-rendering the parent recreates the wrappers around it indirectly via re-mounted siblings sharing keys in the same subtree.

## Fix

Hoist the three helper components to module scope (above the `JackpotCreationForm` component), so their identity is stable across renders.

```text
src/components/jackpot/JackpotCreationForm.tsx
├─ (top of file, after imports)
│   ├─ BrightLabel        ← moved out
│   ├─ CurrencyInput      ← moved out
│   └─ PercentageInput    ← moved out
└─ function JackpotCreationForm() {
    └─ (delete lines 160–178)
```

No prop signatures change, no behavior changes — only the declaration location.

## Verification

1. Open `/backoffice/jackpots/new`.
2. Type a multi-character name in "Internal Name" — full string should appear.
3. Type a description in the Textarea — full text should appear and stay visible (white on dark).
4. Enter numbers in Pool Contribution %, Initial Jackpot Amount, Min/Max Wager, etc. — values should persist as you type.
5. Sliders (Player/Operator Contribution) should continue to work as before.

## Out of scope

- No changes to form state, validation, submit logic, database mapping, or styling.
- No new fields or layout edits.