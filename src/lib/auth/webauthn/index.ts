// challenge internals (storeChallenge, getChallenge, deleteChallenge) are intentionally
// not exported — challenge management is internal to the webauthn module.

export { getWebAuthnConfig } from './config';

export {
  generateAdminRegistrationOptions,
  verifyAdminRegistration,
} from './registration';

export {
  generateAdminAuthenticationOptions,
  verifyAdminAuthentication,
} from './authentication';
