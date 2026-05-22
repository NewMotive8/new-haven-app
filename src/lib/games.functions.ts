import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MASTER_CATEGORIES, type MasterCategory } from "@/lib/jackpot/master-categories";

export interface GameDTO {
  id: number;
  name: string;
  masterCategory: MasterCategory;
  provider: string;
  operatorGameId: string;
}

const SELECT = "id, name, master_category, provider, operator_game_id";

type GameRow = {
  id: number;
  name: string;
  master_category: MasterCategory;
  provider: string;
  operator_game_id: string;
};

function rowToDTO(r: GameRow): GameDTO {
  return {
    id: Number(r.id),
    name: r.name,
    masterCategory: r.master_category,
    provider: r.provider,
    operatorGameId: r.operator_game_id,
  };
}

const SearchSchema = z.object({
  q: z.string().trim().max(80).default(""),
  categories: z.array(z.enum(MASTER_CATEGORIES)).max(5).optional(),
  limit: z.number().int().min(1).max(25).optional(),
});

export const searchGames = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SearchSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const limit = data.limit ?? 15;
    let q = supabase
      .from("games" as any)
      .select(SELECT)
      .eq("enabled", true);
    if (data.q.length >= 1) {
      q = q.ilike("name", `%${data.q}%`);
    }
    if (data.categories && data.categories.length > 0) {
      q = q.in("master_category", data.categories);
    }
    q = q.order("name", { ascending: true }).limit(limit);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return ((rows ?? []) as unknown as GameRow[]).map(rowToDTO);
  });

const ListByIdsSchema = z.object({
  ids: z.array(z.number().int().positive()).max(500),
});

export const listGamesByIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListByIdsSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.ids.length === 0) return [] as GameDTO[];
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("games" as any)
      .select(SELECT)
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return ((rows ?? []) as unknown as GameRow[]).map(rowToDTO);
  });
