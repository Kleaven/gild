'use server';

import { z } from 'zod';
import { getSupabaseServerClient } from '../auth/server';
import type { Certificate } from './certificate.types';

// ─── issueCertificate ─────────────────────────────────────────────────────────
// Issues a certificate for the given enrollment.
//
// Validation, idempotency, completion check, INSERT, and enrollment stamp are
// all handled atomically inside the issue_certificate SECURITY DEFINER RPC —
// consistent with enroll_in_course and complete_lesson patterns. Direct INSERT
// into certificates is locked to platform_admin by RLS (migration 00040).
//
// The server action: validates input, authenticates the caller, calls the RPC,
// then fetches and returns the full certificate row.

const issueCertificateSchema = z.object({
  enrollmentId: z.string().uuid(),
});

export async function issueCertificate(enrollmentId: string): Promise<Certificate> {
  const parsed = issueCertificateSchema.safeParse({ enrollmentId });
  if (!parsed.success) throw new Error('[gild] invalid input');

  // Step 1 — auth
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('[gild] not authenticated');

  // Steps 2–6 delegated to SECURITY DEFINER RPC (migration 20260505000001):
  //   2. fetch + verify enrollment ownership
  //   3. idempotency check — returns existing cert id if already issued
  //   4. count published lessons; guard total = 0
  //   5. count completed lessons; throw if incomplete
  //   6. INSERT certificate; stamp enrollments.completed_at
  const { data: certId, error: rpcErr } = await supabase.rpc('issue_certificate', {
    p_enrollment_id: parsed.data.enrollmentId,
  });
  if (rpcErr) throw new Error(rpcErr.message);
  if (!certId) throw new Error('[gild] certificate issuance failed');

  // Step 7 — fetch full certificate row for typed return
  const { data: cert, error: fetchErr } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', certId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  return cert;
}
