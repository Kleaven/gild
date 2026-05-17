'use server';

import { z } from 'zod';
import { getSupabaseServerClient } from '../auth/server';
import { rateLimit } from '../rate-limit/index';
import type { DirectMessage, SendDirectMessageInput } from './types';

const sendSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(3000),
});

/**
 * Send a direct message. RLS enforces:
 *   - sender_id = caller (we set it explicitly below)
 *   - sender and receiver share at least one non-banned community membership
 *
 * Returns the inserted row so the client can swap its optimistic placeholder
 * for the canonical record (real id, server-side created_at).
 */
export async function sendDirectMessage(
  input: SendDirectMessageInput,
): Promise<DirectMessage> {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  }
  const { receiverId, content } = parsed.data;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('[gild] not authenticated');

  if (user.id === receiverId) {
    throw new Error('[gild] cannot DM yourself');
  }

  // Per-sender rate limit. Generous enough for natural conversation but
  // throttles a runaway client or scripted abuser.
  const rl = await rateLimit.directMessage(user.id);
  if (!rl.allowed) {
    throw new Error('[gild] message rate limit exceeded — slow down a moment');
  }

  const { data, error } = await supabase
    .from('direct_messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
    })
    .select('*')
    .single();

  if (error) {
    // RLS WITH CHECK violation surfaces as a generic Postgres error — translate
    // to a user-readable message for the most common failure mode.
    if (error.message.includes('row-level security')) {
      throw new Error('[gild] you can only message members of your communities');
    }
    throw new Error(error.message);
  }

  return data;
}

/**
 * Mark a single inbound message as read. Receiver-only via RLS UPDATE policy.
 * No-op if already read — UPDATE just rewrites read_at to a newer timestamp.
 */
export async function markMessageRead(messageId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('[gild] not authenticated');

  const { error } = await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
    .is('read_at', null);

  if (error) throw new Error(error.message);
}
