import 'server-only';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

type TemplateFn = (vars: Record<string, string>) => RenderedEmail;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Escape values before interpolating into HTML — community/course names are
// user-chosen and must not be able to inject markup.
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function v(vars: Record<string, string>, key: string, fallback: string): string {
  return vars[key] ?? fallback;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ─── Template definitions ─────────────────────────────────────────────────────

const TEMPLATES: Record<string, TemplateFn> = {
  trial_ending_3_days: (vars) => {
    const name = v(vars, 'communityName', 'your community');
    return {
      subject: 'Your Gild trial ends in 3 days',
      html: `<p>Your Gild trial for <strong>${esc(name)}</strong> ends in 3 days.</p>
<p>Upgrade now to keep your community running without interruption.</p>
<p><a href="${baseUrl}/billing">Upgrade your plan →</a></p>`,
      text: `Your Gild trial for "${name}" ends in 3 days.\n\nUpgrade now to keep your community running without interruption.\n\nVisit ${baseUrl}/billing to upgrade.`,
    };
  },

  trial_expired: (vars) => {
    const name = v(vars, 'communityName', 'your community');
    return {
      subject: 'Your Gild trial has ended',
      html: `<p>Your Gild trial for <strong>${esc(name)}</strong> has ended and your community is now paused.</p>
<p>Subscribe to restore full access for your members.</p>
<p><a href="${baseUrl}/billing">Subscribe now →</a></p>`,
      text: `Your Gild trial for "${name}" has ended and your community is now paused.\n\nSubscribe to restore full access for your members.\n\nVisit ${baseUrl}/billing to subscribe.`,
    };
  },

  payment_failed: (vars) => {
    const name = v(vars, 'communityName', 'your community');
    return {
      subject: 'Payment failed — action required',
      html: `<p>We were unable to process your payment for <strong>${esc(name)}</strong>.</p>
<p>Please update your billing details to avoid interruption to your community.</p>
<p><a href="${baseUrl}/billing">Update billing →</a></p>`,
      text: `We were unable to process your payment for "${name}".\n\nPlease update your billing details to avoid interruption to your community.\n\nVisit ${baseUrl}/billing to update your payment method.`,
    };
  },

  subscription_canceled: (vars) => {
    const name = v(vars, 'communityName', 'your community');
    return {
      subject: 'Your Gild subscription has been canceled',
      html: `<p>Your Gild subscription for <strong>${esc(name)}</strong> has been canceled and your community is now paused.</p>
<p>You can resubscribe at any time to restore access.</p>
<p><a href="${baseUrl}/billing">Resubscribe →</a></p>`,
      text: `Your Gild subscription for "${name}" has been canceled and your community is now paused.\n\nYou can resubscribe at any time to restore access.\n\nVisit ${baseUrl}/billing to resubscribe.`,
    };
  },

  course_enrolled: (vars) => {
    const course = v(vars, 'courseTitle', 'the course');
    const community = v(vars, 'communityName', 'the community');
    return {
      subject: `You're enrolled in ${course}`,
      html: `<p>You've been enrolled in <strong>${esc(course)}</strong> in ${esc(community)}.</p>
<p>Head to your dashboard to start learning.</p>
<p><a href="${baseUrl}/dashboard">Start learning →</a></p>`,
      text: `You've been enrolled in "${course}" in ${community}.\n\nHead to your dashboard to start learning.\n\nVisit ${baseUrl}/dashboard to get started.`,
    };
  },

  COMMUNITY_BROADCAST: (vars) => {
    const communityName = v(vars, 'communityName', 'your community');
    const communitySlug = v(vars, 'communitySlug', '');
    const postTitle = v(vars, 'postTitle', '');
    const postBody = v(vars, 'postBody', '');
    const recipientName = v(vars, 'recipientName', '').trim() || 'there';
    const authorName = v(vars, 'authorName', 'A member');
    const unsubscribeToken = v(vars, 'unsubscribeToken', '');
    // Clamp hue to a valid range — themeHue arrives as string from JSONB and
    // could be malformed; an invalid hsl() declaration drops the entire rule.
    const rawHue = parseInt(v(vars, 'themeHue', '250'), 10);
    const hue = Number.isFinite(rawHue) ? ((rawHue % 360) + 360) % 360 : 250;
    // HSL is broadly supported across email clients (OKLCH is not).
    const btnBg = `hsl(${hue}, 55%, 32%)`;
    const accentBg = `hsl(${hue}, 40%, 96%)`;
    const accentBorder = `hsl(${hue}, 30%, 85%)`;
    const ctaUrl = `${baseUrl}/c/${esc(communitySlug)}`;
    // Unsubscribe URL — included in body link AND List-Unsubscribe header
    // (header is injected by sender.ts for this template). One-click POST
    // hits the same endpoint via Gmail/Yahoo bulk-sender machinery.
    const unsubUrl = unsubscribeToken
      ? `${baseUrl}/u/${esc(unsubscribeToken)}`
      : `${baseUrl}/settings/notifications`;

    // Preheader: hidden first ~100 chars of post body shown as inbox preview
    // text after the subject line. Apple Mail / Gmail render this; we hide
    // it visually via inline styles + zero-width spacer to push wallpaper.
    const preheaderSource = (postBody || `New post in ${communityName}`).replace(/\s+/g, ' ').trim();
    const preheader = preheaderSource.slice(0, 110);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${esc(postTitle || `New post in ${communityName}`)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Inter','Outfit',Helvetica,Arial,sans-serif;color:#111;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:transparent;">${esc(preheader)}&#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">

          <!-- Header band -->
          <tr>
            <td style="background:${btnBg};padding:24px 32px;">
              <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.85);">${esc(communityName)}</p>
              <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.7);font-weight:500;">Community broadcast</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 20px;font-size:14px;color:#555;">Hi ${esc(recipientName)},</p>
              ${postTitle ? `<h1 style="margin:0 0 20px;font-size:22px;font-weight:800;line-height:1.3;letter-spacing:-0.02em;color:#111;">${esc(postTitle)}</h1>` : ''}
              <div style="background:${accentBg};border-left:3px solid ${accentBorder};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;font-size:15px;line-height:1.7;color:#333;white-space:pre-wrap;">${esc(postBody)}</p>
              </div>
              <p style="margin:0 0 28px;font-size:13px;color:#666;">Posted by <strong style="color:#333;">${esc(authorName)}</strong> in <strong style="color:#333;">${esc(communityName)}</strong></p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 32px;">
              <a href="${ctaUrl}" style="display:inline-block;background:${btnBg};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.01em;padding:13px 28px;border-radius:10px;">Read &amp; reply in community →</a>
            </td>
          </tr>

          <!-- Footer with unsubscribe (legally required for bulk mail) -->
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e8e8ee;">
              <p style="margin:0 0 8px;font-size:13px;color:#666;line-height:1.6;">You received this because you're a member of <strong style="color:#444;">${esc(communityName)}</strong>.</p>
              <p style="margin:0;font-size:13px;color:#666;line-height:1.6;"><a href="${unsubUrl}" style="color:#666;text-decoration:underline;">Unsubscribe from broadcasts</a> &nbsp;·&nbsp; <a href="${baseUrl}/settings/notifications" style="color:#666;text-decoration:underline;">Notification settings</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = [
      `Hi ${recipientName},`,
      '',
      postTitle ? `${postTitle}\n` : '',
      postBody,
      '',
      `Posted by ${authorName} in ${communityName}.`,
      '',
      `Read and reply: ${ctaUrl}`,
      '',
      '---',
      `You received this because you're a member of ${communityName}.`,
      `Unsubscribe from broadcasts: ${unsubUrl}`,
    ].join('\n');

    return {
      subject: postTitle ? `${postTitle} — ${communityName}` : `New post in ${communityName}`,
      html,
      text,
    };
  },

  certificate_issued: (vars) => {
    const course = v(vars, 'courseTitle', 'the course');
    const recipient = v(vars, 'recipientName', 'there');
    const certUrl = v(vars, 'certificateUrl', '/dashboard');
    return {
      subject: `Your certificate is ready — ${course}`,
      html: `<p>Congratulations, ${esc(recipient)}! You've completed <strong>${esc(course)}</strong> and your certificate is ready.</p>
<p><a href="${baseUrl}${esc(certUrl)}">View your certificate →</a></p>`,
      text: `Congratulations, ${recipient}! You've completed "${course}" and your certificate is ready.\n\nView your certificate: ${baseUrl}${certUrl}`,
    };
  },
};

// ─── renderTemplate ───────────────────────────────────────────────────────────
// Routes to the correct template function by name.
// Never throws — returns a safe fallback for unknown template names.

export function renderTemplate(
  template: string,
  variables: Record<string, string>,
): RenderedEmail {
  const fn = TEMPLATES[template];
  if (!fn) {
    return {
      subject: 'A message from Gild',
      html: '<p>Please visit your Gild dashboard for updates.</p>',
      text: 'Please visit your Gild dashboard for updates.',
    };
  }
  return fn(variables);
}
