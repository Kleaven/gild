'use server';

import {
  sendDirectMessage as libSend,
  markMessageRead as libMarkRead,
} from '@/lib/dm';
import type { DirectMessage, SendDirectMessageInput } from '@/lib/dm';

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
