
ALTER TABLE public.jackpot_groups
  ADD COLUMN IF NOT EXISTS contribution_source text NOT NULL DEFAULT 'player',
  ADD COLUMN IF NOT EXISTS contribution_type text NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS master_contribution_value double precision NOT NULL DEFAULT 0;

ALTER TABLE public.jackpot_groups
  DROP CONSTRAINT IF EXISTS jackpot_groups_contribution_source_check,
  ADD CONSTRAINT jackpot_groups_contribution_source_check
    CHECK (contribution_source IN ('player','operator'));

ALTER TABLE public.jackpot_groups
  DROP CONSTRAINT IF EXISTS jackpot_groups_contribution_type_check,
  ADD CONSTRAINT jackpot_groups_contribution_type_check
    CHECK (contribution_type IN ('percentage','fixed'));

ALTER TABLE public.jackpot_groups
  DROP CONSTRAINT IF EXISTS jackpot_groups_master_value_nonneg,
  ADD CONSTRAINT jackpot_groups_master_value_nonneg
    CHECK (master_contribution_value >= 0);

ALTER TABLE public.jackpots
  ADD COLUMN IF NOT EXISTS split_share numeric(7,4) NOT NULL DEFAULT 0;

ALTER TABLE public.jackpots
  DROP CONSTRAINT IF EXISTS jackpots_split_share_range,
  ADD CONSTRAINT jackpots_split_share_range
    CHECK (split_share >= 0 AND split_share <= 100);

-- Update group guard to also lock the new funding columns while active
CREATE OR REPLACE FUNCTION public.jackpot_groups_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
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

  IF OLD.status = 'active' AND NEW.status = 'active' THEN
    IF NEW.brand_id                  IS DISTINCT FROM OLD.brand_id
    OR NEW.name                      IS DISTINCT FROM OLD.name
    OR NEW.overlapping_rule          IS DISTINCT FROM OLD.overlapping_rule
    OR NEW.contribution_source       IS DISTINCT FROM OLD.contribution_source
    OR NEW.contribution_type         IS DISTINCT FROM OLD.contribution_type
    OR NEW.master_contribution_value IS DISTINCT FROM OLD.master_contribution_value
    OR NEW.activated_at              IS DISTINCT FROM OLD.activated_at
    THEN
      RAISE EXCEPTION 'jackpot_groups row % is active; move to draft or disabled before editing', OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
