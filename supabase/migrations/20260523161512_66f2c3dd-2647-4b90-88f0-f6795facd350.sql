-- 1. Add the open-ended attributes column to the ledger.
ALTER TABLE public.jackpot_transactions
  ADD COLUMN IF NOT EXISTS attributes JSONB;

-- 2. Partial GIN index for efficient lookup when present.
CREATE INDEX IF NOT EXISTS idx_jackpot_transactions_attributes
  ON public.jackpot_transactions USING GIN (attributes)
  WHERE attributes IS NOT NULL;

-- 3. Update apply_group_bet to persist attributes atomically with the
--    pool deltas + win settlement + transaction row insert. Function body
--    is identical to the prior version except for reading p_payload->'attributes'
--    and writing it into jackpot_transactions.
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
  v_delta      double precision;
  v_balance    numeric;
  v_payout     numeric := 0;
BEGIN
  IF v_tx_id IS NULL OR v_tx_id = '' THEN
    RAISE EXCEPTION 'transactionId is required';
  END IF;
  IF v_brand IS NULL THEN
    RAISE EXCEPTION 'brandId is required';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_deltas)
  LOOP
    v_jp_id := (v_item->>'jackpotId')::bigint;
    v_delta := (v_item->>'delta')::double precision;
    IF v_jp_id IS NOT NULL AND v_delta IS NOT NULL AND v_delta <> 0 THEN
      UPDATE public.jackpot_pools
         SET current_balance = current_balance + v_delta
       WHERE jackpot_id = v_jp_id;
      IF NOT FOUND THEN
        INSERT INTO public.jackpot_pools (jackpot_id, current_balance)
        VALUES (v_jp_id, v_delta);
      END IF;
    END IF;
  END LOOP;

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