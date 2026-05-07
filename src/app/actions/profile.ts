'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { requireAuth } from '@/lib/auth';

const UpdateProfileSchema = z.object({
  display_name: z.string().min(1).max(80).trim(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/i, 'Letters, numbers, underscores only')
    .nullable()
    .optional(),
  bio: z.string().max(500).nullable().optional(),
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

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: parsed.data.display_name,
      username: parsed.data.username ?? null,
      bio: parsed.data.bio ?? null,
      updated_at: new Date().toISOString(),
    })
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
