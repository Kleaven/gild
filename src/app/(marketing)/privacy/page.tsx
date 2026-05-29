import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalDocument, Section, LEGAL } from '../LegalDocument';

export const metadata: Metadata = {
  title: 'Privacy Policy — Gild',
  description: 'How Gild collects, uses, and protects your data.',
};

const ul: React.CSSProperties = { margin: '8px 0 0', paddingLeft: 22, display: 'grid', gap: 6 };
const p: React.CSSProperties = { margin: '0 0 12px' };

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      intro={`This policy explains what data ${LEGAL.entity} collects, how we use it, who we share it with, and the choices and rights you have.`}
    >
      <Section heading="1. Data we collect">
        <ul style={ul}>
          <li>
            <strong>Account &amp; profile:</strong> your name, email address, username, avatar, and
            the communities you own or join.
          </li>
          <li>
            <strong>Content:</strong> posts, comments, polls, reactions, messages, course progress,
            and other content you create.
          </li>
          <li>
            <strong>Payment:</strong> when you subscribe to a paid plan, payments are processed by
            Stripe. We receive your subscription status and a customer identifier — we never see or
            store full card numbers.
          </li>
          <li>
            <strong>Usage &amp; device:</strong> log data, IP address, browser type, and product
            analytics events used to understand and improve the service.
          </li>
        </ul>
      </Section>

      <Section heading="2. How we use your data">
        <ul style={ul}>
          <li>To provide, secure, and operate the service and your communities;</li>
          <li>To process subscriptions and send transactional and service emails;</li>
          <li>To prevent abuse, fraud, and violations of our Terms; and</li>
          <li>To analyse usage so we can improve features and performance.</li>
        </ul>
      </Section>

      <Section heading="3. Service providers we share with">
        <p style={p}>
          We share data only with the processors needed to run {LEGAL.entity}, each under their own
          data-protection commitments:
        </p>
        <ul style={ul}>
          <li><strong>Supabase</strong> — database, authentication, and file storage;</li>
          <li><strong>Stripe</strong> — subscription billing and payments;</li>
          <li><strong>Resend</strong> — transactional and notification email;</li>
          <li><strong>Vercel</strong> — application hosting;</li>
          <li><strong>PostHog</strong> — product analytics;</li>
          <li><strong>Sentry</strong> — error monitoring.</li>
        </ul>
        <p style={{ ...p, marginTop: 12 }}>
          We do not sell your personal data. We may disclose data if required by law or to protect
          the rights, safety, and security of our users and the service.
        </p>
      </Section>

      <Section heading="4. Cookies and analytics">
        <p style={p}>
          We use essential cookies to keep you signed in and to operate the service. We use
          privacy-respecting product analytics (PostHog) to measure how features are used; session
          recording is disabled and we redact sensitive URL parameters before they are sent.
        </p>
      </Section>

      <Section heading="5. Data retention">
        <p style={p}>
          We keep your data for as long as your account is active or as needed to provide the
          service. When you delete your account, we delete or anonymise your personal data, except
          where we must retain certain records for legal, accounting, or security reasons.
        </p>
      </Section>

      <Section heading="6. Your rights and choices">
        <p style={p}>
          You can access and update your profile at any time. You can export a copy of your data or
          permanently delete your account from your{' '}
          <Link href="/settings/privacy" style={{ color: '#111', fontWeight: 600 }}>
            privacy settings
          </Link>
          . Depending on where you live, you may also have rights to access, correct, port, or
          restrict the processing of your data; contact us to exercise them.
        </p>
      </Section>

      <Section heading="7. Security">
        <p style={p}>
          We protect your data with encryption in transit, row-level access controls, and scoped
          access to production systems. No method of transmission or storage is completely secure,
          but we work to protect your information and to notify you of material incidents as required
          by law.
        </p>
      </Section>

      <Section heading="8. International transfers and children">
        <p style={p}>
          Your data may be processed in countries other than your own. Where required, we rely on
          appropriate safeguards for such transfers. {LEGAL.entity} is not directed to children
          under 16, and we do not knowingly collect their personal data.
        </p>
      </Section>

      <Section heading="9. Changes to this policy">
        <p style={p}>
          We may update this policy as the service evolves. If we make material changes, we will
          provide reasonable notice. The &ldquo;effective&rdquo; date above always reflects the
          current version.
        </p>
      </Section>
    </LegalDocument>
  );
}
