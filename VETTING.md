# Gild — God-Tier Vetting Protocol v2.0

Every piece of code, SQL, configuration, or architectural decision MUST pass through this protocol before being presented to the founder. No exceptions. You are strictly forbidden from writing unvetted code.

---

## THE PANEL

Simulate a synchronous review from five senior engineers. Each engineer has a specific mandate. If ANY engineer raises a blocking issue, the output is rejected and reworked before presentation.

### 1. Google Staff Engineer — Security & Performance
- Auth bypass, SQL injection, RLS correctness at 10M+ rows.
- SECURITY DEFINER search-path hijacking.
- Secret leakage to client bundles (strict `server-only` enforcement).
- N+1 queries, missing indexes, full table scans.
- Rate limiting and DDoS surface area.

### 2. X (Twitter) Staff Engineer — Consistency & Scale
- Race conditions in concurrent mutations.
- Counter consistency (likes, member counts, enrollment counts).
- Fan-out problems (notifications, feeds).
- Idempotency of all write operations.
- HMR memory leaks in development (Next.js `globalThis` singletons).

### 3. Meta Staff Engineer — Privacy & Compliance
- Multi-tenant data isolation (RLS, FK constraints).
- Permission hierarchy enforcement (9-tier role ladder).
- PII exposure in logs, error messages, or client responses.
- Banned user data visibility.
- Cross-community data leakage.

### 4. Notion Staff Engineer — Architecture & Extensibility
- Schema extensibility (will this break when we add features?).
- API contract correctness (types match runtime behavior).
- Dependency direction violations (app → lib → supabase, NEVER reverse).
- Module boundary violations (lib/billing NEVER imports lib/courses except types).
- Migration idempotency (DROP IF EXISTS before CREATE, CREATE OR REPLACE).

### 5. Vercel Staff Engineer — Next.js 15 & Deployment
- App Router compatibility (Server Components vs. Client Components).
- Next.js 15 Async Request APIs (Ensure `cookies()`, `headers()`, and `params` are ALWAYS `await`ed before access).
- Edge Runtime compatibility (no Node.js-only APIs in edge paths).
- Caching strategy (ISR, revalidation, stale-while-revalidate).
- Build-time vs. runtime validation.

---

## THE CHECKLIST

Every output must satisfy ALL of the following before presentation:

### Code Quality & React
- [ ] TypeScript strict mode — zero `any`, zero `as` casts without written justification.
- [ ] All exports have explicit return types.
- [ ] No `useEffect` used for data fetching (use Server Components or SWR/React Query).
- [ ] Comments explain WHY, not WHAT.
- [ ] Passes `npm run lint` and `npm run typecheck`.

### Security & Database
- [ ] `server-only` import is at the top of EVERY file that touches secrets or Supabase Service Role keys.
- [ ] Every new table has an explicit RLS policy attached. "No Policies" is a hard fail.
- [ ] No `SELECT *` in database queries. Columns must be explicitly listed to prevent PII exposure and over-fetching.
- [ ] `postgres-js` queries utilize generated Supabase types (e.g., `<Database['public']['Tables']['...']>`). No untyped `db.query()`.

### Architecture
- [ ] Dependency direction rule respected.
- [ ] `globalThis` singleton pattern applied for all SDK clients.
- [ ] Environment variables validated via Zod with strict prefix/format checks.
- [ ] New env vars added to: schema, SERVER_KEYS set, browser placeholder, .env.local, .env.example, env.test.ts.

---

## THE PROCESS

For every step, execute sequentially:

1. **RESEARCH** — Read all files that will be touched or depend on the change. Read adjacent files to understand existing patterns. Check the latest documentation for any external dependency being added.
2. **DRAFT** — Write the implementation plan internally.
3. **VET** — Run the draft through all 5 panel engineers. You MUST generate a "Review Log" where each engineer provides a 1-sentence Stamp of Approval citing a specific line of code or logic they verified. Fix all blocking issues internally.
4. **PRESENT** — Show the vetted plan to the founder containing EXACTLY:
   - What changes and why.
   - The Review Log (Engineers' specific citations).
   - Any genuine disagreements surfaced with tradeoffs.
   - **The Failsafe:** The most likely failure mode.
   - **The Kill-Switch:** The exact Git or SQL command required to instantly revert this change if staging breaks.
5. **EXECUTE** — After explicit founder approval, implement exactly as specified.
6. **VERIFY** — Run all relevant checks (typecheck, lint, live queries). Report exact pass/fail counts.
7. **CHECKPOINT** — Local git commit only. Never push.

---

## HARD RULES

1. Never push to git remote — founder controls all pushes.
2. Never touch staging/production databases unless explicitly ordered. Local dev only.
3. Never start the next step without explicit founder approval.
4. Never silently resolve conflicts — always surface them.
5. Never use `pnpm` — always `npm`.
6. Never use Prisma — always `postgres-js` + Supabase generated types.
7. Never use NextAuth — always Supabase Auth.
8. Never use `any` — always explicit types.
9. Never copy-paste without adapting to existing patterns.
10. Never present code that hasn't been vetted through the full panel with a visible Review Log.
11. Never create a database table without an RLS policy.
12. Never fetch data with `useEffect`.
13. Never omit `await` when accessing Next.js 15 request properties (`params`, `searchParams`, `cookies`, `headers`).

---

## VERSION PINNING PROTOCOL

When adding any new dependency:
1. Check the latest stable version via npm/web search.
2. Verify compatibility with the exact stack (Next.js 15, React 19, Node 20).
3. Check bundle size impact.
4. Pin to exact major version with caret (e.g., `^22.0.0`).
5. Document the version choice rationale in the PRESENT phase.
