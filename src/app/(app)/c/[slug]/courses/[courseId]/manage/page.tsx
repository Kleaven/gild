import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunityContextBySlug } from '@/lib/community/context';
import { getCourse } from '@/lib/courses';
import { listTiers } from '@/lib/community/tiers';
import { StudioCourseEditor } from '@/components/StudioCourseEditor';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ slug: string; courseId: string }>;
};

export default async function CourseManagePage({ params }: Props) {
  const { slug, courseId } = await params;

  if (!UUID_RE.test(courseId)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();
  const { community, membership } = await getCommunityContextBySlug(slug);

  if (!community) {
    notFound();
  }

  const communityId = community.id;

  const course = await getCourse(supabase, courseId);

  if (!course || course.community_id !== communityId) {
    notFound();
  }

  const isAdminOrOwner =
    membership?.role === 'owner' || membership?.role === 'admin';

  if (!isAdminOrOwner) {
    notFound(); // Only admins can manage courses
  }

  const tiers = await listTiers(communityId); // active tiers for the paywall picker

  return (
    <StudioCourseEditor
      communityId={communityId}
      communitySlug={slug}
      course={course}
      tiers={tiers.map((t) => ({ id: t.id, name: t.name, priceMonthUsd: t.priceMonthUsd }))}
    />
  );
}
