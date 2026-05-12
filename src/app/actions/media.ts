'use server';

import { getSupabaseServerClient } from '../../lib/auth/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function uploadMedia(
  communityId: string,
  formData: FormData
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not authenticated' };

    const file = formData.get('file') as File;
    if (!file) return { ok: false, error: 'No file provided' };

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${communityId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (uploadError) {
      console.error('[uploadMedia] Supabase error:', uploadError);
      return { ok: false, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return { ok: true, url: publicUrl };
  } catch (err) {
    console.error('[uploadMedia] unexpected error:', err);
    return { ok: false, error: 'Internal server error' };
  }
}
