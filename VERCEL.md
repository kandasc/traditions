## Deploy to Vercel

### 1) Create a hosted Postgres
Use Neon / Supabase / Railway Postgres (any managed Postgres works).

You will need a connection string like:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"
```

### 2) Push to GitHub
Vercel deploys from a Git repo. Push `traditions/` to GitHub (or import the folder into a repo).

### 3) Create a Vercel project
- Import the repo into Vercel
- **Root Directory**: `traditions`
- Framework: Next.js (auto-detected)

### 4) Configure environment variables (Vercel → Project → Settings → Environment Variables)

Required:
- `DATABASE_URL`
- `NEXTAUTH_SECRET` (generate a long random string)
- `NEXTAUTH_URL` = `https://YOUR_PROD_DOMAIN`

Payments:
- `SAYELEPAY_API_BASE`
- `SAYELEPAY_API_KEY`
- `SAYELEPAY_SECRET`
- `SAYELEPAY_MERCHANT_ID`
- `SAYELEPAY_INIT_PATH`

AI (optional):
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

### 5) Deploy
This repo includes a `vercel-build` script:

```json
"vercel-build": "prisma migrate deploy && prisma generate && next build"
```

So Vercel will automatically apply Prisma migrations during build.

### Notes
- The image proxy (`/api/image`) does **not** rely on disk caching on Vercel. It sets long `Cache-Control` headers so the CDN can cache results.
- For webhooks, ensure your production URL is reachable publicly: `POST /api/webhooks/sayelepay`.

