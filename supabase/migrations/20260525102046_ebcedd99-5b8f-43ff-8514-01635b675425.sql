
ALTER TABLE public.jackpot_seeds
  ADD COLUMN IF NOT EXISTS current_seed_amount double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minimum_seed_amount double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maximum_seed_amount double precision NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.apply_group_bet(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tx_id      text   := p_payload->>'transactionId';
  v_brand      bigint := (p_payload->>'brandId')::bigint;
  v_group      bigint := NULLIF(p_payload->>'groupId','')::bigint;
  v_totals     jsonb  := COALESCE(p_payload->'totals', '{}'::jsonb);
  v_response   jsonb  := p_payload->'response';
  v_deltas     jsonb  := COALESCE(p_payload->'poolDeltas', '[]'::jsonb);
  v_attributes jsonb  := p_payload->'attributes';
  v_win_jp     bigint := NULLIF(p_payload->>'winJackpotId','')::bigint;
  v_win_amount numeric := COALESCE((p_payload->>'winAmount')::numeric, 0);
  v_player     text   := p_payload->>'playerId';
  v_row        public.jackpot_transactions;
  v_win_row    public.jackpot_wins;
  v_item       jsonb;
  v_jp_id      bigint;
  v_pool_delta double precision;
  v_seed_delta double precision;
  v_seed_max   double precision;
  v_seed_min   double precision;
  v_seed_cur   double precision;
  v_seed_apply double precision;
  v_overflow   double precision;
  v_balance    numeric;
  v_payout     numeric := 0;
  v_reseed_amt double precision;
BEGIN
  IF v_tx_id IS NULL OR v_tx_id = '' THEN
    RAISE EXCEPTION 'transactionId is required';
  END IF;
  IF v_brand IS NULL THEN
    RAISE EXCEPTION 'brandId is required';
  END IF;

  -- ── Per-jackpot pool/seed delta application with overflow valve ──
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_deltas)
  LOOP
    v_jp_id      := (v_item->>'jackpotId')::bigint;
    v_pool_delta := COALESCE((v_item->>'delta')::double precision, 0);
    v_seed_delta := COALESCE((v_item->>'seedDelta')::double precision, 0);
    v_seed_max   := COALESCE((v_item->>'maximumSeedAmount')::double precision, 0);

    IF v_jp_id IS NULL THEN CONTINUE; END IF;

    -- Apply seed delta with cap; any excess is redirected to the pool delta.
    IF v_seed_delta > 0 THEN
      SELECT current_seed_amount INTO v_seed_cur
        FROM public.jackpot_seeds
        WHERE jackpot_id = v_jp_id
        FOR UPDATE;

      IF v_seed_cur IS NULL THEN
        INSERT INTO public.jackpot_seeds (jackpot_id, base_seed_amount, current_seed_amount)
        VALUES (v_jp_id, 0, 0)
        ON CONFLICT DO NOTHING;
        v_seed_cur := 0;
      END IF;

      IF v_seed_max > 0 THEN
        v_seed_apply := LEAST(v_seed_delta, GREATEST(0, v_seed_max - v_seed_cur));
        v_overflow   := v_seed_delta - v_seed_apply;
      ELSE
        v_seed_apply := v_seed_delta;
        v_overflow   := 0;
      END IF;

      IF v_seed_apply > 0 THEN
        UPDATE public.jackpot_seeds
           SET current_seed_amount = current_seed_amount + v_seed_apply
         WHERE jackpot_id = v_jp_id;
      END IF;

      -- Overflow stays in the player ecosystem — redirected to the main pool.
      v_pool_delta := v_pool_delta + v_overflow;
    END IF;

    IF v_pool_delta <> 0 THEN
      UPDATE public.jackpot_pools
         SET current_balance = current_balance + v_pool_delta
       WHERE jackpot_id = v_jp_id;
      IF NOT FOUND THEN
        INSERT INTO public.jackpot_pools (jackpot_id, current_balance)
        VALUES (v_jp_id, v_pool_delta);
      END IF;
    END IF;
  END LOOP;

  -- ── Win settlement + post-win reseed from the seed reservoir ──
  IF v_win_jp IS NOT NULL THEN
    SELECT current_balance INTO v_balance
      FROM public.jackpot_pools
     WHERE jackpot_id = v_win_jp
     FOR UPDATE;

    IF v_balance IS NULL THEN v_balance := 0; END IF;

    v_payout := LEAST(v_win_amount, v_balance);
    IF v_payout < 0 THEN v_payout := 0; END IF;

    IF v_payout > 0 THEN
      UPDATE public.jackpot_pools
         SET current_balance = current_balance - v_payout
       WHERE jackpot_id = v_win_jp;
    END IF;

    -- Refill the main pool from the seed reservoir, capped by what's available.
    SELECT minimum_seed_amount, current_seed_amount
      INTO v_seed_min, v_seed_cur
      FROM public.jackpot_seeds
     WHERE jackpot_id = v_win_jp
     FOR UPDATE;

    IF v_seed_min IS NULL THEN v_seed_min := 0; END IF;
    IF v_seed_cur IS NULL THEN v_seed_cur := 0; END IF;

    v_reseed_amt := LEAST(GREATEST(0, v_seed_min), GREATEST(0, v_seed_cur));

    IF v_reseed_amt > 0 THEN
      UPDATE public.jackpot_seeds
         SET current_seed_amount = current_seed_amount - v_reseed_amt
       WHERE jackpot_id = v_win_jp;
      UPDATE public.jackpot_pools
         SET current_balance = current_balance + v_reseed_amt
       WHERE jackpot_id = v_win_jp;
    END IF;

    INSERT INTO public.jackpot_wins
      (transaction_id, player_id, jackpot_id, amount, status)
    VALUES
      (v_tx_id, v_player, v_win_jp, v_payout, 'pending_ack')
    ON CONFLICT (transaction_id) DO NOTHING
    RETURNING * INTO v_win_row;
  END IF;

  INSERT INTO public.jackpot_transactions
    (transaction_id, group_id, brand_id, totals, response, attributes)
  VALUES
    (v_tx_id, v_group, v_brand, v_totals, v_response, v_attributes)
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'transaction', to_jsonb(v_row),
    'win', CASE WHEN v_win_row.id IS NOT NULL THEN to_jsonb(v_win_row) ELSE NULL END
  );
END;
$function$;
