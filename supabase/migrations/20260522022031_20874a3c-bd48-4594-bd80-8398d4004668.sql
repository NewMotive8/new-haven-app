REVOKE EXECUTE ON FUNCTION public.apply_group_bet(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.jackpot_groups_guard() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.jackpots_group_guard() FROM PUBLIC, anon, authenticated;