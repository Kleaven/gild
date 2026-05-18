import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunityContextBySlug } from '@/lib/community/context';
import { getCourses } from '@/lib/courses';
import { StudioCoursesList } from '@/components/StudioCoursesList';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CoursesPage({ params }: Props) {
  const { slug } = await params;

  const supabase = await getSupabaseServerClient();
  const { community, membership } = await getCommunityContextBySlug(slug);

  if (!community) {
    notFound();
  }

  const communityId = community.id;

  const courses = await getCourses(supabase, communityId);
  const isAdminOrOwner =
    membership?.role === 'owner' || membership?.role === 'admin';

  return (
    <StudioCoursesList
      community={{
        id: communityId,
        slug,
        name: community.name,
      }}
      courses={courses}
      isAdminOrOwner={isAdminOrOwner}
    />
  );
}
