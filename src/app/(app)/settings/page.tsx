import { requireAuth } from '@/lib/auth';
import { StudioSettings } from '@/components/StudioSettings';

export default async function SettingsPage() {
  const { profile } = await requireAuth();

  return (
    <StudioSettings
      user={{
        id: profile.id,
        display_name: profile.display_name,
        username: profile.username,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
      }}
    />
  );
}
