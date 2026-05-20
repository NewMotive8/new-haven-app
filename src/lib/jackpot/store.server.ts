import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { JackpotDTO, JackpotConfigDTO, TopupDTO } from "./types";

// PostgreSQL-backed store. Replaces the previous in-memory mock.
// All functions are async; callers must `await`.

type JackpotRow = {
  id: number;
  name: string;
  brand_id: number | string;
  enabled: boolean;
  contribution_percentage: number;
  volatility: number;
  trigger_condition: any;
  created_at: string;
  updated_at: string;
  jackpot_pools: { id: number; current_balance: number }[] | null;
  jackpot_seeds: { id: number; base_seed_amount: number }[] | null;
};

function rowToDTO(row: JackpotRow): JackpotDTO {
  const pool = row.jackpot_pools?.[0];
  const seed = row.jackpot_seeds?.[0];
  const threshold =
    row.trigger_condition && typeof row.trigger_condition === "object"
      ? Number(row.trigger_condition.threshold ?? 0)
      : 0;
  const cfg =
    row.trigger_condition && typeof row.trigger_condition === "object"
      ? (row.trigger_condition as Record<string, unknown>)
      : undefined;
  return {
    id: Number(row.id),
    name: row.name,
    enabled: row.enabled,
    poolBalance: Number(pool?.current_balance ?? 0),
    seedAmount: Number(seed?.base_seed_amount ?? 0),
    contributionRate: Number(row.contribution_percentage),
    triggerThreshold: threshold,
    brandId: String(row.brand_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    config: cfg,
  };
}

const SELECT = `
  id, name, brand_id, enabled, contribution_percentage, volatility,
  trigger_condition, created_at, updated_at,
  jackpot_pools ( id, current_balance ),
  jackpot_seeds ( id, base_seed_amount )
`;

function brandIdNum(brandId: string): number {
  const n = Number(brandId);
  if (!Number.isFinite(n)) throw new Error(`Invalid brandId: ${brandId}`);
  return n;
}

function applyFilter(query: any, filterExp?: string | null) {
  if (!filterExp) return query;
  const eq = filterExp.indexOf("=");
  if (eq === -1) return query.ilike("name", `%${filterExp}%`);
  const field = filterExp.slice(0, eq).trim();
  const value = filterExp.slice(eq + 1).trim();
  switch (field) {
    case "name":
      return query.ilike("name", `%${value}%`);
    case "enabled":
      return query.eq("enabled", value === "true");
    case "id":
      return query.eq("id", Number(value));
    default:
      return query;
  }
}

export async function listJackpots(
  brandId: string,
  filterExp?: string | null,
): Promise<JackpotDTO[]> {
  let q = supabaseAdmin
    .from("jackpots")
    .select(SELECT)
    .eq("brand_id", brandIdNum(brandId));
  q = applyFilter(q, filterExp);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data as unknown) as JackpotRow[]).map(rowToDTO);
}

export interface PagedQuery {
  brandId: string;
  filterExp?: string | null;
  page?: number;
  size?: number;
  sortField?: string;
  sortDir?: "asc" | "desc";
}

export async function listJackpotsPaged(opts: PagedQuery): Promise<{
  content: JackpotDTO[];
  totalElements: number;
}> {
  const page = Math.max(0, opts.page ?? 0);
  const size = Math.max(1, opts.size ?? 20);
  const sortField = opts.sortField ?? "id";
  const ascending = (opts.sortDir ?? "asc") === "asc";

  // Map external sort field names to actual DB columns.
  const fieldMap: Record<string, string> = {
    id: "id",
    name: "name",
    enabled: "enabled",
    brandId: "brand_id",
    createdAt: "created_at",
    updatedAt: "updated_at",
    contributionRate: "contribution_percentage",
  };
  const dbField = fieldMap[sortField] ?? "id";

  let q = supabaseAdmin
    .from("jackpots")
    .select(SELECT, { count: "exact" })
    .eq("brand_id", brandIdNum(opts.brandId));
  q = applyFilter(q, opts.filterExp);
  q = q.order(dbField, { ascending }).range(page * size, page * size + size - 1);

  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return {
    content: ((data as unknown) as JackpotRow[]).map(rowToDTO),
    totalElements: count ?? 0,
  };
}

export async function getJackpot(
  brandId: string,
  id: number,
): Promise<JackpotDTO | undefined> {
  const { data, error } = await supabaseAdmin
    .from("jackpots")
    .select(SELECT)
    .eq("brand_id", brandIdNum(brandId))
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  return rowToDTO(data as unknown as JackpotRow);
}

export async function createJackpot(
  brandId: string,
  dto: Partial<JackpotDTO>,
): Promise<JackpotDTO> {
  // Pack v2 fields (contributionMode, weights, triggerOdds, tiers) into JSONB
  // alongside the existing config blob. Older records that lack these keys
  // continue to read back as legacy defaults via getJackpotConfig().
  const triggerCondition: Record<string, any> = {
    threshold: Number(dto.triggerThreshold ?? 1000),
    ...(dto.jackpotType ? { type: dto.jackpotType } : {}),
    ...(dto.config && typeof dto.config === "object" ? dto.config : {}),
  };
  const insertRow = {
    name: dto.name ?? "New Jackpot",
    brand_id: brandIdNum(brandId),
    enabled: dto.enabled ?? true,
    contribution_percentage: Number(dto.contributionRate ?? 0.01),
    volatility: Number(dto.volatility ?? 5),
    trigger_condition: triggerCondition,
  };
  const { data: jp, error } = await supabaseAdmin
    .from("jackpots")
    .insert(insertRow)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const id = Number(jp.id);

  const poolBalance = Number(dto.poolBalance ?? dto.seedAmount ?? 0);
  const seedAmount = Number(dto.seedAmount ?? 0);
  const { error: poolErr } = await supabaseAdmin
    .from("jackpot_pools")
    .insert({ jackpot_id: id, current_balance: poolBalance });
  if (poolErr) throw new Error(poolErr.message);
  const { error: seedErr } = await supabaseAdmin
    .from("jackpot_seeds")
    .insert({ jackpot_id: id, base_seed_amount: seedAmount });
  if (seedErr) throw new Error(seedErr.message);

  const result = await getJackpot(brandId, id);
  if (!result) throw new Error("Failed to load created jackpot");
  return result;
}

