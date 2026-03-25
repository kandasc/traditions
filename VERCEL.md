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

Payments:
- `SAYELEPAY_API_BASE`
- `SAYELEPAY_API_KEY`
- `SAYELEPAY_SECRET`
- `SAYELEPAY_MERCHANT_ID`
- `SAYELEPAY_INIT_PATH` (full URL or path; e.g. `https://api…/api/v1/payment-intents`)
- `SAYELEPAY_RESPONSE_URL_KEY` (optional) — dotted path to the redirect URL if auto-detection fails, e.g. `data.checkout_link`
- `SAYELEPAY_HOSTED_CHECKOUT_TEMPLATE` (often **required**) — if the API returns a Stripe-like **PaymentIntent** (`id`, `client_secret`) without a URL, set the **public** payment page URL from SayelePay. Placeholders: `{id}`, `{client_secret}`, `{reference}` (URL-encoded); `{id_raw}`, `{client_secret_raw}`, `{reference_raw}` without encoding.

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

