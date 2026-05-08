import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunityContext } from '@/lib/community/context';
import { getCourses } from '@/lib/courses';
import { StudioCoursesList } from '@/components/StudioCoursesList';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string }>;
};

export default async function CoursesPage({ params }: Props) {
  const { communityId } = await params;

  if (!UUID_RE.test(communityId)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();
  const { community, membership } = await getCommunityContext(communityId);

  if (!community) {
    notFound();
  }

  const courses = await getCourses(supabase, communityId);
  const isAdminOrOwner =
    membership?.role === 'owner' || membership?.role === 'admin';

  return (
    <StudioCoursesList
      community={{
        id: communityId,
        name: community.name,
      }}
      courses={courses}
      isAdminOrOwner={isAdminOrOwner}
    />
  );
}
