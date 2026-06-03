'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { requireAuth } from '@/lib/auth';

const UpdateProfileSchema = z.object({
  display_name: z.string().min(1).max(80).trim().optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/i, 'Letters, numbers, underscores only')
    .nullable()
    .optional(),
  bio: z.string().max(500).nullable().optional(),
  persona: z.enum(['member', 'owner']).optional(),
  interests: z.array(z.string()).optional(),
  occupation: z.string().max(100).optional(),
});

export async function updateProfile(
  input: z.infer<typeof UpdateProfileSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { user } = await requireAuth();
  const supabase = await getSupabaseServerClient();

  // PARTIAL update — only write fields the caller actually provided. Onboarding
  // steps (persona, interests) must never blank out display_name/username/bio.
  const d = parsed.data;
  const updates = {
    updated_at: new Date().toISOString(),
    ...(d.display_name !== undefined ? { display_name: d.display_name } : {}),
    ...(d.username !== undefined ? { username: d.username } : {}),
    ...(d.bio !== undefined ? { bio: d.bio } : {}),
    ...(d.persona !== undefined ? { persona: d.persona } : {}),
    ...(d.interests !== undefined ? { interests: d.interests } : {}),
    ...(d.occupation !== undefined ? { occupation: d.occupation } : {}),
  };

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Username already taken' };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath('/settings');
  return { ok: true };
}

// Raster images only. SVG is intentionally excluded — it can carry inline
// script and the avatars bucket is served publicly (stored-XSS vector).
const AVATAR_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']);
const AVATAR_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']);

export async function uploadAvatar(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const file = formData.get('file') as File;
  if (!file) return { ok: false, error: 'No file provided' };

  if (file.size > 2 * 1024 * 1024) return { ok: false, error: 'File too large (max 2MB)' };
  if (!AVATAR_MIME.has(file.type)) {
    return { ok: false, error: 'Use a JPG, PNG, GIF, WebP, or AVIF image.' };
  }
  const rawExt = file.name.split('.').pop()?.toLowerCase() ?? '';
  const safeExt = rawExt.replace(/[^a-z0-9]/g, '');
  if (!AVATAR_EXT.has(safeExt)) {
    return { ok: false, error: 'Unsupported file extension.' };
  }

  const { user } = await requireAuth();
  const supabase = await getSupabaseServerClient();

  const fileName = `${user.id}/${Date.now()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  // Update profile with new avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath('/settings');
  return { ok: true, url: publicUrl };
}
