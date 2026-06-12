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

// One row per DM peer — the inbox list. shared_community is the first
// community both users belong to (context for "who is this person?").
export type Conversation = {
  peer_id: string;
  display_name: string;
  avatar_url: string | null;
  last_message: string;
  last_at: string;
  last_from_me: boolean;
  unread_count: number;
  shared_community: string | null;
};
