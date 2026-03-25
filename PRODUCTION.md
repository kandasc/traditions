## Production deployment (Docker + Postgres)

This app is production-ready via Docker. You’ll run:
- Postgres
- Next.js server (`next start`)
- Prisma migrations on startup (`prisma migrate deploy`)

### 1) Provision a server
Any Ubuntu VPS works (Hetzner / DigitalOcean / AWS Lightsail).

Install Docker + Compose.

### 2) Create an `.env.prod`
Create a file `traditions/.env.prod` (do **not** commit it) with:

```env
# Public URL
NEXTAUTH_URL="https://YOUR_DOMAIN"

# Generate a long random secret
NEXTAUTH_SECRET="CHANGE_ME"

# Postgres password (used by compose)
POSTGRES_PASSWORD="CHANGE_ME"

# AI (optional)
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4.1-mini"

# SayelePay
SAYELEPAY_API_BASE="https://api.sayelepay.com"
SAYELEPAY_API_KEY="..."
SAYELEPAY_SECRET="..."
SAYELEPAY_MERCHANT_ID="Traditions"
SAYELEPAY_INIT_PATH="https://api.sayelepay.com/api/v1/payment-intents"

# If the init response is a PaymentIntent without checkoutUrl, SayelePay usually
# gives a separate hosted URL pattern — ask them, then e.g.:
# SAYELEPAY_HOSTED_CHECKOUT_TEMPLATE="https://…?payment_intent={id}&client_secret={client_secret}"
```

### 3) Build + run

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

App will be on port `3000`. Put Nginx/Caddy in front for TLS.

### 4) First admin login
For production, **change** the seeded admin password strategy (or add a “create admin” screen).
Right now the seed creates `admin@local / admin123` only when you run `prisma db seed`.

If you want to seed production content:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec web npx prisma db seed
```

### 5) Backups
Back up the Postgres volume `traditions_pgdata` (or use a managed Postgres).

