
-- 1. Explicit admin policies on jackpot financial tables
CREATE POLICY "Admins manage jackpots"
  ON public.jackpots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage jackpot_pools"
  ON public.jackpot_pools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage jackpot_seeds"
  ON public.jackpot_seeds FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Explicit admin write policies on financial ledger tables
CREATE POLICY "Admins insert jackpot_wins"
  ON public.jackpot_wins FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update jackpot_wins"
  ON public.jackpot_wins FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete jackpot_wins"
  ON public.jackpot_wins FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert jackpot_transactions"
  ON public.jackpot_transactions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update jackpot_transactions"
  ON public.jackpot_transactions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete jackpot_transactions"
  ON public.jackpot_transactions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Revoke EXECUTE on SECURITY DEFINER admin/trigger functions from anon/authenticated.
--    has_role must remain executable by authenticated because RLS policies call it.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                                         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()                                          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.jackpots_group_guard()                                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.jackpot_groups_guard()                                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_audit_log_immutable()                               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_jackpot_topup(bigint, double precision, boolean, uuid, bigint, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_group_bet(jsonb)                                    FROM PUBLIC, anon, authenticated;
