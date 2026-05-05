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
- Local folder: /Users/ngzc/Documents/gild/
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
Step 7: Migration 00000 extensions + schemas — COMPLETE — COMPLETE
Step 8: Migrations 00001-00007 identity/tenancy/content — COMPLETE
Step 9: Migrations 00008-00012 votes/courses/quizzes — COMPLETE
Step 10: Migrations 00013-00021 enrollments/certs/admin/ops — COMPLETE
Step 11: Migration 00022 app_auth helper functions — COMPLETE
Step 12: Migrations 00023-00026 security definer RPCs — COMPLETE
Step 13A: Migrations 00027-00032 RLS policies — profiles, communities, community_members, membership_tiers, spaces, posts — COMPLETE
Step 13B: Migrations 00033-00038 RLS policies — comments, votes, courses, modules, lessons, enrollments — COMPLETE
Step 13C: Migrations 00039-00044 RLS policies — lesson_progress, certificates, quizzes, quiz_questions, quiz_attempts, notifications — COMPLETE
Step 13D: Migrations 00045-00052 RLS policies — invitations, reports, webhook_events, feature_flags, platform_admins, webauthn_credentials, audit_logs, email_queue — COMPLETE
Step 13: Migrations 00027-00060 RLS policies
Step 14: Migration 00053 tsvector search — COMPLETE
Step 15: Seed data — COMPLETE
Step 16: Delete prisma/ and dev.db — COMPLETE (nothing present; already clean)

### Phase 2 — Auth
Step 17: lib/auth/ skeleton — COMPLETE
Step 18: Supabase Auth + sign-in/sign-up/sign-out — COMPLETE
Step 19: Google OAuth — COMPLETE
Step 20: WebAuthn module — COMPLETE
Step 21: Atomic NextAuth to Supabase swap — COMPLETE (no-op: NextAuth never present)
Step 22: NextAuth removal — COMPLETE (no-op: nothing to remove)
Step 23: lib/permissions/ scaffold — COMPLETE

### Phase 3 — Security Gates
Step 24: supabase/tests/ harness — COMPLETE
Step 25: GATE 1 part A positive RLS — COMPLETE
Step 26: GATE 1 part B negative tests — COMPLETE
Step 27: lib/billing/ + Stripe client — COMPLETE
Step 28: GATE 2 webhook harness — COMPLETE
Step 29: GATE 3 part A WebAuthn E2E — COMPLETE
Step 30: GATE 3 part B bootstrap admin — COMPLETE

