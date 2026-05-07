import { redirect } from 'next/navigation';

export default async function CommunitySettingsRedirect() {
  redirect('/settings');
}
