
-- =============================================================================
-- Phase 1: Relational Jackpot Groups — schema, triggers, backfill
-- =============================================================================

-- 1) Parent table: jackpot_groups -------------------------------------------
CREATE TABLE public.jackpot_groups (
  id               bigserial PRIMARY KEY,
  brand_id         bigint NOT NULL,
  name             text   NOT NULL,
  status           text   NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','active','disabled')),
  overlapping_rule text   NOT NULL DEFAULT 'split',
  activated_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT jackpot_groups_brand_name_uniq UNIQUE (brand_id, name)
);

CREATE INDEX jackpot_groups_brand_status_idx
  ON public.jackpot_groups (brand_id, status);

-- updated_at trigger
CREATE TRIGGER jackpot_groups_set_updated_at
  BEFORE UPDATE ON public.jackpot_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.jackpot_groups ENABLE ROW LEVEL SECURITY;

-- Admin-only management for now; no public RLS exposure.
CREATE POLICY "Admins can manage jackpot_groups"
  ON public.jackpot_groups
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) Child link columns on jackpots -----------------------------------------
ALTER TABLE public.jackpots
  ADD COLUMN group_id             bigint REFERENCES public.jackpot_groups(id) ON DELETE RESTRICT,
  ADD COLUMN tier_rank            int,
  ADD COLUMN trigger_probability  numeric(12,8) NOT NULL DEFAULT 0,
  ADD CONSTRAINT trigger_probability_range
    CHECK (trigger_probability >= 0 AND trigger_probability <= 1),
  ADD CONSTRAINT tier_rank_requires_group
    CHECK ((group_id IS NULL AND tier_rank IS NULL)
        OR (group_id IS NOT NULL AND tier_rank IS NOT NULL));

CREATE UNIQUE INDEX jackpots_group_tier_uniq
  ON public.jackpots (group_id, tier_rank)
  WHERE group_id IS NOT NULL;

CREATE INDEX jackpots_group_enabled_idx
  ON public.jackpots (group_id)
  WHERE enabled = true;

-- 3) Idempotency / audit anchor: jackpot_transactions -----------------------
CREATE TABLE public.jackpot_transactions (
  transaction_id text PRIMARY KEY,
  group_id       bigint REFERENCES public.jackpot_groups(id) ON DELETE RESTRICT,
  brand_id       bigint NOT NULL,
  totals         jsonb  NOT NULL DEFAULT '{}'::jsonb,
  response       jsonb,
  processed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX jackpot_transactions_group_idx
  ON public.jackpot_transactions (group_id, processed_at DESC);

ALTER TABLE public.jackpot_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read jackpot_transactions"
  ON public.jackpot_transactions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) State-machine + immutability triggers ----------------------------------

-- 4a) jackpot_groups: enforce status transitions and lock columns when active.
CREATE OR REPLACE FUNCTION public.jackpot_groups_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate transitions.
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT (
         (OLD.status = 'draft'    AND NEW.status IN ('active','disabled'))
      OR (OLD.status = 'active'   AND NEW.status = 'disabled')
      OR (OLD.status = 'disabled' AND NEW.status IN ('draft','active'))
    ) THEN
      RAISE EXCEPTION 'Illegal jackpot_groups status transition: % -> %',
        OLD.status, NEW.status
        USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.status = 'active' AND NEW.activated_at IS NULL THEN
      NEW.activated_at := now();
    END IF;
  END IF;

  -- Lock all non-status columns while the group is active.
  IF OLD.status = 'active' AND NEW.status = 'active' THEN
    IF NEW.brand_id         IS DISTINCT FROM OLD.brand_id
    OR NEW.name             IS DISTINCT FROM OLD.name
    OR NEW.overlapping_rule IS DISTINCT FROM OLD.overlapping_rule
    OR NEW.activated_at     IS DISTINCT FROM OLD.activated_at
    THEN
      RAISE EXCEPTION 'jackpot_groups row % is active; move to draft or disabled before editing', OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER jackpot_groups_guard_trg
  BEFORE UPDATE ON public.jackpot_groups
  FOR EACH ROW EXECUTE FUNCTION public.jackpot_groups_guard();

-- 4b) jackpots: block writes when parent group is active; verify brand match.
CREATE OR REPLACE FUNCTION public.jackpots_group_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  parent_status   text;
  parent_brand_id bigint;
  ref_group_id    bigint;
