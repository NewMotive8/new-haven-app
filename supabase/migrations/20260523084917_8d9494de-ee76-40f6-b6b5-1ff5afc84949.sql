CREATE OR REPLACE FUNCTION public.apply_jackpot_topup(
  p_jackpot_id bigint,
  p_amount double precision,
  p_is_seed boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_jackpot_id IS NULL THEN
    RAISE EXCEPTION 'jackpot_id is required';
  END IF;
  IF p_amount IS NULL THEN
    RAISE EXCEPTION 'amount is required';
  END IF;

  -- Atomic pool increment (upsert if no pool row yet)
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
END;
$$;