# MyTake authentication deployment

Production is deployed at https://usemytake.vercel.app. Vercel built the v1 application successfully; the homepage and sign-in form loaded, and the user confirmed the deployed app works. Production email delivery is configured and has been verified with a real recovery email.

## Vercel environment

Set these in the Vercel project’s **Production** environment before deploying:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://usemytake.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | The existing MyTake Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The existing publishable key |
| `TMDB_READ_ACCESS_TOKEN` | The existing server-only TMDB read token |

Do not add a Supabase service-role key. Do not commit an environment file containing credentials. Changing Vercel environment variables requires a new deployment. Authentication rejects a missing/non-HTTPS hosted site URL and mismatched request origins rather than emailing a localhost or arbitrary-host reset link.

Use one canonical production domain for authentication. Redirect any alternate domain to it before starting sign-up or recovery. Preview deployments are not configured for authentication: do not add broad Vercel wildcards. If preview authentication is later required, give it an exact URL and an intentional backend/environment plan.

## Supabase URL Configuration

The following production configuration is saved:

1. Set **Authentication → URL Configuration → Site URL** to the same `NEXT_PUBLIC_SITE_URL` origin.
2. Add the exact production redirect URLs, substituting that origin:
   - `https://usemytake.vercel.app/auth/callback`
   - `https://usemytake.vercel.app/auth/callback?next=/reset-password`
3. Retain the local redirects only while using the connected project for local development.

The two localhost callbacks below are retained for local development. Site URL is `https://usemytake.vercel.app`; both exact production callbacks are also saved, for four allowed URLs total. Local callback URLs used by the app:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/callback?next=/reset-password`

Use `http://localhost:3000` for local development and authentication testing. The application only accepts these development-origin overrides in development mode; hosted authentication uses its configured origin.

## Email delivery and recovery

The existing default Supabase email templates are compatible with the PKCE callback flow. Password recovery sends `resetPasswordForEmail` with the reset callback above. The callback exchanges the one-time code into cookie-based authentication and allows only `/library` or `/reset-password` destinations. It never follows arbitrary `next` URLs.

Open the email link in the same browser/device that requested it, because that browser holds the PKCE verifier. A new request can invalidate the earlier browser verifier; use the latest email. Expired, used or mismatched-browser recovery links offer a fresh request. The reset form and server action verify the current user before calling `updateUser`; no administrator key or user ID supplied by a browser is used. After a confirmed password change, the app requests global sign-out and sends the user to sign in again. Global sign-out revokes refresh sessions; already-issued access JWTs may remain valid until their expiry.

Supabase custom SMTP is enabled through the dedicated Gmail account `mytakesupport@gmail.com`. Sender name is `MyTake`; host is `smtp.gmail.com` on port `465`; the username is the support account, and the app password is stored encrypted by Supabase and is not in the repository. Do not disable email confirmation to work around delivery problems. Gmail’s personal SMTP warning is expected for this small MVP; a transactional provider can be revisited if volume or deliverability needs grow.

Official references: [Password-based Auth](https://supabase.com/docs/guides/auth/passwords), [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## User-run release checks

The local recovery email, password update and sign-in with the new password were confirmed by the user. Repeat on the deployed origin; the checks below are not all implied by that local result.

1. Run `npm run build` after these authentication changes.
2. On the deployed origin, request a password reset for your existing account.
3. Open the latest email in the same browser, enter and confirm a new password privately, and submit it yourself.
4. Confirm the app returns to Sign In and the new password works; verify the old password no longer works.
5. Reopen the used link and check the retry message. Verify an invalid callback does not grant account access.
6. Test a fresh sign-up and confirmation on the deployed domain, then sign-out/sign-in and session persistence.
7. Check email delivery to an intended recipient after any future SMTP or template change.

Agent checks can validate forms, routing guards and mocked update/sign-out behaviour. Actual password entry and submission are user-run; passwords must never be pasted into chat.
