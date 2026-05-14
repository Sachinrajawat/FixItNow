# Deploying FixItNow to production

This guide takes the repo from a fresh fork to a live URL in roughly
**30 minutes of clicking** — no terminal commands once the providers are
linked.

## Topology

```
            ┌──────────────────────┐
            │  Vercel (Web)        │
            │  apps/web · Next 14  │  ──► public URL (HTTPS, free tier)
            └──────────┬───────────┘
                       │ NEXT_PUBLIC_API_URL
                       ▼
            ┌──────────────────────┐
            │  Render (API)        │
            │  apps/api · Docker   │
            └──────────┬───────────┘
              MONGO_URI│ │REDIS_URL
                       ▼ ▼
       ┌──────────────────┐  ┌──────────────────┐
       │  MongoDB Atlas   │  │  Upstash Redis   │
       │  free M0 cluster │  │  free 10k/day    │
       └──────────────────┘  └──────────────────┘
```

All four services have free tiers that cover a demo deployment.

---

## 1) MongoDB Atlas (5 min)

1. Sign up at [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register).
2. Create a **free M0** cluster. Pick any region close to your users.
3. **Database Access** → "Add new database user". Use a strong password.
4. **Network Access** → "Add IP address" → **Allow access from anywhere**
   (`0.0.0.0/0`). For production you'd restrict this to Render's egress IPs,
   but for a demo this is fine.
5. Click **Connect** → "Drivers" → copy the connection string. It will look
   like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Important**: append your database name before the `?` so Mongoose uses
   the right DB:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/fixitnow?retryWrites=true&w=majority
   ```
   Save this — it's your `MONGO_URI`.

---

## 2) Upstash Redis (3 min)

1. Sign up at [upstash.com](https://upstash.com) (use GitHub OAuth).
2. **Create database**. Region: same continent as your Render service.
3. On the database details page, switch to the **Connection** tab.
4. Copy the **Redis** URL (starts with `rediss://` — note the double `s`,
   it's TLS).
5. Save this — it's your `REDIS_URL`.

> Tip: the URL already includes credentials. Treat it like a password.

---

## 3) Render — deploy the API (10 min)

The repo ships a [`render.yaml`](./render.yaml) blueprint, so Render will
configure the service for you.

