// server-only — do not import from client components
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  PublicKeyCredentialRequestOptionsJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { getWebAuthnConfig } from './config';
import { storeChallenge, getChallenge, deleteChallenge } from './challenge';
import { getSupabaseServiceClient } from '../server';
import { parseAuthError } from '../errors';
import type { AuthResult } from '../types';

export async function generateAdminAuthenticationOptions(
  adminId: string,
): Promise<AuthResult<PublicKeyCredentialRequestOptionsJSON>> {
  const { rpID } = getWebAuthnConfig();
  const serviceClient = getSupabaseServiceClient();

  const { data: credentials } = await serviceClient
    .from('webauthn_credentials')
    .select('credential_id, transports')
    .eq('admin_id', adminId);

  if (!credentials || credentials.length === 0) {
    return {
      data: null,
      error: { code: 'USER_NOT_FOUND', message: 'No credentials registered for this admin' },
    };
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: credentials.map((c) => ({
      id: c.credential_id,
      transports: (c.transports ?? []) as AuthenticatorTransportFuture[],
    })),
  });

  await storeChallenge(adminId, options.challenge);
  return { data: options, error: null };
}

export async function verifyAdminAuthentication(
  adminId: string,
  response: AuthenticationResponseJSON,
): Promise<AuthResult<{ verified: true }>> {
  const { origin, rpID } = getWebAuthnConfig();

  const challenge = await getChallenge(adminId);
  if (!challenge) {
    return {
      data: null,
      error: { code: 'SESSION_EXPIRED', message: 'Challenge expired or not found' },
    };
  }

  const serviceClient = getSupabaseServiceClient();

  // Fetch the specific credential being used (matched by response.id).
  const { data: storedCredential } = await serviceClient
    .from('webauthn_credentials')
    .select('id, credential_id, public_key, sign_count, transports')
    .eq('admin_id', adminId)
    .eq('credential_id', response.id)
    .single();

  if (!storedCredential) {
    await deleteChallenge(adminId);
    return {
      data: null,
      error: { code: 'USER_NOT_FOUND', message: 'Credential not found' },
    };
  }

  let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: storedCredential.credential_id,
        publicKey: Buffer.from(storedCredential.public_key, 'base64'),
        counter: storedCredential.sign_count,
        transports: (storedCredential.transports ?? []) as AuthenticatorTransportFuture[],
      },
    });
  } catch (err) {
    await deleteChallenge(adminId);
    return { data: null, error: parseAuthError(err) };
  }

  // Always delete challenge after attempt — whether verified or not.
  await deleteChallenge(adminId);

  if (!verification.verified) {
    return { data: null, error: { code: 'UNKNOWN', message: 'Authentication verification failed' } };
  }

  // Update sign_count to prevent replay attacks.
  await serviceClient
    .from('webauthn_credentials')
    .update({
      sign_count: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', storedCredential.id);

  return { data: { verified: true }, error: null };
}
