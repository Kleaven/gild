// server-only — do not import from client components
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type VerifiedRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { getWebAuthnConfig } from './config';
import { storeChallenge, getChallenge, deleteChallenge } from './challenge';
import { getSupabaseServiceClient } from '../server';
import { parseAuthError } from '../errors';
import type { AuthResult } from '../types';

export async function generateAdminRegistrationOptions(
  adminId: string,
  adminEmail: string,
): Promise<AuthResult<PublicKeyCredentialCreationOptionsJSON>> {
  const { rpName, rpID } = getWebAuthnConfig();
  const serviceClient = getSupabaseServiceClient();

  // Fetch existing credentials to prevent duplicate registrations.
  const { data: existingCreds } = await serviceClient
    .from('webauthn_credentials')
    .select('credential_id, transports')
    .eq('admin_id', adminId);

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: Buffer.from(adminId),
    userName: adminEmail,
    attestationType: 'none',
    authenticatorSelection: {
      userVerification: 'required',
      residentKey: 'required',
    },
    excludeCredentials: (existingCreds ?? []).map((c) => ({
      id: c.credential_id,
      transports: (c.transports ?? []) as AuthenticatorTransportFuture[],
    })),
  });

  await storeChallenge(adminId, options.challenge);
  return { data: options, error: null };
}

export async function verifyAdminRegistration(
  adminId: string,
  response: RegistrationResponseJSON,
): Promise<AuthResult<{ credentialId: string }>> {
  const { origin, rpID } = getWebAuthnConfig();

  const challenge = await getChallenge(adminId);
  if (!challenge) {
    return {
      data: null,
      error: { code: 'SESSION_EXPIRED', message: 'Challenge expired or not found' },
    };
  }

  let verification: VerifiedRegistrationResponse;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (err) {
    await deleteChallenge(adminId);
    return { data: null, error: parseAuthError(err) };
  }

  // Always delete challenge after attempt — whether verified or not.
  await deleteChallenge(adminId);

  if (!verification.verified || !verification.registrationInfo) {
    return {
      data: null,
      error: { code: 'UNKNOWN', message: 'Registration verification failed' },
    };
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  // credential.id is already a Base64URLString in @simplewebauthn/server v13.
  const credentialId = credential.id;

  const serviceClient = getSupabaseServiceClient();
  const { error: insertError } = await serviceClient.from('webauthn_credentials').insert({
    admin_id: adminId,
    credential_id: credentialId,
    public_key: Buffer.from(credential.publicKey).toString('base64'),
    sign_count: credential.counter,
    device_type: credentialDeviceType,
    backed_up: credentialBackedUp,
    transports: (credential.transports ?? null) as string[] | null,
  });

  if (insertError) {
    return { data: null, error: { code: 'UNKNOWN', message: 'Failed to store credential' } };
  }

  return { data: { credentialId }, error: null };
}
