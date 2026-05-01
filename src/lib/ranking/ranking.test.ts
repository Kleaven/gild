import { config } from 'dotenv';
config({ path: '.env.local' });

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { getHotPosts, getTopPosts } from './feed';

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock('server-only', () => ({}));

const TEST_DB_URL = process.env.DATABASE_URL!;
const testDb = postgres(TEST_DB_URL, { max: 2 });

// Mock createClient from @/lib/supabase/server
vi.mock('@/lib/supabase/server', () => {
  require('dotenv').config({ path: '.env.local' });
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    createClient: () => Promise.resolve(client),
  };
});

// Supabase service client for setup/teardown
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Test State ─────────────────────────────────────────────────────────────
const RUN_ID = Date.now();
const COMMUNITY_ID = crypto.randomUUID();
let testUserId!: string;
let testSpaceId!: string;

describe('Step 31: Ranking & Pagination Integration', () => {
  beforeAll(async () => {
    // 1. Create a real auth user to satisfy FK constraint on profiles
    const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
      email: `ranking-test-${RUN_ID}@gild.test`,
      password: `test-password-${RUN_ID}`,
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }
    testUserId = authUser.user.id;

    // 2. Create profile
    await testDb`
      INSERT INTO public.profiles (id, display_name, username)
      VALUES (${testUserId}, 'Test Owner', ${`owner_${RUN_ID}`})
    `;

    // 3. Create community
    await testDb`
      INSERT INTO public.communities (id, name, slug, owner_id)
      VALUES (${COMMUNITY_ID}, 'Ranking Test', ${`ranking-test-${RUN_ID}`}, ${testUserId})
    `;

    // 4. Create a space
    const res = await testDb`
      INSERT INTO public.spaces (community_id, name, slug, type)
      VALUES (${COMMUNITY_ID}, 'Test Space', ${`test-space-${RUN_ID}`}, 'feed')
      RETURNING id
    `;
    testSpaceId = res[0]?.id;
  });

  afterAll(async () => {
    if (testSpaceId) {
      await testDb`DELETE FROM public.posts WHERE space_id = ${testSpaceId}`;
      await testDb`DELETE FROM public.spaces WHERE id = ${testSpaceId}`;
    }

    // Cleanup community, profile, and auth user
    await testDb`DELETE FROM public.communities WHERE id = ${COMMUNITY_ID}`;
    await testDb`DELETE FROM public.profiles WHERE id = ${testUserId}`;
    if (testUserId) {
      await serviceClient.auth.admin.deleteUser(testUserId);
    }
    await testDb.end();
  });

  it('calculates hot_score correctly via trigger and sorts by it', async () => {
    const now = new Date();

    // Post A: Older but with likes
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const resA = await testDb`
      INSERT INTO public.posts (community_id, space_id, body, created_at, like_count)
      VALUES (${COMMUNITY_ID}, ${testSpaceId}, 'Hot Post A', ${twoHoursAgo}, 10)
      RETURNING id
    `;
    const idA = resA[0]!.id;

    // Post B: Newer, fewer likes
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    const resB = await testDb`
      INSERT INTO public.posts (community_id, space_id, body, created_at, like_count)
      VALUES (${COMMUNITY_ID}, ${testSpaceId}, 'Hot Post B', ${oneHourAgo}, 1)
      RETURNING id
    `;
    const idB = resB[0]!.id;

    // Post C: Newest, no likes
    const resC = await testDb`
      INSERT INTO public.posts (community_id, space_id, body, created_at)
      VALUES (${COMMUNITY_ID}, ${testSpaceId}, 'Hot Post C', ${now})
      RETURNING id
    `;
    const idC = resC[0]!.id;

    const { posts } = await getHotPosts(COMMUNITY_ID, 10);

    // With 24h decay, Post A (20 likes) should likely be above Post B (5 likes)
    // and both should be above Post C (0 likes).
    expect(posts[0]?.id).toBe(idA);
    expect(posts[1]?.id).toBe(idB);
    expect(posts[2]?.id).toBe(idC);

    // Verify scores are indeed descending
    expect(Number(posts[0]?.hot_score)).toBeGreaterThan(Number(posts[1]?.hot_score));
    expect(Number(posts[1]?.hot_score)).toBeGreaterThan(Number(posts[2]?.hot_score));
  });

  it('paginates correctly without duplicates', async () => {
    // Insert more posts to test pagination
    for (let i = 0; i < 5; i++) {
      await testDb`
        INSERT INTO public.posts (community_id, space_id, body, like_count)
        VALUES (${COMMUNITY_ID}, ${testSpaceId}, ${`Paginated ${i}`}, ${i})
      `;
    }

    // Fetch Page 1 (3 posts)
    const page1 = await getHotPosts(COMMUNITY_ID, 3);
    expect(page1.posts).toHaveLength(3);
    expect(page1.nextCursor).not.toBeNull();

    // Fetch Page 2
    const page2 = await getHotPosts(COMMUNITY_ID, 10, page1.nextCursor!);

    // Total posts in space should be 3 (from previous test) + 5 = 8
    // Page 1 took 3, so Page 2 should have 5
    expect(page2.posts).toHaveLength(5);

    // Check for duplicates
    const page1Ids = new Set(page1.posts.map(p => p.id));
    for (const post of page2.posts) {
      expect(page1Ids.has(post.id)).toBe(false);
    }
  });

  it('sorts by top correctly within timeframe', async () => {
    // Post with many likes but old
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await testDb`
      INSERT INTO public.posts (community_id, space_id, body, created_at, like_count)
      VALUES (${COMMUNITY_ID}, ${testSpaceId}, 'Top Yesterday', ${yesterday}, 100)
    `;

    // Post with fewer likes but today
    await testDb`
      INSERT INTO public.posts (community_id, space_id, body, like_count)
      VALUES (${COMMUNITY_ID}, ${testSpaceId}, 'Top Today', 50)
    `;

    // getTopPosts with 'day' timeframe should only see 'Top Today'
    const topDay = await getTopPosts(COMMUNITY_ID, 'day', 10);
    expect(topDay.posts.find(p => p.body === 'Top Yesterday')).toBeUndefined();
    expect(topDay.posts.find(p => p.body === 'Top Today')).toBeDefined();

    // getTopPosts with 'week' should see both, and 'Top Yesterday' should be first
    const topWeek = await getTopPosts(COMMUNITY_ID, 'week', 10);
    expect(topWeek.posts[0]?.like_count).toBe(100);
  });
});
