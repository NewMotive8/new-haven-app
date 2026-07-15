
# Verdict on the seed-reserve statement

**Short answer: the mechanic he describes is compliant in principle, but the way he phrased it hides three things an auditor (GLI-12 / MGA / UKGC) will absolutely ask about. If any of those three aren't true in his implementation, it fails.**

His model, restated:
- Fixed seed share per bet: 0.032 SC of every 0.12 SC contribution.
- All seed shares accumulate in one uncapped "seed reserve" bucket.
- On a tier win, the tier's full seed amount is deducted from the bucket; pool resets.
- Surplus stays in the bucket forever — never returns to pools, never returned to players.

## Where this is fine

- **Uncapped seed reserve is not itself a violation.** GLI-12 and MGA don't require a cap on the reserve; they require that every SC collected from players is *accounted for* and *eventually returned to players in aggregate* via jackpot payouts (contributes to game RTP). A running balance = collected − paid is a standard, auditable pattern.
- **Fixed split (0.032 / 0.12 ≈ 26.67%) is fine** as long as it's disclosed in the paytable/rules and the total theoretical RTP (base game + jackpot contribution routed back as wins) meets the jurisdiction's minimum.
- **Deterministic deduction on win** (full tier seed comes out of the reserve at reset) is exactly how our engine treats reseed — see `src/lib/jackpot/simulator.ts` waterfall + `live-engine.ts` reset path. Same shape.

## The three things that decide pass/fail

An auditor will not accept the statement as written. He needs to prove:

### 1. The surplus is mathematically bounded / actuarially returned
"Never goes back to pools or players" is a **red flag phrase**. If seed-share rate × expected bet volume > expected seed-payout frequency × tier seed, the bucket grows without bound → that surplus is effectively operator retention on money collected as "jackpot contribution." That's the classic finding auditors write up as *misleading contribution disclosure* (GLI-12 §2.2, MGA RTS 8/9).

Ask him:
- What's the steady-state expected value of the reserve at his configured hit rate and bet mix? Show the math.
- Under what condition does the reserve drain? Is there a documented overflow rule (reseed next tier early, roll into pool, community drop, operator liability write-down)?
- If the answer is "it just grows," that's a compliance problem regardless of what the paytable says — because contribution was advertised as funding jackpots.

### 2. The reserve is a segregated player-liability balance, not operator revenue
Same money, different accounting treatment = different legal status.

Ask him:
- Is the reserve booked as a **player liability** on the operator's balance sheet (like unpaid jackpot obligations)?
- If the jackpot is decommissioned / migrated / the license is surrendered, what happens to the reserve? (GLI-12 and every serious regulator require it goes to players — forced drop, transfer to successor jackpot, or refund. "Kept by house" fails.)
- Is it ring-fenced in the ledger, distinct from the House slice?

### 3. Every SC in and out of the bucket is immutable and reconcilable
Ask him:
- Append-only ledger of every seed-share credit (per bet) and every seed-reset debit (per win)?
- Independent reconciliation: `Σ seed_credits − Σ seed_debits == current_reserve_balance` at any point in time, matches the DB?
- Retention period ≥ jurisdiction requirement (typically 5 years EU / MGA)?

## How this project handles it (reference)

Our engine treats the seed pot differently in a way worth pointing out to him:

- `src/lib/jackpot/ledger.ts → resolveContributionSlice()` splits every wager into **pool / seed / house** as three explicit, auditable slices. Seed and house are separate — a colleague describing seed surplus as "stays in the bucket, never returns to players" is at risk of blurring seed and house.
- `src/lib/jackpot/simulator.ts` (waterfall / overflow) treats seed overflow as a **routed** value — surplus above what's needed to reseed the next tier has a defined destination (reseed higher tier / roll into pool / community — configurable, but always **routed back to a player-facing bucket**, never silently retained).
- `src/lib/jackpot/live-engine.ts` enforces the reset deterministically and the minimum-win gate — the "full tier seed out of the bucket on win" behavior he describes matches ours, so that part is fine.

The material difference: **we require every SC in the seed slice to have a documented player-facing fate.** His statement leaves that undefined.

## What to tell him

> "The uncapped reserve and fixed seed share are OK. The statement 'surplus stays there forever, never returned to pools or players' is a compliance red flag as written. Please document (a) the steady-state EV of the reserve and its bounding condition, (b) that the reserve is booked as a player liability and its disposition on decommission, and (c) the append-only ledger + reconciliation for every credit/debit. Without those three, an auditor will treat the surplus as undisclosed operator retention against funds collected as jackpot contribution."

---

*No code changes in this project. Deliverable is this chat verdict only — approve to finalize.*
