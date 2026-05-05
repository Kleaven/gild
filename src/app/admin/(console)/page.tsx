import { requirePlatformAdmin } from '@/lib/admin/guards';
import { getAdminStats } from '@/lib/admin';
import type { AdminStats } from '@/lib/admin';

type StatCardProps = { label: string; value: number };

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
      <div className="text-3xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-xs text-neutral-500 mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default async function AdminOverviewPage() {
  await requirePlatformAdmin();
  const stats: AdminStats = await getAdminStats();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Overview</h1>
      <p className="text-neutral-400 text-sm mb-10">Platform operational metrics</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Communities" value={stats.totalCommunities} />
        <StatCard label="Total Users"        value={stats.totalUsers} />
        <StatCard label="Hobby"              value={stats.hobbyCount} />
        <StatCard label="Pro"                value={stats.proCount} />
        <StatCard label="Trialing"           value={stats.trialingCount} />
        <StatCard label="Active"             value={stats.activeCount} />
        <StatCard label="Past Due"           value={stats.pastDueCount} />
      </div>
    </div>
  );
}
