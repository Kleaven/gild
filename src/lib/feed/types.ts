import type { Database } from '../supabase/types';

type PostRow = Database['public']['Tables']['posts']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type SpaceRow = Database['public']['Tables']['spaces']['Row'];

export type FeedPost = PostRow & {
  author: Pick<ProfileRow, 'display_name' | 'avatar_url'> | null;
  space: Pick<SpaceRow, 'name' | 'type'>;
  viewer_has_voted: boolean;
  viewer_voted_option?: string | null;
  poll_results?: Record<string, number>;
};

export type CreatePostInput = {
  communityId: string;
  spaceId: string;
  title?: string;
  body: string;
  mediaUrls?: string[];
  type?: 'post' | 'poll';
  pollOptions?: { id: string; text: string }[];
  broadcastAsNewsletter?: boolean;
};
