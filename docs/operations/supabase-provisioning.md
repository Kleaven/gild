# Supabase Provisioning

Two cloud projects are required: **gild-staging** and **gild-prod**.
Local dev runs via `supabase start` using `supabase/config.toml`; this document covers cloud provisioning only.

---

## 1. Create Cloud Projects

On [supabase.com/dashboard](https://supabase.com/dashboard):

1. **New project** → name `gild-staging`, region closest to your Vercel deployment region, generate a strong database password (save it — you will not see it again).
2. Repeat for `gild-prod`.
3. For each project go to **Settings → General** and note the **Project Reference ID** (e.g. `abcdefghijklmnop`).

> Do **not** use the free tier for prod — use at minimum the Pro plan so you get daily backups and no pausing.

---

## 2. Collect Credentials

For each project go to **Settings → API**:

| Variable | Where to find |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (e.g. `https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key — treat as a root secret |
| `SUPABASE_JWT_SECRET` | Settings → API → JWT Secret |

For the Postgres connection strings go to **Settings → Database → Connection string**:

| Variable | Which string |
|---|---|
| `DATABASE_URL` | **Transaction pooler** URI (port 6543) — used by postgres-js at runtime |
| `DIRECT_URL` | **Direct connection** URI (port 5432) — used only for migrations |

Append `?pgbouncer=true` to `DATABASE_URL` and `sslmode=require` to both if not already present.

---

## 3. Link CLI to Each Project

```bash
# staging
supabase link --project-ref <staging-ref>
# enter the DB password you saved in step 1

# to switch to prod later
supabase link --project-ref <prod-ref>
```

The CLI stores the linked ref in `supabase/.temp/project-ref`. **Never commit that file** (already in `supabase/.gitignore`).

---

## 4. Enable Required Auth Providers

In the Supabase dashboard for each project → **Authentication → Providers**:

- **Email**: enabled (email confirmations off for now, will be toggled on in Step 50 when Resend is wired).
- **Google OAuth**: disabled until Step 19.
- **Anonymous sign-ins**: keep disabled.

---

## 5. Set Auth Site URL

**Authentication → URL Configuration**:

| Project | Site URL | Redirect URLs |
|---|---|---|
| gild-staging | `https://gild-staging.vercel.app` | `https://gild-staging.vercel.app/**` |
| gild-prod | `https://yourdomain.com` | `https://yourdomain.com/**` |

Also add `http://localhost:3000` and `http://127.0.0.1:3000` to redirect URLs for both projects during development.

---

## 6. Network Restrictions (Prod Only)

**Settings → Database → Network Restrictions**:

Restrict to your Vercel egress CIDR ranges and your developer IPs. Leave staging open for now.

---

## 7. Push First Migration

Once the CLI is linked and `.env.local` is populated (see `.env.example`):

```bash
# dry-run
supabase db push --dry-run

# push
supabase db push
```

Migrations live in `supabase/migrations/` and are the sole schema owner — never modify the schema via the dashboard SQL editor in prod.

---

## 8. Verify

```bash
supabase status          # shows local stack ports
supabase db diff         # should show empty diff after push
```

In the dashboard: **Table Editor** should show all tables; **Authentication → Users** should be empty.
