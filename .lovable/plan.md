# Replace password reset email with admin "Set password" action

## Why

The `/recover` call works, but the project has no verified email domain, so recovery emails go through Supabase's default relay and don't reliably reach the inbox. For an invite-only admin tool this is overkill — admins can just hand a user a new temp password directly.

## Changes

**1. New server function** `setUserPassword` in `src/lib/users.functions.ts`
- Protected by `requireSupabaseAuth` + existing `assertAdmin` helper
- Input: `{ userId: string, password: string }` (Zod, min 8 chars)
- Uses `supabaseAdmin.auth.admin.updateUserById(userId, { password })` to set the password immediately — no email involved
- Returns `{ ok: true }`

**2. Remove the email recovery action** from `src/lib/users.functions.ts`
- Delete `sendUserPasswordReset` (no longer used)

**3. Update Users admin page** `src/routes/admin.users.tsx`
- Replace the "Reset password" button with a "Set password" button per row
- Clicking it opens a small inline prompt (or simple `prompt()` dialog to keep scope tight) asking for the new temp password
- Calls `setUserPassword` via `useServerFn` + `useMutation`
- Shows success / error in the existing `feedback` banner
- Drop the old `resetM` mutation and its imports

**4. Leave `/reset-password.tsx` route in place**
- Still useful: a signed-in user can navigate there to change their own password via `supabase.auth.updateUser({ password })`. Won't be linked from the Users table anymore.

No DB migration needed. No email infra needed.

## Notes for the user

After this lands, the flow is:
1. Admin opens `/admin/users`, clicks **Set password** on the target row, types a new temp password.
2. Hand that password to the user out-of-band (Slack, in person, etc.).
3. User signs in at `/login`, optionally changes it themselves at `/reset-password`.
