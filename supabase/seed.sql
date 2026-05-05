SET search_path = public, extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
-- ============================================================
-- Gild seed data
-- Covers all RLS policy paths: public/private communities,
-- banned users, platform admin, enrolled/unenrolled course
-- members. Idempotent: ON CONFLICT DO NOTHING throughout.
-- ============================================================
SET search_path = public, extensions;

-- ============================================================
-- 1. AUTH USERS
-- Must be inserted before profiles and all downstream rows.
-- crypt() and gen_salt() resolve via extensions in search_path.
-- ============================================================
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'admin@example.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(), '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated', 'authenticated',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'owner@example.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(), '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated', 'authenticated',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'paid@example.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(), '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated', 'authenticated',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'free@example.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(), '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated', 'authenticated',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'banned@example.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(), '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated', 'authenticated',
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. PLATFORM ADMINS
-- ============================================================
INSERT INTO public.platform_admins (id, user_id, email, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'admin@example.com',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. PROFILES
-- search_vector is GENERATED ALWAYS AS — omitted from INSERT.
-- ============================================================
INSERT INTO public.profiles (
  id, display_name, username, bio,
  created_at, updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Platform Admin',
    'platformadmin',
    'Gild platform administrator.',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Community Owner',
    'communityowner',
    'Owner of the Gild demo communities.',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Paid Member',
    'paidmember',
    'A paid tier member of the public demo community.',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Free Member',
    'freemember',
    'A free member of the public demo community.',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Banned Member',
    'bannedmember',
    'A banned member used for negative RLS tests.',
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. COMMUNITIES
-- search_vector is GENERATED ALWAYS AS — omitted from INSERT.
-- member_count set to reflect actual seed members below.
-- ============================================================
INSERT INTO public.communities (
  id, slug, name, description,
  owner_id, plan, subscription_status,
  is_private, member_count,
  created_at, updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000010',
    'gild-public-demo',
    'Gild Public Demo',
    'A public demo community for RLS testing.',
    '00000000-0000-0000-0000-000000000002',
    'pro', 'active',
    false, 4,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000011',
    'gild-private-demo',
    'Gild Private Demo',
    'A private demo community for RLS testing.',
    '00000000-0000-0000-0000-000000000002',
    'pro', 'active',
    true, 2,
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. MEMBERSHIP TIERS
-- Both tiers belong to the public community only.
-- UNIQUE constraint is (community_id, position).
-- ============================================================
INSERT INTO public.membership_tiers (
  id, community_id, name, description,
  price_month_usd, position, is_active,
  created_at, updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000010',
    'Free',
    'Free membership tier.',
    0, 0, true,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000010',
    'Pro Member',
    'Paid membership tier.',
    2900, 1, true,
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. COMMUNITY MEMBERS
-- Conflict target is (community_id, user_id) per schema UNIQUE.
-- seed_member_free and seed_member_banned absent from private
-- community — critical for RLS negative-path tests.
-- ============================================================
INSERT INTO public.community_members (
  id, community_id, user_id, role, tier_id,
  joined_at, created_at, updated_at
) VALUES
  -- seed_owner → community_public
  (
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000002',
    'owner', NULL,
    now(), now(), now()
  ),
  -- seed_owner → community_private
  (
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000002',
    'owner', NULL,
    now(), now(), now()
  ),
  -- seed_member_paid → community_public (tier1_member, Pro tier)
  (
    '00000000-0000-0000-0000-000000000032',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000003',
    'tier1_member', '00000000-0000-0000-0000-000000000021',
    now(), now(), now()
  ),
  -- seed_member_free → community_public (free_member, Free tier)
  (
    '00000000-0000-0000-0000-000000000033',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000004',
    'free_member', '00000000-0000-0000-0000-000000000020',
    now(), now(), now()
  ),
  -- seed_member_banned → community_public (banned)
  (
    '00000000-0000-0000-0000-000000000034',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000005',
    'banned', NULL,
    now(), now(), now()
  ),
  -- seed_member_paid → community_private (tier1_member)
  (
    '00000000-0000-0000-0000-000000000035',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000003',
    'tier1_member', NULL,
    now(), now(), now()
  )
ON CONFLICT (community_id, user_id) DO NOTHING;

-- ============================================================
-- 7. SPACES
-- Feed spaces for posts. Course spaces required by the
-- courses.space_id NOT NULL FK — two course-type spaces added.
-- UNIQUE constraint is (community_id, slug).
-- ============================================================
INSERT INTO public.spaces (
  id, community_id, name, slug, type,
  position, is_private, min_role,
  created_at, updated_at
) VALUES
  -- Feed spaces
  (
    '00000000-0000-0000-0000-000000000040',
    '00000000-0000-0000-0000-000000000010',
    'General', 'general', 'feed',
    0, false, 'free_member',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000041',
    '00000000-0000-0000-0000-000000000011',
    'General', 'general', 'feed',
    0, false, 'free_member',
    now(), now()
  ),
  -- Course spaces (required by courses.space_id NOT NULL)
  (
    '00000000-0000-0000-0000-000000000042',
    '00000000-0000-0000-0000-000000000010',
    'Getting Started', 'getting-started', 'course',
    1, false, 'free_member',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000043',
    '00000000-0000-0000-0000-000000000011',
    'Members Only Course', 'members-only-course', 'course',
    1, false, 'free_member',
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. POSTS
-- search_vector is GENERATED ALWAYS AS — omitted from INSERT.
-- ============================================================
INSERT INTO public.posts (
  id, community_id, space_id, author_id,
  title, body,
  is_pinned, is_locked, like_count, comment_count,
  created_at, updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000050',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000040',
    '00000000-0000-0000-0000-000000000002',
    'Welcome to Gild Public Demo',
    'This is the first post in the public demo community.',
    false, false, 0, 0,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000051',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000040',
    '00000000-0000-0000-0000-000000000002',
    'Second Post',
    'A second post for pagination and feed testing.',
    false, false, 0, 0,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000052',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000041',
    '00000000-0000-0000-0000-000000000002',
    'Private Community Post',
    'This post is only visible to members of the private community.',
    false, false, 0, 0,
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. COURSES
-- search_vector is GENERATED ALWAYS AS — omitted from INSERT.
-- is_published = true so enroll_in_course RPC path is exercisable.
-- ============================================================
INSERT INTO public.courses (
  id, community_id, space_id,
  title, description,
  is_published, position,
  created_at, updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000060',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000042',
    'Getting Started',
    'An introductory course for new members of the public demo community.',
    true, 0,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000061',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000043',
    'Members Only Course',
    'A course exclusive to private community members.',
    true, 0,
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. MODULES
-- ============================================================
INSERT INTO public.modules (
  id, course_id, title, position,
  created_at, updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000070',
    '00000000-0000-0000-0000-000000000060',
    'Introduction', 0,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000071',
    '00000000-0000-0000-0000-000000000061',
    'Introduction', 0,
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. LESSONS
-- is_published = true so complete_lesson RPC path is exercisable.
-- ============================================================
INSERT INTO public.lessons (
  id, module_id, title, video_url,
  position, is_published,
  created_at, updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000080',
    '00000000-0000-0000-0000-000000000070',
    'Welcome Lesson',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    0, true,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000081',
    '00000000-0000-0000-0000-000000000071',
    'Welcome Lesson',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    0, true,
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;
