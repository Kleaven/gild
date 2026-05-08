import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunityContext } from '@/lib/community/context';
import { getCourse, getEnrollment, enrollInCourse } from '@/lib/courses';
import { StudioCourseDetail } from '@/components/StudioCourseDetail';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string; courseId: string }>;
};

export default async function CourseDetailPage({ params }: Props) {
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

  // Non-admin members must not see unpublished courses
  if (!course.is_published && !isAdminOrOwner) {
    notFound();
  }

  const enrollment = await getEnrollment(supabase, courseId);
  const isEnrolled = enrollment !== null;

  async function enrollAction() {
    'use server';
    await enrollInCourse(courseId);
    revalidatePath(`/c/${communityId}/courses/${courseId}`);
  }

  return (
    <StudioCourseDetail
      community={{
        id: communityId,
        name: community.name,
      }}
      course={course}
      isEnrolled={isEnrolled}
      isAdminOrOwner={isAdminOrOwner}
      enrollAction={enrollAction}
    />
  );
}
