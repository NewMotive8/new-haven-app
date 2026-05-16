# Fix: "Database error querying schema" on login

## Root cause

The seed migration that created `dr.loop@gmail.com` inserted the row into `auth.users` without setting the token columns. GoTrue (Supabase Auth) reads those columns as Go `string` (not `*string`), so any NULL value crashes the request with:

> sql: Scan error on column index 3, name "confirmation_token": converting NULL to string is unsupported

The user can never sign in or trigger password reset until those columns are normalized to empty strings.

Verified against the DB — for `dr.loop@gmail.com` these columns are NULL:
`confirmation_token`, `recovery_token`, `email_change_token_new`, `email_change`, `reauthentication_token`.

## Fix

One small migration that normalizes the existing row (and any future rows hit by the same bug):

```sql
UPDATE auth.users
SET
  confirmation_token        = COALESCE(confirmation_token, ''),
  recovery_token            = COALESCE(recovery_token, ''),
  email_change_token_new    = COALESCE(email_change_token_new, ''),
  email_change_token_current= COALESCE(email_change_token_current, ''),
  reauthentication_token    = COALESCE(reauthentication_token, ''),
  email_change              = COALESCE(email_change, ''),
  phone_change              = COALESCE(phone_change, ''),
  phone_change_token        = COALESCE(phone_change_token, '')
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change_token_new IS NULL
  OR email_change_token_current IS NULL
  OR reauthentication_token IS NULL
  OR email_change IS NULL
  OR phone_change IS NULL
  OR phone_change_token IS NULL;
```

After the migration runs, sign in at `/login` with:

- Email: `dr.loop@gmail.com`
- Password: `TempPass123!`

No code changes needed — the login form, server functions, and RLS are all correct. The only blocker is the NULL token columns on the seeded row.

## Note for future admin seeding

The previous bootstrap migration should have inserted those columns with `''` defaults. If we ever seed another admin via SQL, include the empty-string token columns explicitly (or use `supabase.auth.admin.createUser` from a one-off server function, which sets them correctly).
