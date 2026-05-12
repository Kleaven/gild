import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunityContext } from '@/lib/community/context';
import { getCourse } from '@/lib/courses';
import { StudioCourseEditor } from '@/components/StudioCourseEditor';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string; courseId: string }>;
};

export default async function CourseManagePage({ params }: Props) {
  const { communityId, courseId } = await params;

  if (!UUID_RE.test(communityId) || !UUID_RE.test(courseId)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();
  const { community, membership } = await getCommunityContext(communityId);

  if (!community) {
    notFound();
  }

  const course = await getCourse(supabase, courseId);

  if (!course || course.community_id !== communityId) {
    notFound();
  }

  const isAdminOrOwner =
    membership?.role === 'owner' || membership?.role === 'admin';

  if (!isAdminOrOwner) {
    notFound(); // Only admins can manage courses
  }

  return (
    <StudioCourseEditor
      communityId={communityId}
      course={course}
    />
  );
}
