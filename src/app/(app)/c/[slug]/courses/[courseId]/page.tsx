import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunityContextBySlug } from '@/lib/community/context';
import { getCourse, getEnrollment, enrollInCourse, getLessonProgress, computeCourseAccess, getCourseTierGating } from '@/lib/courses';
import { confirmTierCheckout } from '@/lib/billing/member-subscription';
import { getCertificate } from '@/lib/courses/certificate.queries';
import { issueCertificate } from '@/lib/courses/certificate.actions';
import { StudioCourseDetail } from '@/components/StudioCourseDetail';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ slug: string; courseId: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CourseDetailPage({ params, searchParams }: Props) {
  const { slug, courseId } = await params;
  const { session_id: checkoutSessionId } = await searchParams;

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

  // Non-admin members must not see unpublished courses
  if (!course.is_published && !isAdminOrOwner) {
    notFound();
  }

  const enrollment = await getEnrollment(supabase, courseId);
  const isEnrolled = enrollment !== null;
  const progressRows = isEnrolled ? await getLessonProgress(supabase, courseId) : [];
  const completedLessonsCount = progressRows.length;
  const certificate = isEnrolled ? await getCertificate(supabase, courseId) : null;

  // Sequential unlock: later modules stay locked until earlier ones are done.
  // A progress row only counts when actually completed (completed_at set) —
  // never assume "row exists" means done.
  const completedLessonIds = new Set(
    progressRows.filter((p) => p.completed_at !== null).map((p) => p.lesson_id),
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Just returned from Stripe Checkout — confirm the subscription and grant the
  // tier immediately, so the module unlocks without waiting on the webhook.
  if (checkoutSessionId && user) {
    try {
      await confirmTierCheckout(communityId, checkoutSessionId, user.id);
    } catch {
      // Non-fatal — the connect webhook is the backstop.
    }
  }

  const tierGating = await getCourseTierGating(
    communityId,
    user?.id ?? null,
    course.modules.map((m) => m.id),
  );
  const access = computeCourseAccess(course, completedLessonIds, isAdminOrOwner, tierGating);

  async function enrollAction() {
    'use server';
    await enrollInCourse(courseId);
    revalidatePath(`/c/${slug}/courses/${courseId}`);
  }

  async function claimCertificateAction() {
    'use server';
    if (enrollment) {
      await issueCertificate(enrollment.id);
      revalidatePath(`/c/${slug}/courses/${courseId}`);
    }
  }

  return (
    <StudioCourseDetail
      community={{
        id: communityId,
        slug,
        name: community.name,
      }}
      course={course}
      isEnrolled={isEnrolled}
      isAdminOrOwner={isAdminOrOwner}
      completedLessonsCount={completedLessonsCount}
      hasCertificate={!!certificate}
      moduleAccess={access.modules}
      unlockedLessonIds={Array.from(access.unlockedLessonIds)}
      courseComplete={access.courseComplete}
      enrollAction={enrollAction}
      claimCertificateAction={claimCertificateAction}
    />
  );
}
