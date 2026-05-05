import { requirePlatformAdmin } from '@/lib/admin/guards';
import { getAdminCommunities } from '@/lib/admin';
import type { AdminCommunityRow } from '@/lib/admin';
import AdminSearch from './AdminSearch';

type Props = { searchParams: Promise<{ q?: string }> };

function PlanBadge({ plan }: { plan: string }) {
  const cls =
    plan === 'pro'
      ? 'bg-amber-900/40 text-amber-400'
      : 'bg-neutral-800 text-neutral-300';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${cls}`}>
      {plan}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const colorMap: Record<string, string> = {
    active:   'text-emerald-400',
    trialing: 'text-sky-400',
    past_due: 'text-amber-400',
    canceled: 'text-neutral-500',
  };
  const cls = status ? (colorMap[status] ?? 'text-neutral-400') : 'text-neutral-400';
  return (
    <span className={`text-xs font-medium capitalize ${cls}`}>
      {status ? status.replace('_', ' ') : '—'}
    </span>
  );
}

const thClass =
  'px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide';

export default async function AdminCommunitiesPage({ searchParams }: Props) {
  await requirePlatformAdmin();
  const { q } = await searchParams;
  const communities: AdminCommunityRow[] = await getAdminCommunities(q ?? null);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Communities</h1>
      <p className="text-neutral-400 text-sm mb-6">{communities.length} communities</p>

      <AdminSearch defaultValue={q ?? ''} />

      <div className="mt-6 rounded-xl border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/60">
              <th className={thClass}>Community</th>
              <th className={thClass}>Owner</th>
              <th className={thClass}>Plan</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Members</th>
              <th className={thClass}>Created</th>
            </tr>
          </thead>
          <tbody>
            {communities.map((c) => (
              <tr
                key={c.id}
                className="border-b border-neutral-800/60 hover:bg-neutral-900/40 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{c.name}</div>
                  <div className="text-neutral-500 text-xs">{c.slug}</div>
                </td>
                <td className="px-4 py-3 text-neutral-400">{c.ownerEmail ?? '—'}</td>
                <td className="px-4 py-3">
                  <PlanBadge plan={c.plan} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.subscriptionStatus} />
                </td>
                <td className="px-4 py-3 text-neutral-400">{c.memberCount}</td>
                <td className="px-4 py-3 text-neutral-400">
                  {new Date(c.createdAt).toLocaleDateString('en-SG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {communities.length === 0 && (
          <div className="px-4 py-12 text-center text-neutral-500 text-sm">
            No communities found.
          </div>
        )}
      </div>
    </div>
  );
}
