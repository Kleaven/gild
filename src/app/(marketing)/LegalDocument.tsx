// Shared presentation + config for the legal pages (/terms, /privacy).
// Server component — no client JS. Importing GILD_FONTS from the styles
// module (plain constants, no 'use client') keeps these pages out of the
// gild component barrel's client bundle.

import { GILD_FONTS } from '@/components/gild/styles';
import { BackLink } from './BackLink';

// ─── Owner-editable launch config ────────────────────────────────────────────
// Update these three values before public launch, then redeploy. They are the
// single source of truth for both legal pages.
export const LEGAL = {
  entity: 'Gild',
  // Contact address for legal / privacy enquiries and data-rights requests.
  contactEmail: 'support@gild.app',
  // Human-readable effective date shown at the top of each document.
  effectiveDate: 'June 28, 2026',
  // Jurisdiction whose law governs the Terms. Finalise with the real entity.
  jurisdiction: 'Singapore',
} as const;

const muted = 'oklch(0.50 0.02 250)';

export function LegalDocument({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        fontFamily: GILD_FONTS.sans,
        maxWidth: 760,
        margin: '0 auto',
        padding: '56px 24px 112px',
        color: '#1a1a1a',
      }}
    >
      <BackLink label={`Back to ${LEGAL.entity}`} />

      <h1
        style={{
          fontFamily: GILD_FONTS.display,
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          margin: '24px 0 8px',
        }}
      >
        {title}
      </h1>
      <p style={{ color: muted, fontSize: 14, margin: '0 0 8px' }}>
        Effective {LEGAL.effectiveDate}
      </p>
      <p style={{ fontSize: 17, lineHeight: 1.6, color: '#333', margin: '0 0 8px' }}>{intro}</p>

      <div style={{ fontSize: 16, lineHeight: 1.7 }}>{children}</div>

      <hr style={{ border: 'none', borderTop: '1px solid oklch(0.92 0.01 250)', margin: '40px 0 20px' }} />
      <p style={{ fontSize: 14, color: muted }}>
        Questions? Contact us at{' '}
        <a href={`mailto:${LEGAL.contactEmail}`} style={{ color: '#111', fontWeight: 600 }}>
          {LEGAL.contactEmail}
        </a>
        .
      </p>
    </main>
  );
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 32 }}>
      <h2
        style={{
          fontFamily: GILD_FONTS.display,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          margin: '0 0 10px',
        }}
      >
        {heading}
      </h2>
      <div style={{ color: '#333' }}>{children}</div>
    </section>
  );
}
