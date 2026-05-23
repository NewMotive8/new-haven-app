
DO $$
DECLARE
  v_game_id    bigint;
  v_group_id   bigint;
  v_jackpot_id bigint;
BEGIN
  SELECT id INTO v_game_id
    FROM public.games
   WHERE operator_game_id = 'audit-game-999999';

  IF v_game_id IS NULL THEN
    INSERT INTO public.games
      (name, master_category, provider, operator_game_id, enabled)
    VALUES
      ('Audit Fixture Game 999999', 'Slots', 'audit-suite', 'audit-game-999999', true)
    RETURNING id INTO v_game_id;
  END IF;

  SELECT id INTO v_group_id
    FROM public.jackpot_groups
   WHERE brand_id = 999999
     AND name    = 'Audit Group 999999';

  IF v_group_id IS NULL THEN
    INSERT INTO public.jackpot_groups
      (brand_id, name, status, overlapping_rule, contribution_source,
       contribution_type, master_contribution_value,
       assigned_categories, assigned_game_ids)
    VALUES
      (999999, 'Audit Group 999999', 'draft', 'split', 'player',
       'percentage', 0,
       ARRAY[]::text[], ARRAY[v_game_id]::bigint[])
    RETURNING id INTO v_group_id;
  ELSE
    UPDATE public.jackpot_groups
       SET status            = CASE WHEN status = 'active' THEN 'draft' ELSE status END,
           assigned_game_ids = ARRAY[v_game_id]::bigint[]
     WHERE id = v_group_id;
  END IF;

  SELECT id INTO v_jackpot_id
    FROM public.jackpots
   WHERE group_id = v_group_id
     AND name     = 'Audit Jackpot 999999';

  IF v_jackpot_id IS NULL THEN
    INSERT INTO public.jackpots
      (name, brand_id, enabled, contribution_percentage, volatility,
       trigger_condition, group_id, tier_rank, trigger_probability,
       split_share, assigned_categories, assigned_game_ids)
    VALUES
      ('Audit Jackpot 999999', 999999, true, 1, 1,
       '{}'::jsonb, v_group_id, 1, 0,
       1, ARRAY[]::text[], ARRAY[v_game_id]::bigint[])
    RETURNING id INTO v_jackpot_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.jackpot_pools WHERE jackpot_id = v_jackpot_id
  ) THEN
    INSERT INTO public.jackpot_pools (jackpot_id, current_balance)
    VALUES (v_jackpot_id, 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.jackpot_seeds WHERE jackpot_id = v_jackpot_id
  ) THEN
    INSERT INTO public.jackpot_seeds (jackpot_id, base_seed_amount)
    VALUES (v_jackpot_id, 0);
  END IF;

  UPDATE public.jackpot_groups
     SET status = 'active'
   WHERE id = v_group_id
     AND status = 'draft';
END$$;
