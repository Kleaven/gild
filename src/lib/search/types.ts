// server-only — do not import from client components

export type SearchScope = 'posts' | 'communities' | 'members';

export type SearchPostResult = {
  id: string;
  title: string | null;
  snippet: string;
  author_display_name: string | null;
  space_name: string;
  space_id: string;
  community_id: string;
  created_at: string;
};

export type SearchCommunityResult = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  member_count: number;
  is_private: boolean;
};

export type SearchMemberResult = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  username: string | null;
};
