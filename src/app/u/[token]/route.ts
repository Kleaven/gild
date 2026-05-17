// One-click unsubscribe endpoint for COMMUNITY_BROADCAST emails.
//
// Hit by two flows:
//   GET  — user clicks "Unsubscribe" in email body. Renders a confirmation page.
//   POST — Gmail/Yahoo "List-Unsubscribe-Post: List-Unsubscribe=One-Click"
//          machinery hits this with no body, no auth. Must succeed in <30s
//          and return 200/204 to count as a valid one-click unsubscribe.
//
// The token is a UUID stored on community_members.unsubscribe_token (unique).
// Setting broadcast_opt_out = true is idempotent — repeat hits are safe.

import { NextResponse } from 'next/server';
import db from '@/lib/db';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Params = { params: Promise<{ token: string }> };

async function optOut(token: string): Promise<{ ok: boolean; communityName?: string }> {
  if (!UUID_RE.test(token)) return { ok: false };

  // Single statement: flip the flag and return the joined community name for
  // the confirmation page. No-op if already opted out (UPDATE still matches).
  const rows = await db<{ community_name: string }[]>`
    UPDATE public.community_members cm
       SET broadcast_opt_out = true
      FROM public.communities c
     WHERE cm.unsubscribe_token = ${token}::uuid
       AND c.id = cm.community_id
    RETURNING c.name AS community_name
  `;

  const row = rows[0];
  if (!row) return { ok: false };
  return { ok: true, communityName: row.community_name };
}

export async function POST(_req: Request, { params }: Params) {
  // Gmail/Yahoo one-click — must return 2xx with no body to be counted.
  const { token } = await params;
  const result = await optOut(token);
  // Even on invalid token we return 200 — refusing here would have Gmail
  // retry indefinitely, and revealing token validity is an info leak.
  return new NextResponse(null, { status: result.ok ? 200 : 200 });
}

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  const result = await optOut(token);

  if (!result.ok) {
    return new NextResponse(renderPage({
      title: 'Link expired',
      body: `<p>This unsubscribe link is no longer valid. You can manage your notification preferences in <a href="/settings/notifications" style="color:#444;">settings</a>.</p>`,
    }), {
      status: 410,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new NextResponse(renderPage({
    title: 'Unsubscribed',
    body: `<p>You've been removed from broadcast emails for <strong>${escapeHtml(result.communityName ?? 'this community')}</strong>.</p>
<p style="color:#666;font-size:14px;margin-top:24px;">You'll still receive transactional emails (billing, account changes). Visit <a href="/settings/notifications" style="color:#444;">notification settings</a> to re-enable broadcasts.</p>`,
  }), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPage({ title, body }: { title: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:64px 24px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Inter','Outfit',Helvetica,Arial,sans-serif;color:#111;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px 32px;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;letter-spacing:-0.02em;">${escapeHtml(title)}</h1>
    ${body}
  </div>
</body>
</html>`;
}
