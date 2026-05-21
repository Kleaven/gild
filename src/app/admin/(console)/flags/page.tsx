import { requirePlatformAdmin } from '@/lib/admin/guards';
import { getAdminCommunities, getGlobalFlags } from '@/lib/admin';
import FlagManager from './FlagManager';

export default async function AdminFlagsPage() {
  await requirePlatformAdmin();

  const [communities, globalFlags] = await Promise.all([
    getAdminCommunities(null),
    getGlobalFlags(),
  ]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <FlagManager globalFlags={globalFlags} communities={communities} />
    </div>
  );
}
