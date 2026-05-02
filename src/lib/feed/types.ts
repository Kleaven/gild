// server-only — do not import from client components
import type { Database } from '../supabase/types';

type PostRow = Database['public']['Tables']['posts']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type SpaceRow = Database['public']['Tables']['spaces']['Row'];

export type FeedPost = PostRow & {
  author: Pick<ProfileRow, 'display_name' | 'avatar_url'> | null;
  space: Pick<SpaceRow, 'name' | 'type'>;
  viewer_has_voted: boolean;
};

export type CreatePostInput = {
  communityId: string;
  spaceId: string;
  title?: string;
  body: string;
};
