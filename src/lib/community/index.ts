export { getCommunity, getCommunityBySlug, getCommunityMembers, getMembership, getMembershipTiers, getDiscoverCommunities } from './queries';

export {
  createCommunity,
  joinCommunity,
  leaveCommunity,
  updateMemberRole,
  transferOwnership,
} from './actions';

export {
  getSpaces,
  getSpace,
  createSpace,
  updateSpace,
  deleteSpace,
  reorderSpaces,
} from './spaces';

export { getDashboardStats } from './dashboard';
export type { DashboardStats } from './dashboard';

export {
  getCustomDomainState,
  setCustomDomain,
  verifyCustomDomain,
  removeCustomDomain,
} from './domains';
export type { CustomDomainState, CustomDomainStatus, DnsInstruction, DomainResult } from './domains';

export type {
  Community,
  CommunityMember,
  MemberProfile,
  MembershipTier,
  AssignableRole,
  Space,
  CreateCommunityInput,
  UpdateMemberRoleInput,
  CreateSpaceInput,
  UpdateSpaceInput,
} from './types';
