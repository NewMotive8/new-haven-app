# Add real auth + invite-only user management

Replace the hardcoded Admin/password login with Lovable Cloud email/password auth, and add a Users page inside `/admin` where admins can invite new users, reset passwords, enable/disable accounts, and delete them.

## What you'll get

- Real login at `/login` with email + password (Google sign-in NOT included since this is an internal backoffice — say the word if you want it).
- A `/admin/users` page listing all admin users with: invite, send password reset, enable/disable, delete.
- A `/reset-password` page users land on from the reset email.
- Public signup is disabled — only existing admins can add new users.
- Everything under `/admin` is gated: unauthenticated visitors are redirected to `/login`.

## Database

Two new tables:

- `profiles` (one row per auth user) — `user_id`, `email`, `display_name`, `enabled`, timestamps. Auto-created by a trigger on `auth.users` insert.
- `user_roles` — `user_id`, `role` (enum: `admin`, `user`). Stored separately from profiles to prevent privilege-escalation. A `has_role(user_id, role)` security-definer function backs the RLS policies.

RLS:
- Any authenticated admin can read/update/delete profiles and roles.
- Non-admins can only read their own profile.
- Disabled users (`enabled = false`) are blocked from `/admin` at the guard layer.

## Auth flow

- Supabase auth configured: `disable_signup = true`, `auto_confirm_email = true` (so invited users can sign in immediately with the temporary password), `password_hibp_enabled = true`.
- Invite = admin enters email + temp password on Users page → server function uses the admin client to create the user → user signs in and is prompted to change password on first login.
- "Send reset email" button calls `supabase.auth.resetPasswordForEmail` → email links to `/reset-password` where the user sets a new password.

## Routes

```
src/routes/
  login.tsx                          (public)
  reset-password.tsx                 (public)
  _authenticated.tsx                 (guard: redirect to /login if no session OR profile disabled)
  _authenticated/admin.tsx           (moved from admin.tsx; admin-role check in beforeLoad)
  _authenticated/admin.index.tsx
  _authenticated/admin.jackpots.*    (moved)
  _authenticated/admin.simulator.tsx (moved)
  _authenticated/admin.users.tsx     (NEW — user management UI)
```

The `/admin` URL stays the same; only the file location changes (TanStack `_authenticated` is a pathless layout).

## Server functions

In `src/lib/users.functions.ts`:
- `listUsers` (admin only) — joins `profiles` + `user_roles`.
- `inviteUser({ email, password, role })` — uses `supabaseAdmin.auth.admin.createUser`, inserts role.
- `setUserEnabled({ userId, enabled })`.
- `deleteUser({ userId })` — `supabaseAdmin.auth.admin.deleteUser`.
- `sendPasswordReset({ email })`.

All guarded by `requireSupabaseAuth` + an `assertAdmin(userId)` helper.

## Bootstrap

Since signup is disabled, you need a first admin. The migration will seed one admin row for the email you give me (see question below). You'll receive a temporary password to sign in with, then change it immediately.

## Out of scope

- Google / social sign-in (can add later).
- Email branding for the password reset email (uses default Lovable template; can be customized later).
- Per-feature permissions beyond the single `admin` role.

## One thing I need from you

What email should the first admin account use? (I'll seed it in the migration and give you a temp password to sign in with.)
