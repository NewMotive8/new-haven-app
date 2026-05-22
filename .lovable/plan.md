# Fix: crash when saving a child tier in the MultiJackpot wizard

## What we know

- Console reports `Element type is invalid: expected … got: undefined` immediately after a click on the wizard.
- Stack is fully minified (`Check the render method of N`) — no clear culprit component.
- Reproducing the path in the browser (open MultiJackpot tab → name group → Continue → step 2 renders) does **not** crash on its own. Step 2 mounts the new Tier Name input, the "1 in X spins" probability, the Slider, and the drop-frequency panel cleanly.
- The crash is therefore triggered specifically by the **Save tier** click (or its immediate re-render), not by mounting Step 2.

## Most likely root causes

1. **Stale module after the structural edits.** The wizard's `ChildDraft` shape changed (`triggerProbability` → `triggerDenominator`, added `tierName`). If the browser was running a pre-edit bundle and clicked Save, an old `ChildTierRow` would try to render a now-removed field and bomb out. A hard refresh would fix it but the underlying brittleness should be removed.
2. **Save tier's success path renders something that depends on the API response shape.** After a successful POST the wizard:
   - Pushes `{ jackpotId: attached.id, tierRank, jackpotName: attached.name }` into `savedChildren`.
   - Re-renders the green "Attached" panel using `<Check />` from lucide-react.
   - Resets `children` to a new draft via `newChildDraft(tierRank + 1)`.

   If `attached` is missing fields (e.g. the API returned an error envelope as a 2xx, or `getJackpot` returned `undefined` and the server still sent 200 in some path), nothing renders an undefined component — but the sorted `.map` over `savedChildren` plus the lucide `Check` icon is the only new JSX in the success branch. If the project's lucide-react export surface drifted, `Check` could be undefined under a stale dep cache.
3. **HMR drift on `src/components/ui/slider.tsx`.** The Slider is the only newly-introduced UI primitive imported by both the wizard and the detail page. If Vite's pre-bundled `@radix-ui/react-slider` got into a partial state, `SliderPrimitive.Root` can become undefined and trigger exactly this error inside `ChildTierRow`.

## Plan

1. **Reproduce deterministically.** Open `/admin/jackpots/new` in the live preview, click MultiJackpot, create a draft group, then on Step 2 select an existing jackpot and click "Save tier". Capture the network response from `POST /api/v1/jackpot-groups/{id}/children` and any console errors so the failing render frame is unambiguous.
2. **Harden the wizard success path:**
   - Treat the API response defensively: only push to `savedChildren` when `attached?.id` is a number; otherwise toast an error.
   - Use `attached.name ?? "Attached jackpot"` everywhere the success panel reads `jackpotName`.
3. **Wrap Step 2 in a local error boundary** that renders an inline message + "Reset step" button instead of unmounting the whole route to the global error page. This isolates the crash to the wizard surface and prevents the full-page "This page didn't load" experience.
4. **Eliminate the stale-bundle class of failures:**
   - Restart the Vite dev server to flush any partial pre-bundle of `@radix-ui/react-slider`.
   - Verify in the browser after restart that Save tier completes end-to-end (attached row appears, draft resets, no console error).
5. **Verify the detail page mirror.** Open `/admin/jackpot-groups/{id}` for the newly-created group and confirm `ChildTierEditor` renders, the Slider works, and "Save tier" PUTs successfully without re-triggering the error.

## Technical detail

- Files touched: `src/components/jackpot/MultiJackpotWizard.tsx` (defensive success-path + local error boundary), no API/schema changes.
- Error boundary lives in the same file as a small class component; only wraps Step 2's content so Step 1 / Step 3 stay unaffected.
- Dev-server restart is a one-shot operation, not a code change.
- If step 1 of the plan reveals a different root cause (e.g. the POST returns 500), we tighten the actual failure (RLS / payload validation) instead of just hardening the UI.