export async function updateJackpot(
  brandId: string,
  id: number,
  dto: Partial<JackpotDTO>,
): Promise<JackpotDTO | undefined> {
  const existing = await getJackpot(brandId, id);
  if (!existing) return undefined;

  const patch: Record<string, unknown> = {};
  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.enabled !== undefined) patch.enabled = dto.enabled;
  if (dto.contributionRate !== undefined)
    patch.contribution_percentage = Number(dto.contributionRate);
  if (dto.triggerThreshold !== undefined)
    patch.trigger_condition = { threshold: Number(dto.triggerThreshold) };

  if (Object.keys(patch).length > 0) {
    const { error } = await supabaseAdmin
      .from("jackpots")
      .update(patch as any)
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  if (dto.poolBalance !== undefined) {
    const { error } = await supabaseAdmin
      .from("jackpot_pools")
      .update({ current_balance: Number(dto.poolBalance) })
      .eq("jackpot_id", id);
    if (error) throw new Error(error.message);
  }
  if (dto.seedAmount !== undefined) {
    const { error } = await supabaseAdmin
      .from("jackpot_seeds")
      .update({ base_seed_amount: Number(dto.seedAmount) })
      .eq("jackpot_id", id);
    if (error) throw new Error(error.message);
  }

  return getJackpot(brandId, id);
}

export async function deleteJackpot(brandId: string, id: number): Promise<boolean> {
  const existing = await getJackpot(brandId, id);
  if (!existing) return false;
  const { error } = await supabaseAdmin.from("jackpots").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function setEnabled(
  brandId: string,
  id: number,
  enabled: boolean,
): Promise<JackpotDTO | undefined> {
  return updateJackpot(brandId, id, { enabled });
}

export async function applyTopup(
  brandId: string,
  dto: TopupDTO,
): Promise<JackpotDTO | undefined> {
  const existing = await getJackpot(brandId, dto.jackpotId);
  if (!existing) return undefined;
  const amount = Number(dto.amount) || 0;
  const patch: Partial<JackpotDTO> = {
    poolBalance: existing.poolBalance + amount,
  };
  if (dto.isSeed) patch.seedAmount = existing.seedAmount + amount;
  return updateJackpot(brandId, dto.jackpotId, patch);
}

/**
 * Build a JackpotConfigDTO suitable for the simulator engine
 * from the persisted jackpot/pool/seed data. Unpacks v2 fields
 * (contributionMode, weights, triggerOdds, tiers) from trigger_condition
 * with safe legacy defaults for older rows that pre-date Engine v2.
 */
export async function getJackpotConfig(
  brandId: string,
  id: number,
): Promise<JackpotConfigDTO | undefined> {
  const jp = await getJackpot(brandId, id);
  if (!jp) return undefined;

  // Re-read raw row so we can unpack the JSONB blob.
  const { data: raw } = await supabaseAdmin
    .from("jackpots")
    .select("trigger_condition")
    .eq("id", id)
    .maybeSingle();
  const cfg =
    raw && raw.trigger_condition && typeof raw.trigger_condition === "object"
      ? (raw.trigger_condition as Record<string, any>)
      : {};
  const v2 = (cfg.engineV2 ?? {}) as Record<string, any>;

  const contribution =
    v2.contributionMode === "split"
      ? {
          mode: "split" as const,
          totalContributionAmount: Number(v2.totalContributionAmount) || 0,
          totalContributionType:
            (v2.totalContributionType ?? "fixed") === "fixed"
              ? ("FIXED" as const)
              : ("PERCENTAGE" as const),
          poolWeight: Number(v2.poolWeight) || 0,
          seedWeight: Number(v2.seedWeight) || 0,
          houseWeight: Number(v2.houseWeight) || 0,
        }
      : undefined;
  const triggerOdds = Number(v2.triggerOdds) || 0;

  return {
    id: jp.id,
    name: jp.name,
    enabled: jp.enabled,
    brandId: jp.brandId,
    type: "AVERAGE",
    volatility: 5,
    pool: {
      currentAmount: jp.poolBalance,
      minimumAmount: jp.seedAmount,
      maximumAmount: jp.triggerThreshold,
      contributionAmount: jp.contributionRate * 100, // stored as fraction; engine expects percent
      contributionType: "PERCENTAGE",
    },
    seed: {
      currentAmount: jp.seedAmount,
      targetAmount: jp.seedAmount,
      contributionAmount: 0,
      contributionType: "PERCENTAGE",
    },
    ...(contribution ? { contribution } : {}),
    ...(triggerOdds > 0 ? { triggerOdds } : {}),
  };
}
