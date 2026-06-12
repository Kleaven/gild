'use server';

import { after } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '../auth/server';
import { rateLimit } from '../rate-limit/index';
import { normalizeRole, hasMinRole, canRolePerform } from '../permissions/roles';
import db from '../db';
import type { CreatePostInput } from './types';

const createPostSchema = z.object({
  communityId: z.string().uuid(),
  spaceId: z.string().uuid(),
  title: z.string().min(1).max(300).optional(),
  body: z.string().min(1).max(50000),
  mediaUrls: z.array(z.string().url()).optional(),
  type: z.enum(['post', 'poll']).optional().default('post'),
  pollOptions: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  broadcastAsNewsletter: z.boolean().optional(),
});

export async function createPost(input: CreatePostInput): Promise<{ postId: string }> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  }
  const { communityId, spaceId, title, body, mediaUrls, type, pollOptions, broadcastAsNewsletter } = parsed.data;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('[gild] not authenticated');

  const rl = await rateLimit.postCreate(user.id);
  if (!rl.allowed) throw new Error('[gild] rate limit exceeded');

  const { data: hasRole, error: roleError } = await supabase.rpc('user_has_min_role', {
    p_community_id: communityId,
    p_min_role: 'free_member',
  });
  if (roleError) throw new Error(roleError.message);
  if (!hasRole) throw new Error('[gild] not a member of this community');

  const { data: space, error: spaceError } = await supabase
    .from('spaces')
    .select('id, allow_member_posts, permissions')
    .eq('id', spaceId)
    .eq('community_id', communityId)
    .maybeSingle();
  if (spaceError) {
    console.error('[createPost] Error fetching space:', spaceError);
    throw new Error(spaceError.message);
  }
  if (!space) throw new Error('[gild] space not found in community');

  // ─── Permission Check ──────────────────────────────────────────────────────
  // Resolve the caller's actual role once, then apply BOTH permission layers:
  // the space's own permissions and the community-wide role permissions.
  // Either layer can deny. (Previously the group shape saved by the settings
  // editors was silently ignored — "members can't post" never enforced.)
  const { data: callerRole, error: callerRoleErr } = await supabase.rpc('current_user_role', {
    p_community_id: communityId,
  });
  if (callerRoleErr) throw new Error(callerRoleErr.message);
  const role = normalizeRole(callerRole);

  const { data: communityRow } = await supabase
    .from('communities')
    .select('role_permissions')
    .eq('id', communityId)
    .maybeSingle();

  let allowedToPost =
    canRolePerform(space.permissions, role, 'post') &&
    canRolePerform(communityRow?.role_permissions, role, 'post');
  // Legacy space toggle: when member posting is off, moderators+ may still post.
  if (allowedToPost && space.allow_member_posts === false) {
    allowedToPost = hasMinRole(role, 'moderator');
  }
  if (!allowedToPost) {
    throw new Error('[gild] posting is limited in this space — ask a moderator if you think this is a mistake');
  }

  // ─── Broadcast pre-flight ──────────────────────────────────────────────────
  // Validate broadcast eligibility BEFORE inserting the post. Otherwise a
  // failed broadcast check leaves a phantom post in the feed and surfaces
  // an opaque "only admins…" error to the user.
  let authorDisplayName = 'A member';
  if (broadcastAsNewsletter) {
    const { data: isAdmin } = await supabase.rpc('user_has_min_role', {
      p_community_id: communityId,
      p_min_role: 'admin',
    });
    if (!isAdmin) throw new Error('[gild] only admins can broadcast newsletters');

    const rlBroadcast = await rateLimit.broadcast(communityId);
    if (!rlBroadcast.allowed) {
      throw new Error('[gild] broadcast rate limit exceeded (max 3/hour per community)');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    authorDisplayName = profile?.display_name?.trim() || 'A member';
  }

  const { data: post, error: insertError } = await supabase
    .from('posts')
    .insert({
      community_id: communityId,
      space_id: spaceId,
      author_id: user.id,
      title: title ?? null,
      body,
      media_urls: mediaUrls ?? null,
      type,
      poll_options: pollOptions ?? null,
    })
    .select('id')
    .single();
  if (insertError) throw new Error(insertError.message);

  if (broadcastAsNewsletter) {
    // Defer the fan-out work to AFTER the response is flushed. For a
    // community of 10k members the JOIN + batch INSERT can take seconds —
    // we don't want the user staring at "Posting…" while it runs.
    // Errors here are swallowed (logged only) because the post itself
    // succeeded; the user's primary intent is satisfied. Failed broadcasts
    // surface in server logs and (eventually) ops alerting.
    const broadcastJob = {
      communityId,
      postId: post.id,
      title,
      body,
      authorName: authorDisplayName,
    };
    after(async () => {
      try {
        await enqueueBroadcast(broadcastJob);
      } catch (err) {
        console.error('[enqueueBroadcast] post-response failure', {
          postId: post.id,
          communityId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    });
  }

  return { postId: post.id };
}

type BroadcastParams = {
  communityId: string;
  postId: string;
  title?: string;
  body: string;
  authorName: string;
};

// Truncate body for the email preview. Email clients struggle with very long
// HTML <pre> blocks, and a CTA back to the community is the real conversion.
const EMAIL_BODY_PREVIEW_CHARS = 600;

function truncateForEmail(text: string, max: number): string {
  if (text.length <= max) return text;
  // Cut at last whitespace within budget to avoid mid-word breaks.
  const slice = text.slice(0, max);
  const lastBreak = Math.max(slice.lastIndexOf(' '), slice.lastIndexOf('\n'));
  const cut = lastBreak > max * 0.6 ? slice.slice(0, lastBreak) : slice;
  return cut.trimEnd() + '…';
}

async function enqueueBroadcast({ communityId, postId, title, body, authorName }: BroadcastParams): Promise<void> {
  // Fetch community metadata (name, slug, theme_hue) in one round-trip
  const commRows = await db<{ name: string; slug: string; theme_hue: number | null }[]>`
    SELECT name, slug, theme_hue
    FROM public.communities
    WHERE id = ${communityId}
    LIMIT 1
  `;
  const community = commRows[0];
  if (!community) return;

  // JOIN community_members → profiles → auth.users to get eligible recipients.
  // broadcast_opt_out is honoured here; transactional mail bypasses this filter.
  const members = await db<{
    email: string;
    display_name: string | null;
    unsubscribe_token: string;
  }[]>`
    SELECT au.email, p.display_name, cm.unsubscribe_token
    FROM public.community_members cm
    JOIN public.profiles p ON p.id = cm.user_id
    JOIN auth.users au ON au.id = cm.user_id
    WHERE cm.community_id = ${communityId}
      AND cm.role <> 'banned'
      AND cm.broadcast_opt_out = false
      AND au.email IS NOT NULL
  `;
  if (members.length === 0) return;

  const postTitle = title ?? '';
  // Template owns subject formatting — passing an empty string lets the
  // template's `${title} — ${community}` default fire. We still pass *something*
  // because email_queue.subject is NOT NULL.
  const subject = (postTitle
    ? `${postTitle} — ${community.name}`
    : `New post in ${community.name}`
  ).slice(0, 200);
  const themeHue = String(community.theme_hue ?? 250);
  const previewBody = truncateForEmail(body, EMAIL_BODY_PREVIEW_CHARS);

  const rows = members.map((m) => ({
    to_email: m.email,
    to_name: m.display_name || null,
    subject,
    template: 'COMMUNITY_BROADCAST',
    variables: {
      postId,
      postTitle,
      postBody: previewBody,
      communityName: community.name,
      communitySlug: community.slug,
      recipientName: m.display_name || '',
      authorName,
      themeHue,
      unsubscribeToken: m.unsubscribe_token,
    },
  }));

  // ON CONFLICT DO NOTHING pairs with the partial unique index on
  // (template, to_email, variables->>'postId') WHERE template = 'COMMUNITY_BROADCAST'
  // so accidental retries (double-click, transient network) silently dedupe.
  await db`
    INSERT INTO public.email_queue ${db(rows, 'to_email', 'to_name', 'subject', 'template', 'variables')}
    ON CONFLICT (template, to_email, (variables->>'postId'))
    WHERE template = 'COMMUNITY_BROADCAST'
      AND status IN ('pending', 'sent')
      AND (variables->>'postId') IS NOT NULL
    DO NOTHING
  `;
}

export async function deletePost(postId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc('delete_post', { p_post_id: postId });
  if (error) throw new Error(error.message);
}

export async function pinPost(postId: string, pin: boolean): Promise<void> {
  const supabase = await getSupabaseServerClient();

  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('community_id')
    .eq('id', postId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!post) throw new Error('[gild] post not found');

  const { data: hasRole, error: roleError } = await supabase.rpc('user_has_min_role', {
    p_community_id: post.community_id,
    p_min_role: 'moderator',
  });
  if (roleError) throw new Error(roleError.message);
  if (!hasRole) throw new Error('[gild] insufficient permissions to pin post');

  const { error } = await supabase
    .from('posts')
    .update({ is_pinned: pin })
    .eq('id', postId);
  if (error) throw new Error(error.message);
}

export async function voteInPoll(postId: string, optionId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('[gild] not authenticated');

  const { error } = await supabase
    .from('poll_votes')
    .upsert({
      post_id: postId,
      user_id: user.id,
      option_id: optionId,
    }, {
      onConflict: 'post_id,user_id'
    });
  if (error) throw new Error(error.message);
}
