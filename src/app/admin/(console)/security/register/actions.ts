'use server';

import { revalidatePath } from 'next/cache';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/browser';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/auth/server';
import { generateAdminRegistrationOptions, verifyAdminRegistration } from '@/lib/auth/webauthn';

// Discriminated union — predictable failures return ok:false; throws are
// reserved for genuinely unexpected errors so they surface as 500s in
// monitoring.
type AddKeyOptionsResult =
  | { ok: true; options: PublicKeyCredentialCreationOptionsJSON; adminId: string; adminEmail: string }
  | { ok: false; code: 'NOT_AUTHENTICATED' | 'NOT_ADMIN' | 'CHALLENGE_FAILED'; message: string };

type VerifyAndAddKeyResult =
  | { ok: true; credentialId: string }
  | {
      ok: false;
      code: 'NOT_AUTHENTICATED' | 'NOT_ADMIN' | 'CHALLENGE_MISMATCH' | 'DUPLICATE_KEY' | 'VERIFICATION_FAILED' | 'STORAGE_FAILED';
      message: string;
    };

async function resolveAdminFromSession(): Promise<
  | { ok: true; adminId: string; adminEmail: string }
  | { ok: false; code: 'NOT_AUTHENTICATED' | 'NOT_ADMIN'; message: string }
> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, code: 'NOT_AUTHENTICATED', message: 'Sign in required.' };
  }

  // platform_admins is locked to service role — use service client.
  const serviceClient = getSupabaseServiceClient();
  const { data: adminRow } = await serviceClient
    .from('platform_admins')
    .select('id, email')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) {
    return { ok: false, code: 'NOT_ADMIN', message: 'Not a platform admin.' };
  }

  return { ok: true, adminId: adminRow.id, adminEmail: adminRow.email };
}

export async function getAddKeyRegistrationOptions(): Promise<AddKeyOptionsResult> {
  const session = await resolveAdminFromSession();
  if (!session.ok) return session;

  const { data: options, error } = await generateAdminRegistrationOptions(
    session.adminId,
    session.adminEmail,
  );
  if (error || !options) {
    return {
      ok: false,
      code: 'CHALLENGE_FAILED',
      message: error?.message ?? 'Failed to generate registration challenge.',
    };
  }

  return {
    ok: true,
    options,
    adminId: session.adminId,
    adminEmail: session.adminEmail,
  };
}

export async function verifyAndAddKey(
  response: RegistrationResponseJSON,
  friendlyName: string,
): Promise<VerifyAndAddKeyResult> {
  const session = await resolveAdminFromSession();
  if (!session.ok) return session;

  const trimmedName = friendlyName.trim().slice(0, 64);

  const { data: verified, error: verifyError } = await verifyAdminRegistration(
    session.adminId,
    response,
  );

  if (verifyError) {
    if (verifyError.code === 'SESSION_EXPIRED') {
      return {
        ok: false,
        code: 'CHALLENGE_MISMATCH',
        message: 'Registration challenge expired. Please try again.',
      };
    }
    return {
      ok: false,
      code: 'VERIFICATION_FAILED',
      message: verifyError.message,
    };
  }

  if (!verified) {
    return {
      ok: false,
      code: 'VERIFICATION_FAILED',
      message: 'WebAuthn verification did not succeed.',
    };
  }

  // verifyAdminRegistration already INSERTed the row with no friendly_name.
  // Patch it now so the SecurityKeysClient list shows what the admin typed.
  if (trimmedName.length > 0) {
    const serviceClient = getSupabaseServiceClient();
    const { error: nameError } = await serviceClient
      .from('webauthn_credentials')
      .update({ friendly_name: trimmedName })
      .eq('credential_id', verified.credentialId)
      .eq('admin_id', session.adminId);

    if (nameError) {
      // Name update is best-effort — credential is registered either way.
      // The list shows "Unnamed key" until the admin re-titles via a future flow.
      return { ok: true, credentialId: verified.credentialId };
    }
  }

  revalidatePath('/admin/security');
  return { ok: true, credentialId: verified.credentialId };
}
