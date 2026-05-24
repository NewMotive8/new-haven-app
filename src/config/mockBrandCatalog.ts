// Static mock operator-integration catalog used exclusively by the /demo
// harness. This file simulates a live operator's game database + event-mapping
// contract for frontend testing purposes ONLY.
//
// Hard isolation rules (do not relax):
//   - NEVER imported from src/lib/jackpot/* or any production ingestion path.
//   - NEVER persisted to Supabase or any backing store.
//   - Only consumed by /demo (src/routes/demo.tsx, src/components/demo/*)
//     and the placeDemoBet server proxy (src/lib/demo/bet.functions.ts).

export interface MockGame {
  gameId: string;
  name: string;
  category: string;
  provider: string;
}

export interface MockBrandCatalog {
  name: string;
  games: MockGame[];
}

export const MOCK_BRAND_CATALOGS: Record<string, MockBrandCatalog> = {
  brand_1: {
    name: "Casino Planet VIP",
    games: [
      { gameId: "stellar-rush", name: "Stellar Rush", category: "Slots", provider: "NetEnt" },
      { gameId: "blackjack-vip-3", name: "Blackjack VIP 3", category: "Table Games", provider: "Evolution" },
      { gameId: "roulette-live-1", name: "Immersive Roulette", category: "Table Games", provider: "Evolution" },
      { gameId: "sweet-bonanza-9", name: "Sweet Bonanza Deluxe", category: "Slots", provider: "Pragmatic Play" },
      { gameId: "starburst-test", name: "Starburst Classic", category: "Slots", provider: "NetEnt" },
      { gameId: "mega-moolah-test", name: "Mega Fortune Spin", category: "Slots", provider: "Microgaming" },
      { gameId: "crazy-time-live", name: "Crazy Time", category: "Live Casino", provider: "Evolution" },
      { gameId: "book-of-dead-5", name: "Book of Dead", category: "Slots", provider: "Play'n GO" },
      { gameId: "baccarat-speed-a", name: "Speed Baccarat A", category: "Table Games", provider: "Evolution" },
      { gameId: "gates-of-olympus-1", name: "Gates of Olympus", category: "Slots", provider: "Pragmatic Play" },
      { gameId: "aviator-crash", name: "Aviator", category: "Crash Games", provider: "Spribe" },
      { gameId: "gonzos-quest-x", name: "Gonzo's Quest Megaways", category: "Slots", provider: "Red Tiger" },
    ],
  },
};

/** Resolve a catalog for the active demo brand. Falls back to brand_1 so the
 *  /demo grid is never empty when other brand IDs are selected. */
export function getMockCatalog(brandId: string): MockBrandCatalog {
  return (
    MOCK_BRAND_CATALOGS[`brand_${brandId}`] ??
    MOCK_BRAND_CATALOGS[brandId] ??
    MOCK_BRAND_CATALOGS.brand_1
  );
}
