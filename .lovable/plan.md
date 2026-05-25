## Plan: Add new admin user

Create a new authenticated user and grant them the `admin` role.

**Steps:**
1. Create the auth user via Supabase Admin API with:
   - Email: `alecmelnik@gmail.com`
   - Password: `1234trewq00`
   - Email auto-confirmed (so they can sign in immediately)
2. The existing `handle_new_user` trigger will auto-create a row in `public.profiles`.
3. Insert a row into `public.user_roles` with `role = 'admin'` for the new user, so they pass the `has_role(auth.uid(), 'admin')` checks used across RLS and `/admin/*` routes.

**Verification:**
- Confirm the user appears in `/admin/users` with role `admin` and status Enabled.
- User can sign in at `/login` with the provided credentials.

**Security note:** The password `1234trewq00` is weak and was shared in plaintext chat. Recommend the user change it after first sign-in.