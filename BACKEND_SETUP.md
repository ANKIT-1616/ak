# A_KON contact backend

This backend uses a Cloudflare Worker, Supabase Auth/Postgres, and an optional Resend notification. It does not include a paid plan, paid API, custom domain purchase, automatic billing upgrade, or frontend database secret.

## What is implemented

- The public contact form submits enquiries to this backend, then offers the visitor a pre-filled draft in their selected email or WhatsApp application.
- `POST /api/enquiries`: validates the complete enquiry on the server, applies an IP-based Worker rate limit and honeypot, and stores the enquiry.
- `submissionId` is unique in Postgres. Retrying the same form request returns the existing enquiry instead of inserting a duplicate.
- If all Resend settings are configured, an email notification is sent to the studio address. Provider acceptance is recorded separately from confirmed email delivery. A provider failure does not undo the saved enquiry.
- `/admin`: Supabase email/password sign-in, user-ID allowlist enforcement in the Worker, private enquiry list, total/status counts, status updates, and permanent deletion.
- All admin database access goes through the Worker. RLS is enabled with no `anon` or `authenticated` table policies or grants.
- Admin access tokens are held in memory and discarded on page reload/sign-out.

## Free-plan and cost boundaries

| Service | Use in this project | Cost control |
|---|---|---|
| Cloudflare Workers Free | API hosting and built-in rate limiting | Cloudflare documents 100,000 Worker requests/day on Free. The API uses the built-in Rate Limiting binding, not a paid database/cache add-on. Free-plan limits can make requests fail; do not upgrade the account. |
| Supabase Free | Postgres and Auth | The current pricing page lists $0/month, 50,000 monthly active users, 500 MB database, 5 GB egress, and a 1-week inactivity pause (limits can change). No paid Supabase feature is required. |
| Resend Free (optional) | Studio notification only | Not required for enquiry storage or admin. Its pricing page lists a free-forever plan, but no Resend account is needed for the base deployment. Configure only if the current free plan supports your use without a required payment method and you already have a verified sender domain. |
| WhatsApp Click-to-Chat | Visitor-selected direct message | Uses the visitor's WhatsApp app; no WhatsApp Business API or paid integration is used. |

Free-plan quotas are not unlimited, and availability/limits can change. On Cloudflare Free, the rate limit is 5 contact API requests per minute per IP, approximate and applied per Cloudflare location; it is a useful spam control, not a strict global security boundary. The public endpoint additionally validates all submitted values, checks an empty honeypot, applies idempotency, and rejects non-allowlisted browser origins.

This code does not configure a payment method or upgrade a plan. At setup, keep each account on its Free plan and do not enable paid features. If a provider makes a payment method, subscription, or purchase necessary to create/use the Free account in your region, stop rather than continue. No hosting provider can guarantee the provider's future pricing or your account eligibility.

The official pricing/terms pages should be rechecked before deployment and periodically afterward:

- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) · [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) · [Rate Limiting API](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) · [Self-Serve Subscription Agreement](https://www.cloudflare.com/terms/)
- [Supabase pricing](https://supabase.com/pricing) · [Supabase billing documentation](https://supabase.com/docs/guides/platform/billing-on-supabase) · [Supabase terms](https://supabase.com/terms/)
- [Resend pricing](https://resend.com/pricing) · [Resend terms](https://resend.com/terms-of-service)

Commercial use must comply with each provider's current acceptable-use policies and service terms. This implementation uses only the providers' standard hosted APIs; it does not grant rights to any provider service or override account-specific terms. This is not legal advice.

## 1. Create Supabase project and schema

1. Create a Supabase project and keep it on the Free plan.
2. Open **SQL Editor**, paste and run [`supabase/migrations/20261031000000_create_enquiries.sql`](./supabase/migrations/20261031000000_create_enquiries.sql).
3. In **Authentication → Users**, create the studio admin account yourself. Do not expose a sign-up link. Copy its immutable user UUID; that exact UUID is allowlisted by the Worker.
4. In project API settings, copy the project URL, public anon/publishable key, and server-only service-role key. The service-role key is needed because the Worker is the only service permitted to write/read private rows. It must never be placed in a `VITE_` variable or frontend source.
5. Keep Auth email/password sign-in enabled for the admin. Public users may be able to create Supabase Auth accounts depending on project settings, but they still cannot access this table or the admin API without the allowlisted user UUID.

The migration has no direct client policies. Even an authenticated Supabase user cannot query or change enquiry rows directly. The Worker service role bypasses RLS only on the server.

## 2. Configure and run locally

1. Copy `.env.example` to `.env` and set:
   - `VITE_API_BASE_URL=http://127.0.0.1:8787`
   - `VITE_SUPABASE_URL` to the project URL.
   - `VITE_SUPABASE_ANON_KEY` to the public anon/publishable key. This key is intentionally public; RLS prevents it accessing enquiry rows.
2. Copy `backend/.dev.vars.example` to `backend/.dev.vars` and set the matching Supabase project URL, public anon key, service-role key, and admin user UUID. Keep `.dev.vars` private; it is ignored by Git.
3. In `backend/wrangler.toml`, keep `ALLOWED_ORIGINS` set to the exact local site origin (`http://localhost:3000`).
4. In separate terminals, run `npm run worker:dev` and `npm run dev`. The Worker listens on port 8787; Vite is configured for port 3000.
5. Open `/admin` and sign in using the Supabase user created above. Try a test enquiry and confirm it appears in the dashboard.

Do not use production customer data for local tests. Delete any test enquiry from the admin dashboard when finished.

## 3. Deploy the Worker on Cloudflare Free

1. Create a Cloudflare account and stay on Workers Free.
2. Choose a positive integer `namespace_id` in `backend/wrangler.toml` that is unique among your account's Worker rate-limit bindings. It is an identifier, not a secret.
3. Change `ALLOWED_ORIGINS` to the exact HTTPS origin serving the portfolio (no path or trailing slash). Include a comma-separated local origin only if needed. Do not use `*`.
4. Authenticate Wrangler with `npx wrangler login`.
5. Add Worker secrets. Wrangler prompts for each value; paste it only into the prompt, not into source code or a committed file:

   ```powershell
   npx wrangler secret put SUPABASE_URL --config backend/wrangler.toml
   npx wrangler secret put SUPABASE_ANON_KEY --config backend/wrangler.toml
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config backend/wrangler.toml
   npx wrangler secret put ADMIN_USER_ID --config backend/wrangler.toml
   ```

6. Deploy with `npm run worker:deploy`. Copy the resulting `https://akon-contact-api.<your-account>.workers.dev` URL.
7. In Vercel, open **Project → Settings → Environment Variables**. Add the following to the Production environment (and Preview too, if preview deployments should use the Worker). Any preview origin used with the Worker must also be listed exactly in `ALLOWED_ORIGINS`; do not use a wildcard.
   - `VITE_API_BASE_URL` = the Worker base URL, with no trailing slash or `/api/enquiries`.
   - `VITE_SUPABASE_URL` = the Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY` = the public anon/publishable key.

   These `VITE_` values are included in the browser build; only the Supabase URL and public anon key belong there. Never add `SUPABASE_SERVICE_ROLE_KEY` or other server secrets to Vercel's frontend environment.
8. Trigger a new Vercel deployment after setting the variables. Vite embeds them at build time, so changing a Vercel variable does not update an already-deployed bundle.
9. Request `GET https://<worker-url>/api/health` from the portfolio origin. A healthy response reports `{ "ok": true, "configured": true }` only after it can reach the Supabase enquiries table.

The Worker rate limiter is 5 contact API requests per minute per IP, applied approximately per Cloudflare location. The limit can briefly be exceeded across locations. Keep the Worker on the Free plan; requests beyond Free limits may fail, but this code does not enable or require a paid upgrade.

## 4. Optional Resend notification

Enquiries are stored even when email notifications are disabled. The Worker attempts a studio notification only when **all** three values are set:

- `RESEND_API_KEY` — add using `npx wrangler secret put RESEND_API_KEY --config backend/wrangler.toml`.
- `RESEND_FROM_EMAIL` — a sender address on a domain already verified with Resend.
- `NOTIFICATION_TO_EMAIL` — the studio inbox for new-enquiry alerts.

Set `RESEND_FROM_EMAIL` and `NOTIFICATION_TO_EMAIL` in the Worker variables in Cloudflare's dashboard, or add them to the `[vars]` block in `backend/wrangler.toml` before deploy.

The email is an alert to the studio, not an automatic reply to the visitor. The API marks an alert as **accepted** only after Resend returns an email ID. That does not prove delivery to the mailbox; delivery receipts/webhooks are not configured. If Resend is not fully configured or returns an error, the database enquiry remains saved and the site reports that alert status honestly. Do not buy a domain, enable a paid tier, or add a billing method for this optional integration.

## Environment variable reference

| Name | Where | Secret? | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | Frontend build environment | No | Deployed Worker base URL. |
| `VITE_SUPABASE_URL` | Frontend build environment | No | Supabase Auth project URL. |
| `VITE_SUPABASE_ANON_KEY` | Frontend build environment | No | Public Auth client key; database access remains denied by RLS. |
| `ALLOWED_ORIGINS` | `backend/wrangler.toml` | No | Exact, comma-separated portfolio origins allowed by CORS. |
| `SUPABASE_URL` | Worker secret / local `.dev.vars` | No, but keep server config private | Supabase project URL used by the Worker. |
| `SUPABASE_ANON_KEY` | Worker secret / local `.dev.vars` | No | Supabase Auth user-verification key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker secret / local `.dev.vars` | **Yes** | Server-only database access key; never expose to a browser. |
| `ADMIN_USER_ID` | Worker secret / local `.dev.vars` | Treat as private config | Only this Supabase Auth user UUID can administer enquiries. |
| `RESEND_API_KEY` | Optional Worker secret | **Yes** | Optional provider API key. |
| `RESEND_FROM_EMAIL` | Optional Worker config | No | Verified Resend sender. |
| `NOTIFICATION_TO_EMAIL` | Optional Worker config | No | Studio alert recipient. |

## Operations and privacy

- The API stores only enquiry fields and timestamps; request IPs are not written to Postgres. The rate-limit key is a SHA-256 digest of the Cloudflare-provided client IP.
- Admin endpoints return `Cache-Control: no-store`; no access tokens are saved in browser storage.
- The delete action permanently deletes the selected record.
- No migration rollback is automatic. Export any data you need before deleting the Supabase project.
- There is no backend email-to-visitor feature, WhatsApp Business API, analytics, file upload, or payment collection.
