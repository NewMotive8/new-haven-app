// Static mock operator-integration catalog used exclusively by the /demo
// harness. This file simulates a live operator's game database + event-mapping
// contract for frontend testing purposes ONLY.
//
// To add/remove games, edit src/config/mockBrandCatalog.json directly.
// Vite HMR picks up changes immediately — no rebuild required.
//
// Hard isolation rules (do not relax):
//   - NEVER imported from src/lib/jackpot/* or any production ingestion path.
//   - NEVER persisted to Supabase or any backing store.
//   - Only consumed by /demo (src/routes/demo.tsx, src/components/demo/*)
//     and the placeDemoBet server proxy (src/lib/demo/bet.functions.ts).

import catalogData from "./mockBrandCatalog.json";

export interface MockGame {
  gameId: string;
  name: string;
  category: string;
  provider: string;
}

const CATALOGS = catalogData as Record<string, MockGame[]>;

/** Resolve the games list for the active demo brand. Falls back to brand_1 so
 *  the /demo grid is never empty when other brand IDs are selected. */
export function getMockCatalog(brandId: string): MockGame[] {
  return (
    CATALOGS[`brand_${brandId}`] ??
    CATALOGS[brandId] ??
    CATALOGS.brand_1 ??
    []
  );
}
