import type { Database } from '../supabase/types';

// ─── Base type ────────────────────────────────────────────────────────────────

export type Certificate = Database['public']['Tables']['certificates']['Row'];

// ─── Public display type ──────────────────────────────────────────────────────

// Safe for unauthenticated verification pages — no user_id or internal IDs.
// token is the verification_token (part of the public URL, safe to expose).
export type PublicCertificate = {
  issuedAt: string;
  certificateUrl: string | null;
  recipientName: string;
  courseTitle: string;
  communityName: string;
  token: string;
};
