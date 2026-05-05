import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import type { Certificate, PublicCertificate } from './certificate.types';

// ─── getCertificate ───────────────────────────────────────────────────────────
// Returns the current user's certificate for a course, or null if not yet issued.
// RLS on certificates scopes SELECT to current user's own rows automatically.
// Explicit user_id filter guards against admin-context multi-row ambiguity.

export async function getCertificate(
  supabase: SupabaseClient<Database>,
  courseId: string,
): Promise<Certificate | null> {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return null;

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// ─── getCertificateByToken ────────────────────────────────────────────────────
// Public verification endpoint — no auth required.
// Calls the get_certificate_by_token SECURITY DEFINER RPC which bypasses RLS
// and returns only public-safe display fields (no user_id or internal IDs).

export async function getCertificateByToken(
  supabase: SupabaseClient<Database>,
  token: string,
): Promise<PublicCertificate | null> {
  const { data, error } = await supabase.rpc('get_certificate_by_token', {
    p_token: token,
  });
  if (error) throw new Error(error.message);
  const row = data?.[0];
  if (!row) return null;

  return {
    issuedAt: row.issued_at,
    certificateUrl: row.certificate_url,
    recipientName: row.recipient_name,
    courseTitle: row.course_title,
    communityName: row.community_name,
    token,
  };
}
