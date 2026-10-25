# MyTake authentication deployment

Production is deployed at https://my-take-seven.vercel.app. Vercel built commit `f85f1b6` successfully; the homepage and sign-in form loaded, and the user confirmed the deployed app works. Custom SMTP and production email-flow checks remain pending.

## Vercel environment

Set these in the Vercel project’s **Production** environment before deploying:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://my-take-seven.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | The existing MyTake Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The existing publishable key |
| `TMDB_READ_ACCESS_TOKEN` | The existing server-only TMDB read token |

Do not add a Supabase service-role key. Do not commit an environment file containing credentials. Changing Vercel environment variables requires a new deployment. Authentication rejects a missing/non-HTTPS hosted site URL and mismatched request origins rather than emailing a localhost or arbitrary-host reset link.

Use one canonical production domain for authentication. Redirect any alternate domain to it before starting sign-up or recovery. Preview deployments are not configured for authentication: do not add broad Vercel wildcards. If preview authentication is later required, give it an exact URL and an intentional backend/environment plan.

## Supabase URL Configuration

The following production configuration is saved:

1. Set **Authentication → URL Configuration → Site URL** to the same `NEXT_PUBLIC_SITE_URL` origin.
2. Add the exact production redirect URLs, substituting that origin:
   - `https://my-take-seven.vercel.app/auth/callback`
   - `https://my-take-seven.vercel.app/auth/callback?next=/reset-password`
3. Retain the local redirects only while using the connected project for local development.

The six local callbacks below were verified saved in the connected Supabase project with user approval. Site URL is `https://my-take-seven.vercel.app`; both exact production callbacks are also saved, for eight allowed URLs total. Local callback URLs used by the app:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/callback?next=/reset-password`
- `http://127.0.0.1:3000/auth/callback`
- `http://127.0.0.1:3000/auth/callback?next=/reset-password`
- `http://192.168.2.90:3000/auth/callback`
- `http://192.168.2.90:3000/auth/callback?next=/reset-password`

The Wi-Fi address is specific to the current local setup. If it changes, update the exact development origins and Supabase redirect URLs together. The application only accepts these development-origin overrides in development mode; hosted authentication uses its configured origin.

## Email delivery and recovery

The existing default Supabase email templates are compatible with the PKCE callback flow. Password recovery sends `resetPasswordForEmail` with the reset callback above. The callback exchanges the one-time code into cookie-based authentication and allows only `/library` or `/reset-password` destinations. It never follows arbitrary `next` URLs.

Open the email link in the same browser/device that requested it, because that browser holds the PKCE verifier. A new request can invalidate the earlier browser verifier; use the latest email. Expired, used or mismatched-browser recovery links offer a fresh request. The reset form and server action verify the current user before calling `updateUser`; no administrator key or user ID supplied by a browser is used. After a confirmed password change, the app requests global sign-out and sends the user to sign in again. Global sign-out revokes refresh sessions; already-issued access JWTs may remain valid until their expiry.

Check **Authentication → Emails / SMTP** before opening registration to other people. Supabase’s default sender has restrictions and low email limits; configure a custom SMTP provider for reliable public production delivery. Do not disable email confirmation to work around delivery problems. The dashboard was checked and currently uses default templates with no custom SMTP configured. No SMTP credentials or provider have been configured by this change.

Official references: [Password-based Auth](https://supabase.com/docs/guides/auth/passwords), [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## User-run release checks

The local recovery email, password update and sign-in with the new password were confirmed by the user. Repeat on the deployed origin; the checks below are not all implied by that local result.

1. Run `npm run build` after these authentication changes.
2. On the deployed origin, request a password reset for your existing account.
3. Open the latest email in the same browser, enter and confirm a new password privately, and submit it yourself.
4. Confirm the app returns to Sign In and the new password works; verify the old password no longer works.
5. Reopen the used link and check the retry message. Verify an invalid callback does not grant account access.
6. Test a fresh sign-up and confirmation on the deployed domain, then sign-out/sign-in and session persistence.
7. Check email delivery to an intended recipient after configuring production email delivery.

Agent checks can validate forms, routing guards and mocked update/sign-out behaviour. Actual password entry and submission are user-run; passwords must never be pasted into chat.