BEGIN
  IF TG_OP = 'DELETE' THEN
    ref_group_id := OLD.group_id;
  ELSE
    ref_group_id := NEW.group_id;
  END IF;

  IF ref_group_id IS NOT NULL THEN
    SELECT status, brand_id INTO parent_status, parent_brand_id
      FROM public.jackpot_groups
      WHERE id = ref_group_id;

    IF parent_status IS NULL THEN
      RAISE EXCEPTION 'jackpot_groups row % not found', ref_group_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF parent_status = 'active' THEN
      RAISE EXCEPTION 'parent group % is active; child jackpot is read-only', ref_group_id
        USING ERRCODE = 'check_violation';
    END IF;

    IF TG_OP <> 'DELETE' AND NEW.brand_id IS DISTINCT FROM parent_brand_id THEN
      RAISE EXCEPTION 'jackpot.brand_id (%) must match parent group brand_id (%)',
        NEW.brand_id, parent_brand_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER jackpots_group_guard_trg
  BEFORE INSERT OR UPDATE OR DELETE ON public.jackpots
  FOR EACH ROW EXECUTE FUNCTION public.jackpots_group_guard();

-- 5) Idempotent backfill from legacy tiers[] JSONB --------------------------
DO $backfill$
DECLARE
  legacy        record;
  new_group_id  bigint;
  child_id      bigint;
  tier          jsonb;
  tier_idx      int;
  tier_weight   numeric;
  total_contrib numeric;
BEGIN
  FOR legacy IN
    SELECT id, brand_id, name, contribution_percentage, trigger_condition,
           (trigger_condition->'tiers') AS tiers
      FROM public.jackpots
      WHERE jsonb_typeof(trigger_condition->'tiers') = 'array'
        AND jsonb_array_length(trigger_condition->'tiers') > 0
        AND group_id IS NULL
  LOOP
    -- Create parent group (idempotent via UNIQUE(brand_id, name)).
    INSERT INTO public.jackpot_groups (brand_id, name, status)
      VALUES (legacy.brand_id, legacy.name || ' (migrated)', 'draft')
      ON CONFLICT (brand_id, name) DO UPDATE
        SET updated_at = now()
      RETURNING id INTO new_group_id;

    total_contrib := COALESCE(legacy.contribution_percentage, 0);
    tier_idx := 0;

    FOR tier IN SELECT * FROM jsonb_array_elements(legacy.tiers)
    LOOP
      tier_idx := tier_idx + 1;
      tier_weight := COALESCE((tier->>'multiLevelWeight')::numeric, 0);

      INSERT INTO public.jackpots (
        brand_id,
        name,
        enabled,
        contribution_percentage,
        volatility,
        trigger_condition,
        group_id,
        tier_rank,
        trigger_probability
      ) VALUES (
        legacy.brand_id,
        legacy.name || ' / ' || COALESCE(tier->>'label', 'Tier ' || tier_idx),
        true,
        total_contrib * tier_weight,
        0,
        jsonb_build_object(
          'threshold', COALESCE((legacy.trigger_condition->>'threshold')::numeric, 0),
          'migratedFromTier', tier
        ),
        new_group_id,
        COALESCE((tier->>'multiLevelTier')::int, tier_idx),
        LEAST(GREATEST(COALESCE((tier->>'triggerOdds')::numeric, 0), 0), 1)
      )
      RETURNING id INTO child_id;

      -- Pool + seed shells so the engine has rows to read.
      INSERT INTO public.jackpot_pools (jackpot_id, current_balance) VALUES (child_id, 0);
      INSERT INTO public.jackpot_seeds (jackpot_id, base_seed_amount) VALUES (child_id, 0);
    END LOOP;

    -- Null out the legacy tiers array on the original (still ungrouped) row.
    UPDATE public.jackpots
      SET trigger_condition = (legacy.trigger_condition - 'tiers')
      WHERE id = legacy.id;
  END LOOP;
END;
$backfill$;

-- 6) Forbid any future legacy `tiers` payload on trigger_condition ----------
ALTER TABLE public.jackpots
  ADD CONSTRAINT trigger_condition_forbids_tiers
  CHECK (NOT (trigger_condition ? 'tiers'));
