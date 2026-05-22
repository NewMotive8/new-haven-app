-- Idempotency: one row per (brand_id, transaction_id)
CREATE UNIQUE INDEX IF NOT EXISTS jackpot_transactions_brand_tx_uq
  ON public.jackpot_transactions (brand_id, transaction_id);

-- Atomic group bet application.
-- Expected payload shape:
-- {
--   "transactionId": "...",
--   "brandId": 123,
--   "groupId": 45,
--   "totals": { "pool": 0.0, "seed": 0.0, "house": 0.0 },
--   "response": { ... full response payload ... },
--   "poolDeltas": [ { "jackpotId": 1, "delta": 0.123456 }, ... ]
-- }
CREATE OR REPLACE FUNCTION public.apply_group_bet(p_payload jsonb)
RETURNS public.jackpot_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx_id    text   := p_payload->>'transactionId';
  v_brand    bigint := (p_payload->>'brandId')::bigint;
  v_group    bigint := NULLIF(p_payload->>'groupId','')::bigint;
  v_totals   jsonb  := COALESCE(p_payload->'totals', '{}'::jsonb);
  v_response jsonb  := p_payload->'response';
  v_deltas   jsonb  := COALESCE(p_payload->'poolDeltas', '[]'::jsonb);
  v_row      public.jackpot_transactions;
  v_item     jsonb;
  v_jp_id    bigint;
  v_delta    double precision;
BEGIN
  IF v_tx_id IS NULL OR v_tx_id = '' THEN
    RAISE EXCEPTION 'transactionId is required';
  END IF;
  IF v_brand IS NULL THEN
    RAISE EXCEPTION 'brandId is required';
  END IF;

  -- Apply pool balance deltas
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

  -- Insert the transaction record; unique (brand_id, transaction_id) enforces idempotency
  INSERT INTO public.jackpot_transactions
    (transaction_id, group_id, brand_id, totals, response)
  VALUES
    (v_tx_id, v_group, v_brand, v_totals, v_response)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_group_bet(jsonb) TO service_role;