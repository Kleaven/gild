import 'server-only';

import db from '../db';
import { env } from '../env';
import { isPro, type SubscriptionStatus } from '../billing/gates';
import type { Plan } from '../billing/plans';

// ─── Custom domains (Pro) ────────────────────────────────────────────────────
// A Pro community can map its own domain to its Gild community. Flow:
//   1. Owner enters domain  → we register it with Vercel (SSL) + store 'pending'
//   2. Owner points DNS     → CNAME (subdomain) or A record (apex)
//   3. Owner clicks Verify  → we check Vercel's config; flip to 'active'
//   4. Middleware rewrites   → host → resolve_custom_domain() → /c/[slug]
// All mutations are owner-only AND Pro-only. Vercel calls are no-ops with a
// readable error when VERCEL_* env vars are unset (feature simply inert).

export type CustomDomainStatus = 'pending' | 'active' | 'error';

export interface CustomDomainState {
  domain: string | null;
  status: CustomDomainStatus | null;
  dns: DnsInstruction | null;
}

export interface DnsInstruction {
  type: 'A' | 'CNAME';
  name: string;
  value: string;
}

export type DomainResult =
  | { ok: true; state: CustomDomainState }
  | { ok: false; error: string };

const VERCEL_API = 'https://api.vercel.com';
const APEX_IP = '76.76.21.21';
const CNAME_TARGET = 'cname.vercel-dns.com';

function vercelConfigured(): boolean {
  return Boolean(env.VERCEL_API_TOKEN && env.VERCEL_PROJECT_ID);
}

function teamQuery(): string {
  return env.VERCEL_TEAM_ID ? `?teamId=${env.VERCEL_TEAM_ID}` : '';
}

function vercelHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${env.VERCEL_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

// A bare apex (example.com) gets an A record; anything with a subdomain
// (community.example.com) gets a CNAME. Two labels = apex.
function isApex(domain: string): boolean {
  return domain.split('.').length === 2;
}

function dnsFor(domain: string): DnsInstruction {
  return isApex(domain)
    ? { type: 'A', name: '@', value: APEX_IP }
    : { type: 'CNAME', name: domain.split('.')[0] ?? domain, value: CNAME_TARGET };
}

function normalizeDomain(raw: string): string | null {
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, '');
  // hostname: labels of a-z0-9/hyphen, at least one dot, valid TLD shape
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d)) {
    return null;
  }
  if (d.length > 253) return null;
  // Block our own apex/subdomains — creators can't hijack the platform host.
  const appHost = (() => {
    try { return new URL(env.NEXT_PUBLIC_APP_URL).hostname.toLowerCase(); } catch { return ''; }
  })();
  if (appHost && (d === appHost || d.endsWith(`.${appHost}`))) return null;
  if (d.endsWith('.vercel.app')) return null;
  return d;
}

async function vercelAddDomain(name: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${VERCEL_API}/v10/projects/${env.VERCEL_PROJECT_ID}/domains${teamQuery()}`, {
    method: 'POST',
    headers: vercelHeaders(),
    body: JSON.stringify({ name }),
  });
  if (res.ok) return { ok: true };
  const body = await res.json().catch(() => ({}));
  const code = body?.error?.code;
  // Domain already attached to this project is fine (idempotent re-add).
  if (code === 'domain_already_in_use' || res.status === 409) return { ok: true };
  return { ok: false, error: body?.error?.message ?? `Vercel returned ${res.status}` };
}

async function vercelRemoveDomain(name: string): Promise<void> {
  await fetch(`${VERCEL_API}/v9/projects/${env.VERCEL_PROJECT_ID}/domains/${name}${teamQuery()}`, {
    method: 'DELETE',
    headers: vercelHeaders(),
  }).catch(() => {/* best-effort cleanup; ignore */});
}

// Vercel reports misconfigured=true until the creator's DNS resolves to us.
async function vercelIsVerified(name: string): Promise<boolean> {
  const res = await fetch(`${VERCEL_API}/v6/domains/${name}/config${teamQuery()}`, {
    headers: vercelHeaders(),
  });
  if (!res.ok) return false;
  const body = await res.json().catch(() => ({ misconfigured: true }));
  return body?.misconfigured === false;
}

interface CommunityDomainRow {
  owner_id: string;
  plan: Plan;
  subscription_status: SubscriptionStatus | null;
  custom_domain: string | null;
  custom_domain_status: CustomDomainStatus | null;
}

async function loadRow(communityId: string): Promise<CommunityDomainRow | null> {
  const rows = await db<CommunityDomainRow[]>`
    SELECT owner_id, plan, subscription_status, custom_domain, custom_domain_status
    FROM public.communities
    WHERE id = ${communityId} AND deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] ?? null;
}

