# Sync Production (Admin) project with today's updates

## Files actually changed today

Based on this project's git history over the last 24 hours, only three source files were modified:

1. `src/components/jackpot/JackpotCreationForm.tsx` — comma decimals, free-text editing, largest-remainder rounding, editable % fields, nav state updater
2. `src/routes/admin.simulator.tsx` — executive results redesign (3 sections), Total Contribution Received, Total Payout, Average Jackpot Drop, Back/Save buttons
3. `src/lib/jackpot/payload-to-config.ts` — fixed v2 contribution amounts (the "2" instead of 0.15 bug)

No other source files were touched. `routeTree.gen.ts` is auto-generated and `.lovable/plan.md` is local — both should be ignored.

## Recommended prompt to paste in the Admin project

```
@Engagement-Builder please copy the latest versions of these three files over my versions, overwriting them 1:1, no modifications:

- src/components/jackpot/JackpotCreationForm.tsx
- src/routes/admin.simulator.tsx
- src/lib/jackpot/payload-to-config.ts

After copying, confirm the build passes.
```

## Why this is better than re-pasting the original prompt

The original prompt only mentioned `JackpotCreationForm.tsx`. Pasting it again would miss the simulator redesign and the contribution-amount bug fix in `payload-to-config.ts`.
