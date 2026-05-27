'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '../../lib/auth/server';
import crypto from 'crypto';

// Hardened MIME + extension whitelist. Rejects SVG (XSS via inline script),
// HTML, JS, executables, and anything else that could be served back from
// our public bucket and abused as phishing or script execution.
const ALLOWED_MIME = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
]);

const ALLOWED_EXT = new Set<string>([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif',
  'mp4', 'webm', 'mov',
  'pdf',
]);

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB hard cap

export async function uploadMedia(
  communityId: string,
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not authenticated' };

    // Hard membership check — the public bucket would otherwise let any
    // authenticated user write into any community's path just by passing a
    // different communityId. Service client bypasses RLS so we explicitly
    // re-enforce the membership constraint here.
    const serviceClient = getSupabaseServiceClient();
    const { data: membership } = await serviceClient
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership || membership.role === 'banned') {
      return { ok: false, error: 'Not a member of this community' };
    }

    const file = formData.get('file') as File;
    if (!file) return { ok: false, error: 'No file provided' };

    if (file.size > MAX_BYTES) {
      return { ok: false, error: `File too large (max ${MAX_BYTES / (1024 * 1024)} MB)` };
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return { ok: false, error: `Unsupported file type: ${file.type}` };
    }

    // Strip everything before the last '.', lowercase, strip non-[a-z0-9].
    // Defense against filename trickery like "evil.html.png" or
    // "evil.png\0;rm -rf /". The whitelist is the real gate; this is hygiene.
    const rawExt = file.name.split('.').pop()?.toLowerCase() ?? '';
    const safeExt = rawExt.replace(/[^a-z0-9]/g, '');
    if (!safeExt || !ALLOWED_EXT.has(safeExt)) {
      return { ok: false, error: `Unsupported file extension: .${safeExt}` };
    }

    const filePath = `${user.id}/${communityId}/${crypto.randomUUID()}.${safeExt}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false, // never overwrite — paths are UUID-fresh anyway
      });

    if (uploadError) {
      return { ok: false, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return { ok: true, url: publicUrl };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Internal server error',
    };
  }
}
