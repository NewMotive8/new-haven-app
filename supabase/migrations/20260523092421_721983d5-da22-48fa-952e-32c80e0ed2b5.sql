
-- 1. jackpot_wins
CREATE TABLE IF NOT EXISTS public.jackpot_wins (
  id             bigserial PRIMARY KEY,
  transaction_id text NOT NULL UNIQUE,
  player_id      text,
  jackpot_id     bigint NOT NULL,
  amount         numeric NOT NULL,
  status         text NOT NULL DEFAULT 'pending_ack',
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jackpot_wins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read jackpot_wins"
  ON public.jackpot_wins FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_jackpot_wins_jackpot ON public.jackpot_wins(jackpot_id);
CREATE INDEX IF NOT EXISTS idx_jackpot_wins_player  ON public.jackpot_wins(player_id);

-- 2. admin_audit_log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id             bigserial PRIMARY KEY,
  occurred_at    timestamptz NOT NULL DEFAULT now(),
  actor_user_id  uuid,
  brand_id       bigint,
  action         text NOT NULL,
  target_type    text NOT NULL,
  target_id      text,
  before_state   jsonb,
  after_state    jsonb,
  delta          jsonb,
  request_id     text,
  ip             text
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read admin_audit_log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.admin_audit_log_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  RAISE EXCEPTION 'admin_audit_log is append-only; UPDATE/DELETE forbidden'
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS admin_audit_log_no_update ON public.admin_audit_log;
DROP TRIGGER IF EXISTS admin_audit_log_no_delete ON public.admin_audit_log;
CREATE TRIGGER admin_audit_log_no_update BEFORE UPDATE ON public.admin_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.admin_audit_log_immutable();
CREATE TRIGGER admin_audit_log_no_delete BEFORE DELETE ON public.admin_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.admin_audit_log_immutable();

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target
  ON public.admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor
  ON public.admin_audit_log(actor_user_id, occurred_at DESC);

-- 3. apply_group_bet — drop and recreate (return type change)
DROP FUNCTION IF EXISTS public.apply_group_bet(jsonb);

CREATE OR REPLACE FUNCTION public.apply_group_bet(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tx_id      text   := p_payload->>'transactionId';
  v_brand      bigint := (p_payload->>'brandId')::bigint;
  v_group      bigint := NULLIF(p_payload->>'groupId','')::bigint;
  v_totals     jsonb  := COALESCE(p_payload->'totals', '{}'::jsonb);
  v_response   jsonb  := p_payload->'response';
  v_deltas     jsonb  := COALESCE(p_payload->'poolDeltas', '[]'::jsonb);
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
    (transaction_id, group_id, brand_id, totals, response)
  VALUES
    (v_tx_id, v_group, v_brand, v_totals, v_response)
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'transaction', to_jsonb(v_row),
    'win', CASE WHEN v_win_row.id IS NOT NULL THEN to_jsonb(v_win_row) ELSE NULL END
  );
END;
$$;

-- 4. apply_jackpot_topup — drop + recreate (new signature)
DROP FUNCTION IF EXISTS public.apply_jackpot_topup(bigint, double precision, boolean);

CREATE OR REPLACE FUNCTION public.apply_jackpot_topup(
  p_jackpot_id    bigint,
  p_amount        double precision,
  p_is_seed       boolean,
  p_actor_user_id uuid    DEFAULT NULL,
  p_brand_id      bigint  DEFAULT NULL,
  p_request_id    text    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_before_pool numeric;
  v_before_seed numeric;
  v_after_pool  numeric;
  v_after_seed  numeric;
BEGIN
  IF p_jackpot_id IS NULL THEN RAISE EXCEPTION 'jackpot_id is required'; END IF;
  IF p_amount IS NULL THEN RAISE EXCEPTION 'amount is required'; END IF;

  SELECT current_balance INTO v_before_pool
    FROM public.jackpot_pools WHERE jackpot_id = p_jackpot_id;
  SELECT base_seed_amount INTO v_before_seed
    FROM public.jackpot_seeds WHERE jackpot_id = p_jackpot_id;

  UPDATE public.jackpot_pools
     SET current_balance = current_balance + p_amount
   WHERE jackpot_id = p_jackpot_id;
  IF NOT FOUND THEN
    INSERT INTO public.jackpot_pools (jackpot_id, current_balance)
    VALUES (p_jackpot_id, p_amount);
  END IF;

  IF p_is_seed THEN
    UPDATE public.jackpot_seeds
       SET base_seed_amount = base_seed_amount + p_amount
     WHERE jackpot_id = p_jackpot_id;
    IF NOT FOUND THEN
      INSERT INTO public.jackpot_seeds (jackpot_id, base_seed_amount)
      VALUES (p_jackpot_id, p_amount);
    END IF;
  END IF;

  SELECT current_balance INTO v_after_pool
    FROM public.jackpot_pools WHERE jackpot_id = p_jackpot_id;
  SELECT base_seed_amount INTO v_after_seed
    FROM public.jackpot_seeds WHERE jackpot_id = p_jackpot_id;

  INSERT INTO public.admin_audit_log
    (actor_user_id, brand_id, action, target_type, target_id,
     before_state, after_state, delta, request_id)
  VALUES
    (p_actor_user_id, p_brand_id, 'jackpot_topup', 'jackpot', p_jackpot_id::text,
     jsonb_build_object('poolBalance', v_before_pool, 'seedAmount', v_before_seed),
     jsonb_build_object('poolBalance', v_after_pool,  'seedAmount', v_after_seed),
     jsonb_build_object('amount', p_amount, 'isSeed', p_is_seed),
     p_request_id);
END;
$$;
