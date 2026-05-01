'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/auth/server';
import { generateAdminRegistrationOptions, verifyAdminRegistration } from '@/lib/auth/webauthn';
import type { RegistrationResponseJSON } from '@simplewebauthn/browser';

export async function getRegistrationOptions(adminId: string, adminEmail: string, setupToken: string) {
  const serviceClient = getSupabaseServiceClient();
  
  // Verify token again before generating options
  const { data: adminRow } = await serviceClient
    .from('platform_admins')
    .select('id')
    .eq('id', adminId)
    .eq('setup_token', setupToken)
    .maybeSingle();

  if (!adminRow) {
    return { error: 'Invalid or expired setup token' };
  }

  const { data: options, error } = await generateAdminRegistrationOptions(adminId, adminEmail);
  if (error || !options) {
    return { error: error?.message || 'Failed to generate options' };
  }

  return { options };
}

export async function verifyAndExchangeToken(adminId: string, setupToken: string, response: RegistrationResponseJSON) {
  const serviceClient = getSupabaseServiceClient();

  // Verify token again
  const { data: adminRow } = await serviceClient
    .from('platform_admins')
    .select('id, email')
    .eq('id', adminId)
    .eq('setup_token', setupToken)
    .maybeSingle();

  if (!adminRow) {
    return { error: 'Invalid or expired setup token' };
  }

  // Verify WebAuthn registration
  const { data: verification, error: verifyError } = await verifyAdminRegistration(adminId, response);
  
  if (verifyError || !verification) {
    return { error: verifyError?.message || 'Verification failed' };
  }

  // Nullify setup_token immediately
  await serviceClient
    .from('platform_admins')
    .update({ setup_token: null })
    .eq('id', adminId);

  // Mint session using the Server-Side Token Exchange pattern
  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
    type: 'magiclink',
    email: adminRow.email,
  });

  if (linkError || !linkData?.properties?.action_link) {
    return { error: 'Failed to mint session token' };
  }

  const url = new URL(linkData.properties.action_link);
  const tokenHash = url.searchParams.get('token');

  if (!tokenHash) {
    return { error: 'Invalid token generated' };
  }

  const supabase = await getSupabaseServerClient();
  const { error: sessionError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink',
  });

  if (sessionError) {
    return { error: 'Failed to exchange token for session' };
  }

  return { success: true };
}
