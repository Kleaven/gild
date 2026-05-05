import 'server-only';
import db from '../db';

export type DashboardStats = {
  memberCount: number;
  postCount: number;
  spaceCount: number;
  courseCount: number;
};

export async function getDashboardStats(communityId: string): Promise<DashboardStats> {
  const rows = await db<DashboardStats[]>`
    SELECT
      (SELECT count(*) FROM community_members
       WHERE community_id = ${communityId} AND role != 'banned')::int  AS "memberCount",
      (SELECT count(*) FROM posts
       WHERE community_id = ${communityId} AND deleted_at IS NULL)::int AS "postCount",
      (SELECT count(*) FROM spaces
       WHERE community_id = ${communityId})::int                        AS "spaceCount",
      (SELECT count(*) FROM courses
       WHERE community_id = ${communityId} AND deleted_at IS NULL)::int AS "courseCount"
  `;
  const row = rows[0];
  if (!row) {
    return { memberCount: 0, postCount: 0, spaceCount: 0, courseCount: 0 };
  }
  return {
    memberCount: Number(row.memberCount),
    postCount: Number(row.postCount),
    spaceCount: Number(row.spaceCount),
    courseCount: Number(row.courseCount),
  };
}
