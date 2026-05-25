## Goal
Hide the "Preset template" selector in the simulator when it's opened from a Create/Edit Jackpot flow, while keeping it visible when accessed directly from `/admin`.

## Implementation

**File:** `src/routes/admin.simulator.tsx`

The component already tracks origin via `cameFromCreationFlow` (line 173), which is true when the simulator is launched from the creation/edit flow with a preloaded payload. We'll reuse it as the single source of truth.

**Change (lines ~402–423):** Wrap the entire "Preset template" `<div>` (label + `<select>`) in:

```tsx
{!cameFromCreationFlow && (
  <div>
    <label style={label}>Preset template</label>
    <select ...>...</select>
  </div>
)}
```

## Notes
- No layout breakage: the parent uses a simple stacked block layout, so removing one child collapses cleanly.
- No changes to simulation logic, templates array, or default initial state — direct `/admin/simulator` visits still default to the first template.
- No new query params needed since `cameFromCreationFlow` already covers the requirement.