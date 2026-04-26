# Gild — Project Context for Claude Code

## What This Is
Gild is a premium community SaaS platform competing with Skool and Circle.
- Community owners pay $29/mo (Starter) or $59/mo (Pro)
- 0% transaction fees ever
- Members pay nothing to Gild
- 14-day trial, card required, one-click cancel
- USD pricing globally

## Current Status
- Product name: Gild
- Local folder: /Users/ngzc/Documents/comy/
- GitHub repo: github.com/Kleaven/gild
- Active branch: main

## Tech Stack
- Next.js 15, App Router, TypeScript strict mode
- Supabase (postgres-js + generated types, NO Prisma)
- Stripe for payments
- Resend for email
- Upstash Redis for rate limiting
- Cloudflare Stream for video
- Vercel for deployment

## Architecture Decisions (locked)
- Prisma dropped — postgres-js + Supabase generated types only
- supabase/migrations is sole schema owner
- No NextAuth — Supabase Auth only
- No auth shim — atomic 18-call-site swap
- Multi-tenancy via RLS on single Supabase database
- lib/community/ grouped until 500+ LoC
- Dashboard analytics on-demand at launch
- Marketing via route group not separate domain

## Permission Hierarchy
1. Platform admin (WebAuthn only)
2. Community owner
3. Community admin
4. Community moderator
5. Tier 2 member
6. Tier 1 member
7. Free member
8. Banned member
9. Unauthenticated visitor

## Dependency Direction Rule
app/ imports from lib/*
lib/* imports from supabase/
NEVER: lib/* imports from app/
NEVER: lib/billing imports from lib/courses except types

## Three Priority Gates
GATE 1: RLS test suite closes at Step 26
GATE 2: Webhook idempotency harness closes at Step 28
GATE 3: Platform admin WebAuthn closes at Step 30
No Phase 4 work before all three gates closed.

## Migration Sequence

### Phase 0 — Foundation
Step 1: Repository scaffold — COMPLETE
Step 2: Supabase project provisioning — COMPLETE
Step 3: Environment variable contract + zod validator — COMPLETE
Step 4: postgres-js client + Supabase types pipeline — COMPLETE
Step 5: CI pipeline skeleton — COMPLETE
Step 6: ESLint + boundaries enforcement — COMPLETE

### Phase 1 — Database
Step 7: Migration 00000 extensions + schemas
Step 8: Migrations 00001-00007 identity/tenancy/content
Step 9: Migrations 00008-00012 votes/courses/quizzes
Step 10: Migrations 00013-00021 enrollments/certs/admin/ops
Step 11: Migration 00022 app_auth helper functions
Step 12: Migrations 00023-00026 security definer RPCs
Step 13: Migrations 00027-00060 RLS policies
Step 14: Migration 00061 tsvector search
Step 15: Seed data
Step 16: Delete prisma/ and dev.db

### Phase 2 — Auth
Step 17: lib/auth/ skeleton
Step 18: Supabase Auth + sign-in/sign-up/sign-out
Step 19: Google OAuth
Step 20: WebAuthn module
Step 21: Atomic NextAuth to Supabase swap (18 files)
Step 22: NextAuth removal
Step 23: lib/permissions/ scaffold

### Phase 3 — Security Gates
Step 24: supabase/tests/ harness
Step 25: GATE 1 part A positive RLS
Step 26: GATE 1 part B negative tests
Step 27: lib/billing/ + Stripe client
Step 28: GATE 2 webhook harness
Step 29: GATE 3 part A WebAuthn E2E
Step 30: GATE 3 part B bootstrap admin

### Phase 4 — Core Features
Step 31: lib/ranking/ and lib/pagination/
Step 32: lib/markdown/
Step 33: lib/rate-limit/ with Upstash
Step 34: lib/feed/ and lib/comments/
Step 35: lib/search/
Step 36: lib/community/ modules
Step 37: Server actions delegate to lib/community
Step 38: Wire routes to lib/*
Step 39: Remove Prisma package

### Phase 5 — Billing
Step 40: Stripe webhook route
Step 41: Stripe catalog
Step 42: Subscription lifecycle
Step 43: Onboarding flow (7 steps)
Step 44: Trial expiry + dunning

### Phase 6 — Courses
Step 45: Course/module/lesson CRUD
Step 46: Cloudflare Stream
Step 47: Drip scheduler
Step 48: Quiz engine
Step 49: Certificates

### Phase 7 — Polish
Step 50: Resend + email templates
Step 51: Realtime subscriptions
Step 52: Creator dashboard
Step 53: PWA + service worker
Step 54: Feature flags
Step 55: Platform admin console

### Phase 8 — Pre-launch
Step 56: G1-G24 all green and required
Step 57: Lighthouse 90+ mobile
Step 58: PDPA export + erasure
Step 59: Realtime load test
Step 60: Penetration test
Step 61: Deploy pipeline
Step 62: Launch readiness

## Rules For Claude Code
1. One step at a time — never start next step without explicit approval
2. After each step report: what changed, DoD result, deviations, manual steps needed
3. Surface conflicts silently resolved is forbidden — always ask
4. All code passes ESLint from day one
5. TypeScript strict, zero any, no exceptions
6. Secrets only in .env.local — never committed
