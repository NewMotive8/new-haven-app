# Seed sandbox admin user

Create `dr.loop@gmail.com` directly in the sandbox backend so you can log in with familiar credentials.

## What gets created

- Auth user: `dr.loop@gmail.com`, email pre-confirmed (no verification email)
- Password: `SandboxLoop123!` (different from production — change after first login if you want)
- Profile row in `profiles` (auto-created by the existing `handle_new_user` trigger… if the trigger is wired; otherwise inserted explicitly)
- Role row in `user_roles` with `role = 'admin'` so RLS policies grant full access

## How

A single SQL migration that:
1. Inserts into `auth.users` with `encrypted_password = crypt(...)` and `email_confirmed_at = now()`
2. Inserts matching `profiles` row (idempotent via `ON CONFLICT`)
3. Inserts `user_roles` row with `admin`

All wrapped so it's safe to re-run.

## After it runs

Log in at `https://sandbox-admin.incentiv8.co/login` with:
- Email: `dr.loop@gmail.com`
- Password: `SandboxLoop123!`

If you'd prefer a different password, tell me before approving and I'll swap it in.
