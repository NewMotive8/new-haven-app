// Tiny dependency-free seeded PRNG. Used by simulator dashboard when an
// optional rng seed is supplied for reproducible runs. Returns a function
// matching the RngSource contract (uniform value in [0, 1)).

import type { RngSource } from "./math";

export function mulberry32(seed: number): RngSource {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Single-shot RNG that always returns the same uniform value. Used when an
 *  external roll is injected into a single-bet evaluation. */
export function constantRng(unit: number): RngSource {
  const clamped = Math.min(0.999999999, Math.max(0, unit));
  return () => clamped;
}
