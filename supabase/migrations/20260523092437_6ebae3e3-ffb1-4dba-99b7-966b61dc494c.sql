
REVOKE EXECUTE ON FUNCTION public.apply_group_bet(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_jackpot_topup(bigint, double precision, boolean, uuid, bigint, text) FROM PUBLIC, anon, authenticated;
