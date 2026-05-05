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

// ─── Template definitions ─────────────────────────────────────────────────────

const TEMPLATES: Record<string, TemplateFn> = {
  trial_ending_3_days: (vars) => {
    const name = v(vars, 'communityName', 'your community');
    return {
      subject: 'Your Gild trial ends in 3 days',
      html: `<p>Your Gild trial for <strong>${esc(name)}</strong> ends in 3 days.</p>
<p>Upgrade now to keep your community running without interruption.</p>
<p><a href="/billing">Upgrade your plan →</a></p>`,
      text: `Your Gild trial for "${name}" ends in 3 days.\n\nUpgrade now to keep your community running without interruption.\n\nVisit /billing to upgrade.`,
    };
  },

  trial_expired: (vars) => {
    const name = v(vars, 'communityName', 'your community');
    return {
      subject: 'Your Gild trial has ended',
      html: `<p>Your Gild trial for <strong>${esc(name)}</strong> has ended and your community is now paused.</p>
<p>Subscribe to restore full access for your members.</p>
<p><a href="/billing">Subscribe now →</a></p>`,
      text: `Your Gild trial for "${name}" has ended and your community is now paused.\n\nSubscribe to restore full access for your members.\n\nVisit /billing to subscribe.`,
    };
  },

  payment_failed: (vars) => {
    const name = v(vars, 'communityName', 'your community');
    return {
      subject: 'Payment failed — action required',
      html: `<p>We were unable to process your payment for <strong>${esc(name)}</strong>.</p>
<p>Please update your billing details to avoid interruption to your community.</p>
<p><a href="/billing">Update billing →</a></p>`,
      text: `We were unable to process your payment for "${name}".\n\nPlease update your billing details to avoid interruption to your community.\n\nVisit /billing to update your payment method.`,
    };
  },

  subscription_canceled: (vars) => {
    const name = v(vars, 'communityName', 'your community');
    return {
      subject: 'Your Gild subscription has been canceled',
      html: `<p>Your Gild subscription for <strong>${esc(name)}</strong> has been canceled and your community is now paused.</p>
<p>You can resubscribe at any time to restore access.</p>
<p><a href="/billing">Resubscribe →</a></p>`,
      text: `Your Gild subscription for "${name}" has been canceled and your community is now paused.\n\nYou can resubscribe at any time to restore access.\n\nVisit /billing to resubscribe.`,
    };
  },

  course_enrolled: (vars) => {
    const course = v(vars, 'courseTitle', 'the course');
    const community = v(vars, 'communityName', 'the community');
    return {
      subject: `You're enrolled in ${course}`,
      html: `<p>You've been enrolled in <strong>${esc(course)}</strong> in ${esc(community)}.</p>
<p>Head to your dashboard to start learning.</p>
<p><a href="/dashboard">Start learning →</a></p>`,
      text: `You've been enrolled in "${course}" in ${community}.\n\nHead to your dashboard to start learning.\n\nVisit /dashboard to get started.`,
    };
  },

  certificate_issued: (vars) => {
    const course = v(vars, 'courseTitle', 'the course');
    const recipient = v(vars, 'recipientName', 'there');
    const certUrl = v(vars, 'certificateUrl', '/dashboard');
    return {
      subject: `Your certificate is ready — ${course}`,
      html: `<p>Congratulations, ${esc(recipient)}! You've completed <strong>${esc(course)}</strong> and your certificate is ready.</p>
<p><a href="${esc(certUrl)}">View your certificate →</a></p>`,
      text: `Congratulations, ${recipient}! You've completed "${course}" and your certificate is ready.\n\nView your certificate: ${certUrl}`,
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