function stateFrom(row: CommunityDomainRow): CustomDomainState {
  return {
    domain: row.custom_domain,
    status: row.custom_domain_status,
    dns: row.custom_domain ? dnsFor(row.custom_domain) : null,
  };
}

export async function getCustomDomainState(communityId: string): Promise<CustomDomainState> {
  // Defensive: tolerate the pre-migration window (columns not yet added) so the
  // owner's settings page never 500s on a missing column.
  try {
    const row = await loadRow(communityId);
    if (!row) return { domain: null, status: null, dns: null };
    return stateFrom(row);
  } catch {
    return { domain: null, status: null, dns: null };
  }
}

export async function setCustomDomain(
  communityId: string,
  ownerUserId: string,
  rawDomain: string,
): Promise<DomainResult> {
  const row = await loadRow(communityId);
  if (!row) return { ok: false, error: 'Community not found.' };
  if (row.owner_id !== ownerUserId) return { ok: false, error: 'Only the community owner can set a custom domain.' };
  if (!isPro({ plan: row.plan, subscriptionStatus: row.subscription_status })) {
    return { ok: false, error: 'Custom domains are a Pro feature. Upgrade to connect your own domain.' };
  }
  if (!vercelConfigured()) {
    return { ok: false, error: 'Custom domains aren’t configured on this deployment yet. Contact support.' };
  }

  const domain = normalizeDomain(rawDomain);
  if (!domain) return { ok: false, error: 'That doesn’t look like a valid domain (e.g. community.yoursite.com).' };

  const added = await vercelAddDomain(domain);
  if (!added.ok) return { ok: false, error: added.error ?? 'Couldn’t register the domain.' };

  await db`
    UPDATE public.communities
    SET custom_domain = ${domain}, custom_domain_status = 'pending'
    WHERE id = ${communityId}
  `;

  return { ok: true, state: { domain, status: 'pending', dns: dnsFor(domain) } };
}

export async function verifyCustomDomain(
  communityId: string,
  ownerUserId: string,
): Promise<DomainResult> {
  const row = await loadRow(communityId);
  if (!row) return { ok: false, error: 'Community not found.' };
  if (row.owner_id !== ownerUserId) return { ok: false, error: 'Only the community owner can verify the domain.' };
  if (!row.custom_domain) return { ok: false, error: 'No custom domain is set.' };
  if (!vercelConfigured()) return { ok: false, error: 'Custom domains aren’t configured on this deployment yet.' };

  const verified = await vercelIsVerified(row.custom_domain);
  const status: CustomDomainStatus = verified ? 'active' : 'pending';
  await db`
    UPDATE public.communities
    SET custom_domain_status = ${status}
    WHERE id = ${communityId}
  `;

  if (!verified) {
    return { ok: false, error: 'DNS isn’t pointing to us yet. It can take a few minutes to a few hours after you add the record.' };
  }
  return { ok: true, state: { domain: row.custom_domain, status, dns: dnsFor(row.custom_domain) } };
}

export async function removeCustomDomain(
  communityId: string,
  ownerUserId: string,
): Promise<DomainResult> {
  const row = await loadRow(communityId);
  if (!row) return { ok: false, error: 'Community not found.' };
  if (row.owner_id !== ownerUserId) return { ok: false, error: 'Only the community owner can remove the domain.' };

  if (row.custom_domain && vercelConfigured()) {
    await vercelRemoveDomain(row.custom_domain);
  }
  await db`
    UPDATE public.communities
    SET custom_domain = NULL, custom_domain_status = NULL
    WHERE id = ${communityId}
  `;
  return { ok: true, state: { domain: null, status: null, dns: null } };
}
