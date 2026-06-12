'use server';

import {
  sendDirectMessage as libSend,
  markMessageRead as libMarkRead,
  markThreadRead as libMarkThreadRead,
  getConversations as libGetConversations,
  getUnreadDmCount as libGetUnreadDmCount,
} from '@/lib/dm';
import { getSupabaseServerClient } from '@/lib/auth/server';
import type { Conversation, DirectMessage, SendDirectMessageInput } from '@/lib/dm';

/**
 * Thin wrapper around lib/dm — Server Actions need a 'use server'-marked
 * entry point that the bundler can register. No revalidatePath here: the
 * drawer is fully client-side state, no RSC subtree to invalidate.
 */
export async function sendDirectMessage(
  input: SendDirectMessageInput,
): Promise<{ ok: true; message: DirectMessage } | { ok: false; error: string }> {
  try {
    const message = await libSend(input);
    return { ok: true, message };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to send' };
  }
}

export async function markMessageRead(messageId: string): Promise<void> {
  await libMarkRead(messageId);
}

async function requireUserId(): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** The caller's DM inbox (latest message per peer + unread counts). */
export async function getDmConversations(): Promise<Conversation[]> {
  const userId = await requireUserId();
  if (!userId) return [];
  try {
    return await libGetConversations(userId);
  } catch (err) {
    console.error('[getDmConversations]', err);
    return [];
  }
}

/** Total unread DMs — drives the chat tab badge. */
export async function getDmUnreadCount(): Promise<number> {
  const userId = await requireUserId();
  if (!userId) return 0;
  try {
    return await libGetUnreadDmCount(userId);
  } catch {
    return 0;
  }
}

/** Mark a whole thread read when it's opened. */
export async function markDmThreadRead(peerId: string): Promise<void> {
  try {
    await libMarkThreadRead(peerId);
  } catch (err) {
    console.error('[markDmThreadRead]', err);
  }
}