### Phase 4 — Core Features
Step 31: lib/ranking/ and lib/pagination/ — COMPLETE
Step 32: lib/markdown/ — COMPLETE
Step 33: lib/rate-limit/ with Upstash - COMPLETE
Step 34: lib/feed/ and lib/comments/ — COMPLETE
Step 35: lib/search/ — COMPLETE
Step 36: lib/community/ modules — COMPLETE
Step 37: Server actions delegate to lib/* — COMPLETE (app/actions/ is sole owner of revalidatePath/revalidateTag)
Step 38: Wire routes to lib/* — COMPLETE
Step 39: Remove Prisma package — COMPLETE (was already absent; no-op)

### Phase 5 — Billing
Step 40: Stripe webhook route — COMPLETE
Step 41: Stripe catalog — COMPLETE
Step 42: Subscription lifecycle — COMPLETE (gates.ts is sole owner of plan feature gate logic)
Step 43: Onboarding flow (7 steps) — COMPLETE
Step 44: Trial expiry + dunning — COMPLETE

### Phase 6 — Courses
Step 45: Course/module/lesson CRUD — COMPLETE
Step 46: Cloudflare Stream
Step 47: Drip scheduler — COMPLETE
Step 48: Quiz engine — COMPLETE
Step 49: Certificates — COMPLETE

### Phase 7 — Polish
Step 50: Resend + email templates — COMPLETE
Step 51: Realtime subscriptions — COMPLETE
Step 52: Creator dashboard — COMPLETE
Step 53: PWA + service worker — COMPLETE
Step 54: Feature flags — COMPLETE
Step 55: Platform admin console — COMPLETE

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

## Current Build Status
Steps 1–55 COMPLETE and pushed to main. NEXT: Step 56 — G1-G24 all green and required.

## src/lib/admin/ structure (Step 55)
- index.ts — getAdminStats, getAdminCommunities, getGlobalFlags, getCommunityOverridesForFlag
- guards.ts — requirePlatformAdmin() (server-only, redirects on failure)

## app/admin/ routes (Step 55)
- (console)/layout.tsx — dark shell, sidebar nav (Overview / Communities / Feature Flags)
- (console)/page.tsx — operational stats grid
- (console)/communities/page.tsx — searchable community table with plan/status badges
- (console)/flags/page.tsx — two-panel flag manager (RSC shell + FlagManager client)
- (console)/flags/FlagManager.tsx — full interactive flag manager client component
- login/ and setup/ sit outside (console) route group — not wrapped by guarded layout

## src/lib/feature-flags/ structure (Step 54)
- flags.ts — FEATURE_FLAGS const registry (13 flags), FlagName type
- index.ts — getFlag, getAllFlagsForCommunity, assertFlag, FlagResult type
- Evaluation: community row → global row → hardcoded default
- server-only guarded — never import in client components

## lib/community/dashboard.ts structure (Step 52)
- src/lib/community/dashboard.ts — getDashboardStats(communityId): single round-trip correlated subcount query via postgres-js db; returns DashboardStats { memberCount, postCount, spaceCount, courseCount }
- src/app/(app)/c/[communityId]/dashboard/page.tsx — RSC; admin/owner gate (notFound for others); stat cards + quick links + owner-only billing card
- layout.tsx sidebar — admin section (Dashboard + Settings links) rendered only when role is owner or admin; inline SVG icons, no new packages
- Settings link is a stub — no settings page exists yet

## src/hooks/ structure (Step 51)
- src/hooks/useRealtimePosts.ts — subscribes to posts INSERT by spaceId; calls onNewPost callback
- src/hooks/useRealtimeComments.ts — subscribes to comments INSERT by postId; calls onNewComment callback
- src/hooks/index.ts — barrel: exports hooks + RealtimePostPayload + RealtimeCommentPayload
- Browser client created inside useEffect (never at module level)
- Consumers call router.refresh() — no partial payload merging (realtime INSERT lacks author/counts)
- PostList.tsx and CommentList.tsx are 'use client' components wrapping the realtime hooks

## lib/email/ structure (Step 50)
- src/lib/email/client.ts — Resend client (server-only; NOT exported from barrel)
- src/lib/email/templates.ts — renderTemplate(name, vars) → {subject, html, text}; never throws; 6 templates + fallback
- src/lib/email/sender.ts — processPendingEmails(): claims batch via FOR UPDATE SKIP LOCKED, sends via Resend, updates status; never throws
- src/lib/email/index.ts — barrel: exports processPendingEmails + renderTemplate only
- processPendingEmails is called by cron/dunning route — NOT inline in Server Actions
- email_status enum has no 'processing' value; claim-before-send achieved via transaction + FOR UPDATE SKIP LOCKED

## Step 47 Notes
- Drip gate enforced at read time in getLesson — no cron job, no DB unlock mechanism
- isDripUnlocked is internal to queries.ts — not exported from barrel
- Admin+ callers bypass drip gate entirely (always see all lessons)
- getDripStatus returns [] for non-enrolled callers — never throws
Note: Step 46 (Cloudflare Stream) removed from plan — video is embed-only (YouTube/Vimeo). lessons.video_url stores embed URLs.

## lib/courses/ structure (Step 45)
- src/lib/courses/types.ts — Course, Module, Lesson, LessonMeta (no body), CourseWithModules, ModuleWithLessons, LessonWithContent, Enrollment, LessonProgress, all input types
- src/lib/courses/queries.ts — getCourses, getCourse, getLesson (enrollment OR admin gate), getEnrollment, getLessonProgress
- src/lib/courses/actions.ts — file-level 'use server', full CRUD + reorder + enroll + complete
- src/lib/courses/index.ts — barrel (no db/supabase client exports)
- src/app/actions/courses.ts — thin wrappers with revalidatePath/revalidateTag

## Step 45 deviations
- courses.space_id NOT NULL — added to CreateCourseInput (spec omitted it)
- enroll_in_course RPC returns uuid; ignored in wrapper (spec said void)
- complete_lesson RPC takes (p_enrollment_id, p_lesson_id); enrollment resolved from lesson chain
- modules/lessons have no deleted_at — hard DELETE used
- courses has deleted_at — soft delete used

## Step 44 Notes
- email_queue is write-only until Step 50 (Resend); dunning.ts queues rows, nothing sends them yet
- CRON_SECRET must be set in Vercel environment variables for the daily cron to fire
- email_queue has no community_id/type columns; dunning uses template field for DunningEmailType, idempotency guard on (to_email, template) within 7 days

## Route Structure (Step 38)
- src/middleware.ts — session refresh on every request; protects /c/* and /onboarding/*; redirects authed users away from /sign-in and /sign-up
- src/lib/community/context.ts — React cache() wrapper: getCommunityContext(communityId) → no duplicate DB calls per request
- app/(auth)/layout.tsx + sign-in/page.tsx + sign-up/page.tsx — unauthenticated route group
- app/(marketing)/layout.tsx — public marketing route group
- app/(app)/layout.tsx — authenticated shell with top nav; redirects to /sign-in if no session
- app/(app)/c/[communityId]/layout.tsx — UUID validate → parallel fetch → is_private gate → sidebar
- app/(app)/c/[communityId]/page.tsx — redirects to first space
- app/(app)/c/[communityId]/s/[spaceId]/page.tsx — feed list + PostForm.tsx client component
- app/(app)/c/[communityId]/s/[spaceId]/p/[postId]/page.tsx — post + comments; PostActions.tsx client component
- app/(app)/c/[communityId]/members/page.tsx — member table
- app/(app)/c/[communityId]/search/page.tsx — SearchInput.tsx client component + RSC results
- app/(app)/c/[communityId]/join/page.tsx — JoinButton.tsx client component
- app/(app)/communities/new/page.tsx — createCommunity form (client component)
- app/page.tsx — root: if authed redirect to first community; else landing

## Key Decisions Made During Build
- plan enum is 'hobby'|'pro' — no free tier (renamed from 'starter' pre-Step 41)
- STRIPE_HOBBY_PRICE_ID and STRIPE_PRO_PRICE_ID in env.ts server schema (Step 41)
- gates.ts is sole owner of plan feature gate logic — never check plan inline in routes
- Cloudflare Stream DROPPED from v1 — video is embed-only (YouTube/Vimeo)
- media.storage_path is NULL for video type
- lessons.video_url text NULL stores embed URLs
- Step 46 (Cloudflare Stream) removed from plan entirely
- npm is the package manager — never pnpm
- Zod v4 installed (^4.3.6)
- src/app/ scaffold created (page.tsx + layout.tsx) during Step 3
- env.ts gates server schema validation behind typeof window === 'undefined'
- All migrations use SET search_path = public, extensions at top
- CREATE OR REPLACE TRIGGER used (not CREATE TRIGGER IF NOT EXISTS)
- member_role enum: owner, admin, moderator, tier2_member, tier1_member, free_member, banned
- space_type enum: feed, course, events, members, chat
- vote_target_type enum: post, comment
- media_type enum: image, video, file
- notification_type enum: 10 values
- report_target_type enum: post, comment
- report_status enum: pending, resolved_removed, resolved_dismissed
- email_status enum: pending, sent, failed, cancelled
- author_id in posts and uploader_id in media are NULL (Option A from Step 8)
- Step 12 A3 fix: IS DISTINCT FROM + auth.uid() IS NULL guard in RPCs
- Step 12 B1 fix: transfer_community_ownership validates p_new_owner_id directly
- Step 49: supabase/types/database.types.ts manually patched to add verification_token to certificates table and issue_certificate / get_certificate_by_token RPC signatures. Running supabase gen types will overwrite these patches — re-apply or commit generated types after any future type regeneration.
- PWA: manual manifest + service worker (no next-pwa package)
- public/icons/icon-192.png and icon-512.png are 1×1 placeholders — real branded icons required before Step 62 (launch readiness)
- SW scope: cache-first for shell, network-first for pages, network-only for /api/, /auth/, supabase.co, stripe.com
- CACHE_NAME = 'gild-shell-v1' — bump version string on any shell asset change
- Feature flags: lib-only in Step 54 — platform admin UI deferred to Step 55
- Flag evaluation order: per-community → global → hardcoded default
- assertFlag() is the gating primitive for Server Actions
- 13 flags registered: quizzes, certificates, drip_content, invitations, realtime, events_space, member_directory, chat_space, leaderboard, analytics, custom_domain, white_label, api_access
- feature-flags lib NOT re-exported from any other lib barrel — always import directly from '@/lib/feature-flags'
- Admin console: no revenue metrics — operational stats only (Stripe is source of truth)
- Flag UI: two-panel pattern (global table + context panel with overrides)
- requirePlatformAdmin() is defence-in-depth — middleware already guards /admin/*
- getOverridesForFlag is a Server Action to avoid direct DB calls from client
- getCommunityOverridesForFlag uses JOIN query — no N+1
