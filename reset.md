# Reset Password Setup

The code side is already ready in this repo.

What is already done:

- forgot password page exists
- reset password page exists
- backend reset API exists
- Supabase admin reset email call exists
- app-side rate limiting exists

So the only remaining work is Supabase setup and env verification.

## Step 1: Enable Email Login In Supabase

In Supabase:

1. Open `Authentication`.
2. Open the email provider settings.
3. Enable email/password sign-in.

This must be on, otherwise password reset will not work.

## Step 2: Set The Site URL

In Supabase:

1. Open `Authentication`.
2. Open `URL Configuration`.
3. Set `Site URL`.

For local:

- `http://localhost:3000`

For production:

- your real frontend domain

## Step 3: Add Redirect URLs

In Supabase `Authentication -> URL Configuration`, add these redirect URLs:

- `http://localhost:3000/reset-password`
- your production `https://your-domain.com/reset-password`

If you use staging or preview, add those exact `/reset-password` URLs too.

This is required because the backend sends users to:

- `FRONTEND_URL + /reset-password`

## Step 4: Verify Backend Env

In backend `.env`, make sure these are correct:

- `FRONTEND_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Meaning:

- `FRONTEND_URL` should match the frontend you are testing
- `SUPABASE_URL` should match the same Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` should be from that same project

## Step 5: Verify Frontend Env

In frontend `.env.local`, make sure these are correct:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These must point to the same Supabase project as the backend.

## Step 6: Check Email Sending

In Supabase, make sure reset emails can be sent.

For development:

- built-in email is enough for basic testing

For production:

- configure custom SMTP

Without working email delivery, the flow will appear successful in the app but no reset email will arrive.

## Step 7: Review Supabase Rate Limits

In Supabase:

1. Open `Authentication`.
2. Open `Rate Limits`.
3. Review recovery and email-related limits.

The repo already has backend rate limiting, but Supabase still has its own limits.

## Step 8: Optional Email Template Check

If needed, review the recovery email template in Supabase.

Check:

- product name
- branding
- link domain
- recovery copy

## Step 9: Test The Flow

Run the frontend and backend, then test:

1. Open `/login`
2. Click `Forgot password?`
3. Enter a real user email
4. Confirm the app shows a generic success message
5. Open the reset email
6. Confirm it lands on `/reset-password`
7. Set a new password
8. Sign in with the new password

## Step 10: Test Failure Cases

Also test:

1. wrong `FRONTEND_URL`
2. missing redirect URL in Supabase
3. expired reset link
4. weak password
5. repeated reset requests until rate limited

## Short Answer

If you want the simplest roadmap, do this:

1. Enable email/password auth in Supabase
2. Set `Site URL`
3. Add `/reset-password` redirect URLs
4. Verify backend env
5. Verify frontend env
6. Make sure email sending works
7. Test the flow end to end
