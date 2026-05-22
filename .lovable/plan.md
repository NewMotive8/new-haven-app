## Remove the Game Assignment block from Step 1

The dedicated **Game Assignment** card (Master Categories + Specific Games picker) is redundant — the **Eligibility & Rules Engine** section below it already covers casino vertical / category / game-level targeting.

### Change

In `src/components/jackpot/MultiJackpotWizard.tsx`, delete the Game Assignment block in Step 1 (lines 757–763):

```tsx
<div className="pt-2 border-t border-neutral-800">
  <GameAssignmentStep
    value={assignment}
    onChange={setAssignment}
    disabled={submitting}
  />
</div>
```

### Keep (no risky cleanup)

- Leave the `assignment` state, the `GameAssignmentStep` import, and the `assignedCategories` / `assignedGameIds` fields on the group/child create payloads. They keep defaulting to empty arrays — the backend stays happy and we don't have to touch the API schema.
- The Tier Ladder summary chips that read `group.assignedCategories` / `assignedGameIds` will just show "All games" naturally when both are empty.

### Out of scope

- Deleting `GameAssignmentStep.tsx` or the related fields from `GroupDTO` / API — can be cleaned up later once we're sure Eligibility fully replaces it everywhere (single-jackpot form still uses it).

Confirm and I'll apply.