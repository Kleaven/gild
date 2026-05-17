import type { Database } from '../supabase/types';

export type DirectMessage = Database['public']['Tables']['direct_messages']['Row'];

export type SendDirectMessageInput = {
  receiverId: string;
  content: string;
};

export type RecipientProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};
