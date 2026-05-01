'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/auth/server';
import { generateAdminAuthenticationOptions, verifyAdminAuthentication } from '@/lib/auth/webauthn';
import type { AuthenticationResponseJSON } from '@simplewebauthn/browser';

export async function getAuthOptions(email: string) {
  const serviceClient = getSupabaseServiceClient();
  
  const { data: adminRow } = await serviceClient
    .from('platform_admins')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!adminRow) {
    // Return a generic error to prevent email enumeration
    return { error: 'Authentication failed' };
  }

  const { data: options, error } = await generateAdminAuthenticationOptions(adminRow.id);
  if (error || !options) {
    return { error: 'Authentication failed' };
  }

  return { options, adminId: adminRow.id };
}

export async function verifyAuthAndExchangeToken(adminId: string, email: string, response: AuthenticationResponseJSON) {
  const serviceClient = getSupabaseServiceClient();

  const { data: verification, error: verifyError } = await verifyAdminAuthentication(adminId, response);
  
  if (verifyError || !verification?.verified) {
    return { error: 'Authentication failed' };
  }

  // Verification successful, mint the session
  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
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
