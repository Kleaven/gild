import 'server-only';
import db from '../db';
import { getSupabaseServiceClient } from '../auth/server';

export type UserDataExport = {
  exportedAt: string;
  profile: {
    id: string;
    displayName: string;
    username: string | null;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: string;
  };
  communities: Array<{
    communityId: string;
    communityName: string;
    role: string;
    joinedAt: string;
  }>;
  enrollments: Array<{
    courseId: string;
    courseName: string;
    enrolledAt: string;
    completedAt: string | null;
  }>;
  certificates: Array<{
    certificateId: string;
    courseName: string;
    issuedAt: string;
    verificationToken: string;
  }>;
  postCount: number;
  commentCount: number;
};

type ProfileRow = {
  id: string;
  display_name: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: Date;
};

type CommunityRow = {
  community_id: string;
  community_name: string;
  role: string;
  joined_at: Date;
};

type EnrollmentRow = {
  course_id: string;
  course_name: string;
  enrolled_at: Date;
  completed_at: Date | null;
};

type CertificateRow = {
  certificate_id: string;
  course_name: string;
  issued_at: Date;
  verification_token: string;
};

type CountRow = {
  post_count: number;
  comment_count: number;
};

export async function exportUserData(userId: string): Promise<UserDataExport> {
  const [profileRows, communityRows, enrollmentRows, certificateRows, countRows] =
    await Promise.all([
      db<ProfileRow[]>`
        SELECT id, display_name, username, bio, avatar_url, created_at
        FROM profiles
        WHERE id = ${userId}
      `,
      db<CommunityRow[]>`
        SELECT cm.community_id, c.name AS community_name,
               cm.role, cm.created_at AS joined_at
        FROM community_members cm
        JOIN communities c ON c.id = cm.community_id
        WHERE cm.user_id = ${userId}
        ORDER BY cm.created_at DESC
      `,
      db<EnrollmentRow[]>`
        SELECT e.course_id, c.title AS course_name,
               e.created_at AS enrolled_at, e.completed_at
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE e.user_id = ${userId}
        ORDER BY e.created_at DESC
      `,
      db<CertificateRow[]>`
        SELECT cert.id AS certificate_id, c.title AS course_name,
               cert.issued_at, cert.verification_token
        FROM certificates cert
        JOIN courses c ON c.id = cert.course_id
        WHERE cert.user_id = ${userId}
        ORDER BY cert.issued_at DESC
      `,
      db<CountRow[]>`
        SELECT
          (SELECT count(*)::int FROM posts
           WHERE author_id = ${userId}
             AND deleted_at IS NULL) AS post_count,
          (SELECT count(*)::int FROM comments
           WHERE author_id = ${userId}
             AND deleted_at IS NULL) AS comment_count
      `,
    ]);

  const profile = profileRows[0];
  if (!profile) throw new Error('User not found');

  const counts = countRows[0];

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      id: profile.id,
      displayName: profile.display_name,
      username: profile.username,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at.toISOString(),
    },
    communities: communityRows.map((r) => ({
      communityId: r.community_id,
      communityName: r.community_name,
      role: r.role,
      joinedAt: r.joined_at.toISOString(),
    })),
    enrollments: enrollmentRows.map((r) => ({
      courseId: r.course_id,
      courseName: r.course_name,
      enrolledAt: r.enrolled_at.toISOString(),
      completedAt: r.completed_at ? r.completed_at.toISOString() : null,
    })),
    certificates: certificateRows.map((r) => ({
      certificateId: r.certificate_id,
      courseName: r.course_name,
      issuedAt: r.issued_at.toISOString(),
      verificationToken: r.verification_token,
    })),
    postCount: Number(counts?.post_count ?? 0),
    commentCount: Number(counts?.comment_count ?? 0),
  };
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const ownedRows = await db<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM communities
    WHERE owner_id = ${userId}
      AND deleted_at IS NULL
  `;
  const ownedCount = Number(ownedRows[0]?.count ?? 0);
  if (ownedCount > 0) {
    throw new Error(
      'You own one or more communities. Transfer ownership or delete your communities before deleting your account.',
    );
  }

  const serviceClient = getSupabaseServiceClient();
  const { error } = await serviceClient.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}
