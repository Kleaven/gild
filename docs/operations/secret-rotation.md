# Secret Rotation

All secrets live in `.env.local` (local), Vercel environment variables (staging/prod), and the Supabase dashboard. **Never commit secrets to git.**

---

## Rotation Schedule

| Secret | Rotate | Trigger |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Annually or on suspected leak | Immediately on leak |
| `SUPABASE_JWT_SECRET` | Never (rotates all sessions) | Only if JWT signing key is compromised |
| `STRIPE_SECRET_KEY` | Annually | On leak or key compromise |
| `STRIPE_WEBHOOK_SECRET` | When webhook endpoint changes | Redeploy webhook endpoint |
| `RESEND_API_KEY` | Annually | On leak |
| `UPSTASH_REDIS_REST_TOKEN` | Annually | On leak |
| `CLOUDFLARE_STREAM_API_TOKEN` | Annually | On leak |
| `NEXTAUTH_SECRET` | N/A — not used (Supabase Auth only) | — |

---

## Rotating Supabase Service Role Key

The service role key cannot be regenerated in isolation — rotating it requires generating a new JWT via the JWT secret.

**If only the key is suspected leaked (JWT secret intact):**

1. Go to **Settings → API** → click the eye icon to reveal the service role key.
2. There is currently no single-key rotation UI — open a Supabase support ticket or rotate the JWT secret (see below) which invalidates all derived keys.

**If the JWT secret is compromised:**

1. **Settings → API → JWT Secret → Regenerate**.
2. This immediately invalidates all existing JWTs (all users are signed out).
3. Update `SUPABASE_JWT_SECRET`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel and `.env.local`.
4. Redeploy all services.

---

## Rotating Stripe Keys

1. In the Stripe dashboard go to **Developers → API keys**.
2. Click **Roll key** next to the secret key — the old key stays active for 24 hours.
3. Update `STRIPE_SECRET_KEY` in Vercel and `.env.local`, then redeploy.
4. Confirm the old key window closes after 24 hours or revoke it manually.

**Webhook secret** — generated per endpoint. To rotate:

1. Delete the existing webhook endpoint in **Developers → Webhooks**.
2. Add a new endpoint with the same URL.
3. Copy the new signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.

---

## Rotating Resend API Key

1. In the Resend dashboard go to **API Keys → Create API key** (full access, or restrict to sending only).
2. Update `RESEND_API_KEY` in Vercel and `.env.local`, then redeploy.
3. Delete the old key.

---

## Rotating Upstash Redis Token

1. In Upstash console → your database → **Details** → **Reset Token**.
2. Update `UPSTASH_REDIS_REST_TOKEN` in Vercel and `.env.local`, then redeploy.

---

## Rotating Cloudflare Stream Token

1. In the Cloudflare dashboard → **My Profile → API Tokens → Create Token**.
2. Scope to Cloudflare Stream read/write for the specific account.
3. Update `CLOUDFLARE_STREAM_API_TOKEN` in Vercel and `.env.local`, then redeploy.
4. Revoke the old token.

---

## Vercel Environment Variable Update Procedure

```bash
# List current env vars
vercel env ls

# Add or update a variable (prompts for value, environment, branch)
vercel env add SECRET_NAME

# Remove old variable if renaming
vercel env rm OLD_SECRET_NAME
```

After updating Vercel env vars, trigger a redeploy:

```bash
vercel --prod   # or push a commit to trigger CI
```

---

## Checklist After Any Rotation

- [ ] Updated in Vercel (staging and prod separately)
- [ ] Updated in local `.env.local`
- [ ] Old credential revoked / invalidated
- [ ] Smoke-tested auth, payments, and email in staging before prod
- [ ] Rotation event logged in your incident tracker with date and reason
