import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { searchPosts, searchMembers } from '@/lib/search';
import { getCommunityContext } from '@/lib/community/context';
import SearchInput from './SearchInput';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string }>;
  searchParams: Promise<{ q?: string; scope?: string }>;
};

export default async function SearchPage({ params, searchParams }: Props) {
  const { communityId } = await params;

  if (!UUID_RE.test(communityId)) {
    notFound();
  }

  const { q, scope } = await searchParams;
  const query = q?.trim() ?? '';
  const resolvedScope = scope === 'members' ? 'members' : 'posts';

  const { community } = await getCommunityContext(communityId);
  if (!community) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();

  const postResults =
    resolvedScope === 'posts' && query
      ? (await searchPosts(supabase, communityId, query, { limit: 20 })).data
      : [];

  const memberResults =
    resolvedScope === 'members' && query
      ? (await searchMembers(supabase, communityId, query, { limit: 20 })).data
      : [];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Search</h1>

      <Suspense>
        <SearchInput />
      </Suspense>

      {!query && (
        <p style={{ color: '#aaa', textAlign: 'center', paddingTop: 24 }}>
          Enter a search term above.
        </p>
      )}

      {query && resolvedScope === 'posts' && (
        <>
          {postResults.length === 0 ? (
            <p style={{ color: '#aaa' }}>No posts found for &ldquo;{query}&rdquo;.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {postResults.map((post) => (
                <li
                  key={post.id}
                  style={{ border: '1px solid #eee', borderRadius: 8, padding: '14px 18px' }}
                >
                  <Link
                    href={`/c/${communityId}/s/${post.space_id}/p/${post.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {post.title && (
                      <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>
                        {post.title}
                      </h3>
                    )}
                    <p
                      style={{ fontSize: 13, color: '#555', margin: '0 0 8px', lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: post.snippet }}
                    />
                    <div style={{ fontSize: 12, color: '#aaa', display: 'flex', gap: 10 }}>
                      <span>{post.author_display_name ?? 'Unknown'}</span>
                      <span>{post.space_name}</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {query && resolvedScope === 'members' && (
        <>
          {memberResults.length === 0 ? (
            <p style={{ color: '#aaa' }}>No members found for &ldquo;{query}&rdquo;.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {memberResults.map((member) => (
                <li
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: '1px solid #eee',
                    borderRadius: 8,
                    padding: '12px 16px',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#e0e0e0',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{member.display_name}</p>
                    {member.username && (
                      <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>@{member.username}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