1. Sign up at [render.com](https://render.com) (use GitHub OAuth).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub fork of this repo.
4. Render will detect `render.yaml` and show a service named
   `fixitnow-api` with a list of env vars. Fill in:
   - `MONGO_URI` — the one from step 1
   - `REDIS_URL` — the one from step 2
   - `CORS_ORIGIN` — **leave blank for now**; we'll set it once Vercel
     gives us a URL.
   - `SENTRY_DSN` — leave blank unless you want server-side Sentry.
5. The two `JWT_*_SECRET` values are auto-generated; do **not** modify
   them.
6. Click **Apply**. Render builds the Docker image (~5 min), then starts
   the service. You'll get a public URL like:
   ```
   https://fixitnow-api.onrender.com
   ```
7. **Smoke test**:
   ```bash
   curl https://fixitnow-api.onrender.com/healthz
   # → {"status":"ok","uptime":12.34}
   curl https://fixitnow-api.onrender.com/readyz
   # → {"status":"ok","checks":{"mongo":"up","redis":"up"}}
   ```
   If `mongo` or `redis` shows `down`, re-check the URI/URL in Render's
   env settings.

### Seed the production database (optional)

The seed script is intentionally idempotent. The fastest way is
locally, pointed at your Atlas cluster:

```bash
cd apps/api
MONGO_URI="<your Atlas URI>" REDIS_URL="<your Upstash URL>" npm run seed
```

This inserts 8 categories, 3 demo users (`admin@fixitnow.dev` /
`Admin#12345`, `demo@fixitnow.dev` / `Demo#12345`,
`owner@fixitnow.dev` / `Owner#12345`), 12 businesses, and a handful of
reviews. **Rotate those passwords before sharing the URL publicly.**

---

## 4) Vercel — deploy the web (5 min)

1. Sign up at [vercel.com](https://vercel.com) (GitHub OAuth).
2. **Add New** → **Project** → import your GitHub fork.
3. Vercel detects Next.js automatically. Override the **Root Directory**
   to `apps/web`.
4. Under **Environment Variables**, add:
   | Key | Value |
   | ------------------------- | ----------------------------------------------- |
   | `NEXT_PUBLIC_API_URL` | `https://fixitnow-api.onrender.com` (from step 3) |
   | `NEXT_PUBLIC_SITE_URL` | `https://fixitnow.vercel.app` (or your custom domain) |
   | `NEXT_PUBLIC_SENTRY_DSN` | optional |
5. Click **Deploy**. First build takes 2–3 minutes.
6. Vercel gives you a URL like `https://fixitnow.vercel.app`. **Copy it.**

---

## 5) Close the loop — set `CORS_ORIGIN` on Render

1. Back in Render, open the `fixitnow-api` service.
2. **Environment** → edit `CORS_ORIGIN` → paste the Vercel URL exactly,
   without a trailing slash:
   ```
   https://fixitnow.vercel.app
   ```
   If you've attached a custom domain, comma-separate both:
   ```
   https://fixitnow.vercel.app,https://www.yourdomain.com
   ```
3. Save. Render redeploys automatically (~30s).

---

## 6) End-to-end smoke (5 min)

Visit the Vercel URL and walk through:

1. **Home** loads with categories + businesses (Atlas/Upstash are warm).
2. **Sign up** with a fresh email — should land you back on `/` logged in.
3. **Search** for a category — list filters.
4. **Details** page for a business — Reviews section + Book button visible.
5. **Book** a slot — confirmation toast, then visible under **My bookings**.
6. **Cancel** the booking — moves to the "Past" tab.
7. **Sitemap**: `https://<your-vercel-url>/sitemap.xml` — should list
   categories + businesses.
8. **Robots**: `https://<your-vercel-url>/robots.txt` — should disallow
   `/admin` and `/mybooking`.

If steps 1 and 2 work but **booking** fails with a CORS error, double-check
the `CORS_ORIGIN` value on Render — it must match the protocol + host
**exactly** that the browser sends. No trailing slash.

---

## 7) Production hardening — recommended next

| Action                                              | Why                                                         |
| --------------------------------------------------- | ----------------------------------------------------------- |
| Rotate the seeded demo passwords                    | Default credentials are committed in `seed.ts`              |
| Restrict Atlas Network Access to Render's egress IP | `0.0.0.0/0` is fine for demos but not for real data         |
| Add a Render custom domain (api.yourdomain.com)     | Removes the `.onrender.com` cold-start latency reputation   |
| Add a Vercel custom domain                          | Same                                                        |
| Enable Sentry source-map upload (CI secret)         | Production stack traces are useless without source maps     |
| Set up a UptimeRobot ping on `/readyz`              | Render's free tier sleeps idle services; pings keep it warm |

---

## Troubleshooting

| Symptom                                                          | Likely cause                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `/readyz` shows `mongo: down`                                    | `MONGO_URI` missing the DB name (must contain `/fixitnow`)                                  |
| `/readyz` shows `redis: down`                                    | `REDIS_URL` is `redis://` instead of `rediss://` (Upstash needs TLS)                        |
| Browser console: `CORS policy: No 'Access-Control-Allow-Origin'` | `CORS_ORIGIN` on Render doesn't exactly match Vercel URL                                    |
| Booking 401s after login                                         | `NEXT_PUBLIC_API_URL` on Vercel points at a different origin from the refresh cookie domain |
| Render service "spinning up" on every request                    | Free tier sleeps after 15 min idle — upgrade plan or add a pinger                           |
| `next build` fails on Vercel: "env var missing"                  | Vercel env vars are scoped per environment; pick "All Environments"                         |
