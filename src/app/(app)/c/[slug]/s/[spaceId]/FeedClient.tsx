'use client';

import { useOptimistic, useTransition, useState, useEffect, useMemo } from 'react';
import type { FeedPost } from '@/lib/feed';
import { createPost, deletePost, pinPost, voteInPoll } from '@/app/actions';
import { useRealtimePresence } from '@/hooks';
import PostForm from './PostForm';
import PostList from './PostList';
import { GILD_FONTS, CoverArt, LivePill, StudioRightRail, SpaceSettingsModal } from '@/components/gild';
import { MoreHorizontal, Plus, PenSquare } from 'lucide-react';
import { useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OptimisticAuthor = {
  display_name: string;
  avatar_url: string | null;
};

/** FeedPost augmented with a local _optimistic flag (not in DB type). */
type OptimisticFeedPost = FeedPost & { _optimistic?: true };

type FeedAction =
  | { type: 'add'; post: OptimisticFeedPost }
  | { type: 'remove'; postId: string }
  | { type: 'pin'; postId: string; pin: boolean };

function feedReducer(
  state: OptimisticFeedPost[],
  action: FeedAction,
): OptimisticFeedPost[] {
  switch (action.type) {
    case 'add':
      return [action.post, ...state];
    case 'remove':
      return state.filter((p) => p.id !== action.postId);
    case 'pin':
      return state.map((p) =>
        p.id === action.postId ? { ...p, is_pinned: action.pin } : p,
      );
    default:
      return state;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  initialPosts: FeedPost[];
  communityId: string;
  communitySlug: string;
  spaceId: string;
  spaceName: string;
  spaceDesc: string | null;
  spaceType: string;
  spaceHue: number;
  spaceMembersCount: number;
  author: OptimisticAuthor;
  /** auth user id — used to decide whether to show delete on each card */
  currentUserId: string;
  canPin?: boolean;
  allowMemberPosts?: boolean;
  rolePermissions?: any;
  isPrivate?: boolean;
  currentUserRole?: string;
  communityMemberCount?: number;
};

// ─── FeedClient ───────────────────────────────────────────────────────────────

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '8px 12px',
  borderRadius: 8,
  background: 'none',
  border: 'none',
  fontSize: 13,
  fontWeight: 500,
  color: 'oklch(0.30 0.02 250)',
  cursor: 'pointer',
  transition: 'background 0.1s ease',
};

export default function FeedClient({
  initialPosts,
  communityId,
  communitySlug,
  spaceId,
  spaceName,
  spaceDesc,
  spaceType,
  spaceHue,
  spaceMembersCount,
  author,
  currentUserId,
  canPin = false,
  allowMemberPosts = true,
  rolePermissions,
  isPrivate = false,
  currentUserRole,
  communityMemberCount = 0,
}: Props) {
  const [, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [showSpaceMenu, setShowSpaceMenu] = useState(false);
  const [isSpaceSettingsOpen, setIsSpaceSettingsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentUserPresence = useMemo(() => ({
    id: currentUserId,
    name: author.display_name,
    avatar_url: author.avatar_url,
    online: true,
  }), [currentUserId, author]);

  // Using any to sidestep exact type mismatch between useRealtimePresence types and Avatar
  const onlineUsers = useRealtimePresence(`space-${spaceId}`, currentUserPresence as any);

  const [optimisticPosts, dispatch] = useOptimistic<
    OptimisticFeedPost[],
    FeedAction
  >(initialPosts as OptimisticFeedPost[], feedReducer);

  // ─── CREATE ────────────────────────────────────────────────────────────────

  async function handleCreate(title: string, body: string, mediaUrls?: string[], type: 'post' | 'poll' = 'post', pollOptions?: { id: string, text: string }[], broadcastAsNewsletter?: boolean): Promise<void> {
    const tempId = crypto.randomUUID();
    const optimisticPost: OptimisticFeedPost = {
      id: tempId,
      title: title || null,
      body,
      media_urls: mediaUrls || null,
      type: type as any,
      poll_options: pollOptions as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      author_id: currentUserId,
      community_id: communityId,
      space_id: spaceId,
      like_count: 0,
      comment_count: 0,
      is_pinned: false,
      is_locked: false,
      hot_score: 0,
      search_vector: null,
      author: {
        display_name: author.display_name,
        avatar_url: author.avatar_url,
      },
      space: {
        name: spaceName,
        type: spaceType as FeedPost['space']['type'],
      },
      viewer_has_voted: false,
      _optimistic: true,
    };

    startTransition(() => {
      dispatch({ type: 'add', post: optimisticPost });
    });

    setFormError(null);

    try {
      const result = await createPost({ communityId, spaceId, title: title || undefined, body, mediaUrls, type, pollOptions, broadcastAsNewsletter });
      if (result.error) {
        throw new Error(result.error);
      }
      setIsFormVisible(false);
    } catch (err) {
      startTransition(() => {
        dispatch({ type: 'remove', postId: tempId });
      });
      const msg = err instanceof Error ? err.message : 'Failed to create post';
      setFormError(msg);
    }
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────

  function handleDelete(postId: string) {
    const snapshot = optimisticPosts.find((p) => p.id === postId);
    if (!snapshot) return;

    startTransition(async () => {
      dispatch({ type: 'remove', postId });
      try {
        await deletePost(postId);
      } catch {
        dispatch({ type: 'add', post: snapshot });
      }
    });
  }

  // ─── PIN ───────────────────────────────────────────────────────────────────

  function handlePin(postId: string, pin: boolean) {
    startTransition(async () => {
      dispatch({ type: 'pin', postId, pin });
      try {
        await pinPost(postId, pin);
      } catch {
        dispatch({ type: 'pin', postId, pin: !pin });
      }
    });
  }

  async function handleVote(postId: string, optionId: string) {
    // For now, we'll just call the server action and revalidate
    // SOTA would have optimistic vote counting, but let's start with reliable first
    try {
      await voteInPoll(postId, optionId, communitySlug, spaceId);
    } catch (err) {
      console.error('Failed to vote', err);
    }
  }

  const spaceObjMock = { id: spaceId, name: spaceName, desc: spaceDesc || '', hue: spaceHue };

  return (
    <>
      <main style={{ flex: 1, minWidth: 0, fontFamily: GILD_FONTS.sans }}>
        <div style={{ position: 'relative' }}>
          <CoverArt space={spaceObjMock} height={140} variant="grid" />
        </div>
        <div style={{ maxWidth: 720, margin: '-30px auto 0', padding: '0 28px 64px', position: 'relative' }}>
          
          {/* Header */}
          <div style={{ background: '#fff', border: '1px solid oklch(0.94 0.005 250)', borderRadius: 14, padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: `oklch(0.62 0.16 ${spaceHue})`, marginTop: 8, flexShrink: 0 }} />
              <div>
                <h1 style={{ fontFamily: GILD_FONTS.display, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px' }}>#{spaceName}</h1>
                {spaceDesc && <p style={{ fontSize: 13, color: 'oklch(0.45 0.02 250)', margin: 0, lineHeight: 1.5 }}>{spaceDesc}</p>}
                <div style={{ display: 'flex', gap: 14, marginTop: 8, fontFamily: GILD_FONTS.mono, fontSize: 11, color: 'oklch(0.50 0.02 250)' }}>
                  <span>{optimisticPosts.length} posts</span>
                  <span>{spaceMembersCount} members</span>
                  <LivePill count={1} hue={spaceHue} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
              {(allowMemberPosts || canPin) && (
                <button
                  onClick={() => {
                    setIsFormVisible(!isFormVisible);
                    if (!isFormVisible) {
                      setTimeout(() => {
                        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        formRef.current?.querySelector('textarea')?.focus();
                      }, 50);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: isFormVisible ? 'oklch(0.95 0.005 250)' : `oklch(0.35 0.16 ${spaceHue})`,
                    color: isFormVisible ? 'oklch(0.20 0.02 250)' : '#fff',
                    border: isFormVisible ? '1px solid oklch(0.90 0.01 250)' : 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isFormVisible ? 'Cancel' : <><PenSquare size={16} /> New Post</>}
                </button>
              )}
              
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowSpaceMenu(!showSpaceMenu)}
                  className="gild-btn" 
                  aria-label="Space settings" 
                  style={{ width: 32, height: 32, border: '1px solid oklch(0.92 0.01 250)', borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'oklch(0.40 0.02 250)' }}
                >
                  <MoreHorizontal size={16} />
                </button>
                
                {showSpaceMenu && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 180,
                    background: '#fff',
                    border: '1px solid oklch(0.92 0.01 250)',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px oklch(0 0 0 / 0.1)',
                    zIndex: 100,
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}>
                    {canPin && (
                      <button 
                        onClick={() => {
                          setIsSpaceSettingsOpen(true);
                          setShowSpaceMenu(false);
                        }}
                        style={menuItemStyle}
                      >
                        Space Settings
                      </button>
                    )}
                    <button style={menuItemStyle}>Notification Prefs</button>
                    <div style={{ height: 1, background: 'oklch(0.96 0.005 250)', margin: '4px 0' }} />
                    <button style={{ ...menuItemStyle, color: 'oklch(0.45 0.15 25)' }}>Archive Space</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isFormVisible && (
            <PostForm
              ref={formRef}
              hue={spaceHue}
              communityId={communityId}
              spaceId={spaceId}
              currentUserRole={currentUserRole}
              communityMemberCount={communityMemberCount}
              onSubmit={handleCreate}
              externalError={formError}
              onClearError={() => setFormError(null)}
            />
          )}
          <PostList
            posts={optimisticPosts as FeedPost[]}
            communitySlug={communitySlug}
            spaceId={spaceId}
            spaceName={spaceName}
            hue={spaceHue}
            canPin={canPin}
            currentUserId={currentUserId}
            onDelete={handleDelete}
            onPin={handlePin}
            onVote={handleVote}
          />
        </div>
      </main>

      <SpaceSettingsModal
        communityId={communityId}
        communitySlug={communitySlug}
        isOpen={isSpaceSettingsOpen}
        onClose={() => setIsSpaceSettingsOpen(false)}
        space={{
          id: spaceId,
          name: spaceName,
          description: spaceDesc,
          is_private: isPrivate,
          role_permissions: rolePermissions
        }}
      />
    </>
  );
}
