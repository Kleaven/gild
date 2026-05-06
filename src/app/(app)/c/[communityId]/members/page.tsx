import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunityMembers } from '@/lib/community';
import { getCommunityContext } from '@/lib/community/context';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string }>;
};

export default async function MembersPage({ params }: Props) {
  const { communityId } = await params;

  if (!UUID_RE.test(communityId)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();
  const { community } = await getCommunityContext(communityId);

  if (!community) {
    notFound();
  }

  const result = await getCommunityMembers(supabase, communityId, { limit: 50 });
  const members = result.data;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
        Members · {community.member_count}
      </h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px', color: '#666', fontWeight: 600 }}>Name</th>
            <th style={{ padding: '8px 12px', color: '#666', fontWeight: 600 }}>Username</th>
            <th style={{ padding: '8px 12px', color: '#666', fontWeight: 600 }}>Role</th>
            <th style={{ padding: '8px 12px', color: '#666', fontWeight: 600 }}>Joined</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.user_id} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td style={{ padding: '10px 12px' }}>{member.display_name}</td>
              <td style={{ padding: '10px 12px', color: '#888' }}>
                {member.username ? `@${member.username}` : '—'}
              </td>
              <td style={{ padding: '10px 12px', color: '#555', textTransform: 'capitalize' }}>
                {member.role.replace('_', ' ')}
              </td>
              <td style={{ padding: '10px 12px', color: '#aaa' }}>
                {new Date(member.joined_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {members.length === 0 && (
        <p style={{ color: '#aaa', textAlign: 'center', paddingTop: 32 }}>No members found.</p>
      )}
    </div>
  );
}
