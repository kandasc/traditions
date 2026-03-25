## Deploy to Vercel

### 1) Create a hosted Postgres
Use Neon / Supabase / Railway Postgres (any managed Postgres works).

You will need two URLs (Neon and most hosts: **pooled** for the app, **direct** for migrations):

```env
# Pooled / serverless-friendly (often includes -pooler or ?pgbouncer=true)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public&sslmode=require"

# Non-pooled — required by Prisma for `migrate deploy` (see schema `directUrl`)
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public&sslmode=require"
```

Copy both from the Neon dashboard (Connection string → pooled vs direct).

### 2) Push to GitHub
Vercel deploys from a Git repo. Push `traditions/` to GitHub (or import the folder into a repo).

### 3) Create a Vercel project
- Import the repo into Vercel
- **Root Directory**: `traditions`
- Framework: Next.js (auto-detected)

### 4) Configure environment variables (Vercel → Project → Settings → Environment Variables)

Required:
- `DATABASE_URL`
- `DIRECT_URL` (same database, **direct** connection — without PgBouncer on the migration path)
- `NEXTAUTH_SECRET` (generate a long random string)
- `NEXTAUTH_URL` = `https://YOUR_PROD_DOMAIN`

Payments (SayelePay — [API docs](https://www.sayelepay.com/api-docs), [SDK / checkout](https://www.sayelepay.com/sdk)):
- `SAYELEPAY_API_BASE` — e.g. `https://api.sayelepay.com/api/v1` ([base URL in docs](https://www.sayelepay.com/api-docs))
- `SAYELEPAY_API_KEY` — secret key `sk_test_…` / `sk_live_…` ([Authentication](https://www.sayelepay.com/api-docs))
- `NEXT_PUBLIC_SAYELEPAY_PUBLISHABLE_KEY` — **required for browser checkout**: `pk_test_…` / `pk_live_…` (used by `SayeleGateSDK` + `client_secret` from `POST /payment-intents`)
- `NEXT_PUBLIC_SAYELEPAY_GATE_ORIGIN` (optional) — SayelePay **hosted checkout** host, **origin only** (no path). Default `https://api.sayelepay.com` — the SDK redirects to `{origin}/checkout?...`. Without this, SayelePay’s JS wrongly used your own domain and clients never left your site.
- `SAYELEPAY_SECRET` — webhook signature (if configured)
- `SAYELEPAY_MERCHANT_ID` (optional)
- `SAYELEPAY_INIT_PATH` (optional) — default `/payment-intents` relative to `SAYELEPAY_API_BASE`
- `SAYELEPAY_PAYMENT_METHOD_TYPES` (optional) — JSON array, default `["card","mobile_money"]`
- `SAYELEPAY_RESPONSE_URL_KEY` (optional) — dotted path if the API returns a direct redirect URL
- `SAYELEPAY_HOSTED_CHECKOUT_TEMPLATE` (optional) — only if you use a custom hosted URL instead of the SDK

AI (optional):
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Admin uploads (product images from disk):
- `BLOB_READ_WRITE_TOKEN` — Vercel → Storage → **Blob**; attach the store to the project so this token is set. Without it, the editor still accepts **image URLs** (paste only).

### 5) Deploy
This repo includes a `vercel-build` script that runs migrations **before** `next build`:

```json
"vercel-build": "prisma migrate deploy && prisma generate && next build"
```

**Important:** Vercel’s default for Next.js is `npm run build` (which is only `next build`). In the project **Settings → General → Build & Development Settings**, set **Build Command(s)** to:

`npm run vercel-build`

Otherwise Prisma migrations (including `HeroSlide` and future tables) never run on production.

### Notes
- The image proxy (`/api/image`) does **not** rely on disk caching on Vercel. It sets long `Cache-Control` headers so the CDN can cache results.
- For webhooks, ensure your production URL is reachable publicly: `POST /api/webhooks/sayelepay`.

