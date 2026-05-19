'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { resolveCommunitySlug } from '@/lib/community/context';
import type { Database } from '@/lib/supabase/types';

type ReportStatus = Database['public']['Enums']['report_status'];

const resolveSchema = z.object({
  reportId: z.string().uuid(),
  // Only the two terminal statuses are valid resolution targets — 'pending'
  // doesn't make sense as a manual transition.
  status: z.enum(['resolved_removed', 'resolved_dismissed']),
});

export type ResolveReportResult =
  | { ok: true }
  | { ok: false; code: 'validation_failed' | 'insufficient_permissions' | 'not_found'; message: string };

/**
 * Mark a report resolved. RLS on reports.UPDATE already restricts to
 * (admin of community) OR (platform_admin) — the app-layer check is
 * defense in depth so callers get a clean structured error rather than
 * an opaque RLS denial when they aren't authorised.
 */
export async function resolveReport(
  input: { reportId: string; status: ReportStatus },
): Promise<ResolveReportResult> {
  const parsed = resolveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: 'validation_failed', message: 'Invalid input' };
  }
  const { reportId, status } = parsed.data;

  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, code: 'insufficient_permissions', message: 'Not authenticated' };
  }

  // Look up the community_id so we can (a) gate by user_has_min_role('admin')
  // before mutating, and (b) revalidate the right slug-keyed path on success.
  // RLS on reports.SELECT allows the caller to read either their own report
  // OR any report in a community where they are an admin — both cases are
  // fine here because the UPDATE that follows will fail RLS for a non-admin.
  const { data: report, error: lookupErr } = await supabase
    .from('reports')
    .select('community_id')
    .eq('id', reportId)
    .maybeSingle();
  if (lookupErr) throw new Error(lookupErr.message);
  if (!report) {
    return { ok: false, code: 'not_found', message: 'Report not found or already resolved.' };
  }

  const { data: isAdmin, error: roleErr } = await supabase.rpc('user_has_min_role', {
    p_community_id: report.community_id,
    p_min_role: 'admin',
  });
  if (roleErr) throw new Error(roleErr.message);
  if (!isAdmin) {
    return {
      ok: false,
      code: 'insufficient_permissions',
      message: 'Only community admins or the owner can resolve reports.',
    };
  }

  const { error: updateErr } = await supabase
    .from('reports')
    .update({
      status,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (updateErr) {
    if (updateErr.message.includes('row-level security')) {
      return {
        ok: false,
        code: 'insufficient_permissions',
        message: 'You do not have permission to resolve this report.',
      };
    }
    throw new Error(updateErr.message);
  }

  const slug = await resolveCommunitySlug(report.community_id);
  revalidatePath(`/c/${slug}/moderation`);
  return { ok: true };
}
