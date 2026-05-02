// server-only — do not import from client components
import type { Database } from '../supabase/types';

type CommentRow = Database['public']['Tables']['comments']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type CommentNode = CommentRow & {
  author: Pick<ProfileRow, 'display_name' | 'avatar_url'> | null;
  reply_count: number;
  viewer_has_voted: boolean;
};

export type CreateCommentInput = {
  postId: string;
  parentId: string | null;
  body: string;
};
