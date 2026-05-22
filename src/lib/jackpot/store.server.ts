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
  dto: Partial<JackpotDTO> & { triggerProbability?: number },
): Promise<JackpotDTO | undefined> {
  const existing = await getJackpot(brandId, id);
  if (!existing) return undefined;
  await assertJackpotEditable(brandId, id);


  const patch: Record<string, unknown> = {};
  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.enabled !== undefined) patch.enabled = dto.enabled;
  if (dto.contributionRate !== undefined)
    patch.contribution_percentage = Number(dto.contributionRate);
  if (dto.triggerThreshold !== undefined)
    patch.trigger_condition = { threshold: Number(dto.triggerThreshold) };
  if (dto.triggerProbability !== undefined)
    patch.trigger_probability = Number(dto.triggerProbability);

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
  await assertJackpotEditable(brandId, id);
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

// ===========================================================================
// Jackpot Groups — relational parent/child + state-machine guards
// ===========================================================================

export type GroupStatus = "draft" | "active" | "disabled";
export type ContributionSource = "player" | "operator";
export type GroupContributionType = "percentage" | "fixed";

export interface JackpotGroupDTO {
  id: number;
  brandId: string;
  name: string;
  status: GroupStatus;
  overlappingRule: string;
  contributionSource: ContributionSource;
  contributionType: GroupContributionType;
  masterContributionValue: number;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JackpotGroupWithChildrenDTO extends JackpotGroupDTO {
  children: Array<
    JackpotDTO & {
      tierRank: number;
      triggerProbability: number;
      splitShare: number;
    }
  >;
}

export class GroupConflictError extends Error {
  readonly status = 409 as const;
  constructor(
    message = "Group is active; modifications are strictly locked.",
  ) {
    super(message);
    this.name = "GroupConflictError";
  }
}

type GroupRow = {
  id: number;
  brand_id: number | string;
  name: string;
  status: GroupStatus;
  overlapping_rule: string;
  contribution_source: ContributionSource;
  contribution_type: GroupContributionType;
  master_contribution_value: number;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
};

function groupRowToDTO(row: GroupRow): JackpotGroupDTO {
  return {
    id: Number(row.id),
    brandId: String(row.brand_id),
    name: row.name,
    status: row.status,
    overlappingRule: row.overlapping_rule,
    contributionSource: (row.contribution_source ?? "player") as ContributionSource,
    contributionType: (row.contribution_type ?? "percentage") as GroupContributionType,
    masterContributionValue: Number(row.master_contribution_value ?? 0),
    activatedAt: row.activated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const GROUP_SELECT =
  "id, brand_id, name, status, overlapping_rule, contribution_source, contribution_type, master_contribution_value, activated_at, created_at, updated_at";

function toBrandNum(brandId: string | number): number {
  return typeof brandId === "number" ? brandId : brandIdNum(brandId);
}

/** Derive absolute per-spin contribution from master value × share %. */
export function deriveContributionRate(
  masterValue: number,
  splitShare: number,
): number {
  const v = Number(masterValue) || 0;
  const s = Number(splitShare) || 0;
  return Number(((v * s) / 100).toFixed(8));
}

export interface CreateGroupInput {
  name: string;
  overlappingRule?: string;
  contributionSource?: ContributionSource;
  contributionType?: GroupContributionType;
  masterContributionValue?: number;
}

export async function createGroup(
  brandId: string | number,
  input: CreateGroupInput,
): Promise<JackpotGroupDTO> {
  const { data, error } = await supabaseAdmin
    .from("jackpot_groups" as any)
    .insert({
      brand_id: toBrandNum(brandId),
      name: input.name,
      status: "draft",
      overlapping_rule: input.overlappingRule ?? "split",
      contribution_source: input.contributionSource ?? "player",
      contribution_type: input.contributionType ?? "percentage",
      master_contribution_value: Number(input.masterContributionValue ?? 0),
    })
    .select(GROUP_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return groupRowToDTO(data as unknown as GroupRow);
}


export async function listGroups(
  brandId: string | number,
): Promise<JackpotGroupDTO[]> {
  const { data, error } = await supabaseAdmin
    .from("jackpot_groups" as any)
    .select(GROUP_SELECT)
    .eq("brand_id", toBrandNum(brandId))
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data as unknown) as GroupRow[]).map(groupRowToDTO);
}

/**
 * Retrieve one group along with its attached child jackpots, ordered by
 * tier_rank ASC. Returns undefined when the group does not exist.
 */
export async function getGroup(
  groupId: string | number,
): Promise<JackpotGroupWithChildrenDTO | undefined> {
  const id = Number(groupId);
  const { data: groupData, error: gErr } = await supabaseAdmin
    .from("jackpot_groups" as any)
    .select(GROUP_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (gErr) throw new Error(gErr.message);
  if (!groupData) return undefined;
  const group = groupRowToDTO(groupData as unknown as GroupRow);

  const { data: childRows, error: cErr } = await supabaseAdmin
    .from("jackpots")
    .select(`${SELECT}, group_id, tier_rank, trigger_probability, split_share`)
    .eq("group_id", id)
    .order("tier_rank", { ascending: true });
  if (cErr) throw new Error(cErr.message);

  const children = ((childRows as unknown) as Array<
    JackpotRow & {
      group_id: number | null;
      tier_rank: number | null;
      trigger_probability: number | null;
      split_share: number | null;
    }
  >).map((row) => ({
    ...rowToDTO(row),
    tierRank: Number(row.tier_rank ?? 0),
    triggerProbability: Number(row.trigger_probability ?? 0),
    splitShare: Number(row.split_share ?? 0),
  }));

  return { ...group, children };
}

export async function setGroupStatus(
  groupId: string | number,
  status: GroupStatus,
): Promise<JackpotGroupDTO | undefined> {
  const id = Number(groupId);
  const { data: current, error: readErr } = await supabaseAdmin
    .from("jackpot_groups" as any)
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!current) return undefined;
  if ((current as any).status === status) {
    const { data } = await supabaseAdmin
      .from("jackpot_groups" as any)
      .select(GROUP_SELECT)
      .eq("id", id)
      .single();
    return groupRowToDTO(data as unknown as GroupRow);
  }

  const { data, error } = await supabaseAdmin
    .from("jackpot_groups" as any)
    .update({ status })
    .eq("id", id)
    .select(GROUP_SELECT)
    .single();
  if (error) {
    if (/Illegal jackpot_groups status transition|is active/.test(error.message)) {
      throw new GroupConflictError(error.message);
    }
    throw new Error(error.message);
  }
  return groupRowToDTO(data as unknown as GroupRow);
}

/**
 * Attach an existing standalone jackpot to a parent group. Derives the
 * child's `contribution_percentage` from the parent's master funding value
 * × the supplied `splitShare` (%). Rejects with a GroupConflictError when
 * the parent group is `active`; the DB trigger provides a backstop guarantee.
 */
export async function addChildJackpot(
  groupId: string | number,
  jackpotId: string | number,
  tierRank: number,
  opts: {
    triggerProbability?: number;
    splitShare?: number;
    name?: string;
  } = {},
): Promise<JackpotDTO & { splitShare: number; tierRank: number; triggerProbability: number }> {
  const gid = Number(groupId);
  const jid = Number(jackpotId);

  const { data: parent, error: pErr } = await supabaseAdmin
    .from("jackpot_groups" as any)
    .select("status, brand_id, master_contribution_value")
    .eq("id", gid)
    .maybeSingle();
  if (pErr) throw new Error(pErr.message);
  if (!parent) throw new GroupConflictError(`Group ${gid} not found`);
  if ((parent as any).status === "active") {
    throw new GroupConflictError();
  }

  const masterValue = Number((parent as any).master_contribution_value ?? 0);
  const splitShare =
    opts.splitShare !== undefined ? Number(opts.splitShare) : 0;

  const updates: Record<string, unknown> = {
    group_id: gid,
    tier_rank: tierRank,
    split_share: splitShare,
    contribution_percentage: deriveContributionRate(masterValue, splitShare),
  };
  if (opts.triggerProbability !== undefined) {
    updates.trigger_probability = opts.triggerProbability;
  }
  if (opts.name !== undefined && opts.name.trim() !== "") {
    updates.name = opts.name.trim();
  }

  const { error } = await supabaseAdmin
    .from("jackpots")
    .update(updates as any)
    .eq("id", jid);
  if (error) {
    if (/is active|status/.test(error.message)) {
      throw new GroupConflictError(error.message);
    }
    throw new Error(error.message);
  }

  const brandId = String((parent as any).brand_id);
  const dto = await getJackpot(brandId, jid);
  if (!dto) throw new Error(`Jackpot ${jid} not found after attach`);
  return {
    ...dto,
    tierRank,
    triggerProbability: Number(opts.triggerProbability ?? 0),
    splitShare,
  };
}

/**
 * Update a single child's split share and re-derive its absolute contribution
 * rate from the parent group's master value. Rejects when the parent is active.
 */
export async function updateChildSplitShare(
  groupId: string | number,
  jackpotId: string | number,
  splitShare: number,
): Promise<void> {
  const gid = Number(groupId);
  const jid = Number(jackpotId);
  const { data: parent, error: pErr } = await supabaseAdmin
    .from("jackpot_groups" as any)
    .select("status, master_contribution_value")
    .eq("id", gid)
    .maybeSingle();
  if (pErr) throw new Error(pErr.message);
  if (!parent) throw new GroupConflictError(`Group ${gid} not found`);
  if ((parent as any).status === "active") throw new GroupConflictError();
  const masterValue = Number((parent as any).master_contribution_value ?? 0);
  const { error } = await supabaseAdmin
    .from("jackpots")
    .update({
      split_share: splitShare,
      contribution_percentage: deriveContributionRate(masterValue, splitShare),
    } as any)
    .eq("id", jid);
  if (error) throw new Error(error.message);
}


/**
 * Compliance guard: throws GroupConflictError when a jackpot belongs to a
 * group whose status is `active`. Called at the top of every mutating
 * server-side helper (updateJackpot, deleteJackpot, …). The DB trigger is
 * the ultimate source of truth — this layer just produces a friendly 409.
 */
export async function assertJackpotEditable(
  brandId: string | number,
  jackpotId: string | number,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("jackpots")
    .select("group_id")
    .eq("id", Number(jackpotId))
    .eq("brand_id", toBrandNum(brandId))
    .maybeSingle();
  if (error) throw new Error(error.message);
  const groupId = (data as any)?.group_id as number | null | undefined;
  if (!groupId) return;

  const { data: parent, error: pErr } = await supabaseAdmin
    .from("jackpot_groups" as any)
    .select("status")
    .eq("id", groupId)
    .maybeSingle();
  if (pErr) throw new Error(pErr.message);
  if (parent && (parent as any).status === "active") {
    throw new GroupConflictError();
  }
}

// ===========================================================================
// Phase 2 — group bet fan-out helpers
// ===========================================================================

export interface GroupBetChildDTO extends JackpotDTO {
  tierRank: number;
  triggerProbability: number;
}

/**
 * Load an active jackpot group plus its enabled children for the bet route.
 * Throws GroupConflictError when the group is missing, brand-mismatched, or
 * not currently `active`.
 */
export async function getGroupForBet(
  groupId: string | number,
  brandId: string | number,
): Promise<{ group: JackpotGroupDTO; children: GroupBetChildDTO[] }> {
  const gid = Number(groupId);
  const brand = toBrandNum(brandId);

  const { data: groupData, error: gErr } = await supabaseAdmin
    .from("jackpot_groups" as any)
    .select(GROUP_SELECT)
    .eq("id", gid)
    .maybeSingle();
  if (gErr) throw new Error(gErr.message);
  if (!groupData) {
    const e = new GroupConflictError(`Group ${gid} not found`);
    (e as any).status = 404;
    throw e;
  }
  const group = groupRowToDTO(groupData as unknown as GroupRow);
  if (Number(group.brandId) !== brand) {
    const e = new GroupConflictError(`Group ${gid} does not belong to brand`);
    (e as any).status = 403;
    throw e;
  }
  if (group.status !== "active") {
    throw new GroupConflictError(
      `Group ${gid} is not active (status=${group.status})`,
    );
  }

  const { data: childRows, error: cErr } = await supabaseAdmin
    .from("jackpots")
    .select(`${SELECT}, group_id, tier_rank, trigger_probability`)
    .eq("group_id", gid)
    .eq("enabled", true)
    .order("tier_rank", { ascending: true });
  if (cErr) throw new Error(cErr.message);

  const children = ((childRows as unknown) as Array<
    JackpotRow & {
      group_id: number | null;
      tier_rank: number | null;
      trigger_probability: number | null;
    }
  >).map((row) => ({
    ...rowToDTO(row),
    tierRank: Number(row.tier_rank ?? 0),
    triggerProbability: Number(row.trigger_probability ?? 0),
  }));

  return { group, children };
}

/**
 * Status-gated profile edit. Reads current status first and throws a friendly
 * GroupConflictError when the group is `active`; the DB trigger backstops.
 * When master funding fields change, recomputes every child's derived
 * `contribution_percentage` in the same call.
 */
export async function updateGroupProfile(
  groupId: string | number,
  patch: {
    name?: string;
    overlappingRule?: string;
    contributionSource?: ContributionSource;
    contributionType?: GroupContributionType;
    masterContributionValue?: number;
  },
): Promise<JackpotGroupDTO | undefined> {
  const id = Number(groupId);
  const { data: current, error: rErr } = await supabaseAdmin
    .from("jackpot_groups" as any)
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (rErr) throw new Error(rErr.message);
  if (!current) return undefined;
  if ((current as any).status === "active") {
    throw new GroupConflictError();
  }

  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.overlappingRule !== undefined)
    update.overlapping_rule = patch.overlappingRule;
  if (patch.contributionSource !== undefined)
    update.contribution_source = patch.contributionSource;
  if (patch.contributionType !== undefined)
    update.contribution_type = patch.contributionType;
  if (patch.masterContributionValue !== undefined)
    update.master_contribution_value = Number(patch.masterContributionValue);

  if (Object.keys(update).length === 0) {
    const { data } = await supabaseAdmin
      .from("jackpot_groups" as any)
      .select(GROUP_SELECT)
      .eq("id", id)
      .single();
    return groupRowToDTO(data as unknown as GroupRow);
  }

  const { data, error } = await supabaseAdmin
    .from("jackpot_groups" as any)
    .update(update)
    .eq("id", id)
    .select(GROUP_SELECT)
    .single();
  if (error) {
    if (/is active|status/.test(error.message)) {
      throw new GroupConflictError(error.message);
    }
    throw new Error(error.message);
  }
  const dto = groupRowToDTO(data as unknown as GroupRow);

  // If master value changed, recompute every child's derived rate.
  if (patch.masterContributionValue !== undefined) {
    const { data: childRows } = await supabaseAdmin
      .from("jackpots")
      .select("id, split_share")
      .eq("group_id", id);
    const newMaster = dto.masterContributionValue;
    for (const row of (childRows as Array<{ id: number; split_share: number | null }> | null) ?? []) {
      const share = Number(row.split_share ?? 0);
      const { error: uErr } = await supabaseAdmin
        .from("jackpots")
        .update({
          contribution_percentage: deriveContributionRate(newMaster, share),
        } as any)
        .eq("id", row.id);
      if (uErr) throw new Error(uErr.message);
    }
  }

  return dto;
}


/**
 * Persist a group bet via the atomic `apply_group_bet` Postgres function.
 * On duplicate-transaction (unique-violation), re-reads the existing row and
 * returns it with `isReplay = true` so the caller can emit an idempotent
 * replay response.
 */
export async function recordGroupTransaction(payload: {
  transactionId: string;
  brandId: number;
  groupId: number;
  totals: { pool: number; seed: number; house: number };
  response: Record<string, unknown>;
  poolDeltas: Array<{ jackpotId: number; delta: number }>;
}): Promise<{ row: any; isReplay: boolean }> {
  const { data, error } = await supabaseAdmin.rpc("apply_group_bet" as any, {
    p_payload: payload as any,
  });
  if (error) {
    // 23505 = unique_violation → replay
    if ((error as any).code === "23505" || /duplicate key/.test(error.message)) {
      const { data: existing, error: rErr } = await supabaseAdmin
        .from("jackpot_transactions")
        .select("*")
        .eq("brand_id", payload.brandId)
        .eq("transaction_id", payload.transactionId)
        .maybeSingle();
      if (rErr) throw new Error(rErr.message);
      return { row: existing, isReplay: true };
    }
    throw new Error(error.message);
  }
  return { row: data, isReplay: false };
}
