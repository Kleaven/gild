import type { Metadata } from 'next';
import { LegalDocument, Section, LEGAL } from '../LegalDocument';

export const metadata: Metadata = {
  title: 'Terms of Service — Gild',
  description: 'The terms that govern your use of Gild.',
};

const ul: React.CSSProperties = { margin: '8px 0 0', paddingLeft: 22, display: 'grid', gap: 6 };
const p: React.CSSProperties = { margin: '0 0 12px' };

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      intro={`These Terms of Service ("Terms") govern your access to and use of ${LEGAL.entity}, the community platform. By creating an account or using the service, you agree to these Terms.`}
    >
      <Section heading="1. Your account">
        <p style={p}>
          You must provide accurate information when registering and keep it current. You are
          responsible for safeguarding your password and for all activity under your account. You
          must be at least 16 years old, or the age of digital consent in your jurisdiction, to use{' '}
          {LEGAL.entity}. Notify us immediately of any unauthorised use.
        </p>
      </Section>

      <Section heading="2. Communities, owners, and members">
        <p style={p}>
          {LEGAL.entity} lets community owners create spaces and invite members. Owners set their
          own rules, content, pricing, and moderation policies for their communities and are solely
          responsible for them. As a member, your relationship within a community is also governed
          by that community&rsquo;s own rules. {LEGAL.entity} is a platform provider and is not a
          party to agreements between owners and their members.
        </p>
      </Section>

      <Section heading="3. Subscriptions, trials, and billing">
        <ul style={ul}>
          <li>
            Paid plans are billed in US dollars through our payment processor, Stripe. {LEGAL.entity}{' '}
            never charges transaction fees on payments between you and your members.
          </li>
          <li>
            Paid plans include a 14-day free trial. A valid payment method is required to start a
            trial. Unless you cancel before the trial ends, your plan converts to a paid
            subscription automatically.
          </li>
          <li>
            Subscriptions renew automatically each billing period until cancelled. You can cancel at
            any time from your billing settings; cancellation takes effect at the end of the current
            paid period.
          </li>
          <li>
            Except where required by law, payments are non-refundable and we do not provide refunds
            or credits for partial periods. We may change plan pricing with reasonable advance
            notice.
          </li>
        </ul>
      </Section>

      <Section heading="4. Acceptable use">
        <p style={p}>You agree not to:</p>
        <ul style={ul}>
          <li>Violate any law or infringe the rights of others;</li>
          <li>Post unlawful, hateful, harassing, deceptive, or sexually exploitative content;</li>
          <li>Distribute malware or attempt to disrupt, probe, or gain unauthorised access to the service;</li>
          <li>Scrape, resell, or misuse the service or other users&rsquo; data; or</li>
          <li>Impersonate any person or misrepresent your affiliation.</li>
        </ul>
      </Section>

      <Section heading="5. Your content">
        <p style={p}>
          You retain ownership of the content you post. You grant {LEGAL.entity} a worldwide,
          non-exclusive, royalty-free licence to host, store, reproduce, and display your content
          solely to operate and improve the service. You are responsible for your content and
          confirm you have the rights to post it.
        </p>
      </Section>

      <Section heading="6. Intellectual property">
        <p style={p}>
          The {LEGAL.entity} name, logo, software, and design are owned by {LEGAL.entity} and
          protected by intellectual-property laws. These Terms grant you no right to use them except
          as necessary to use the service.
        </p>
      </Section>

      <Section heading="7. Termination">
        <p style={p}>
          You may stop using the service and delete your account at any time. We may suspend or
          terminate access if you breach these Terms or use the service in a way that risks harm to
          others or to {LEGAL.entity}. On termination, the licences you granted end, except to the
          extent content must be retained for legal or operational reasons.
        </p>
      </Section>

      <Section heading="8. Disclaimers">
        <p style={p}>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
          warranties of any kind, whether express or implied, including fitness for a particular
          purpose and non-infringement, to the maximum extent permitted by law.
        </p>
      </Section>

      <Section heading="9. Limitation of liability">
        <p style={p}>
          To the maximum extent permitted by law, {LEGAL.entity} will not be liable for indirect,
          incidental, special, consequential, or punitive damages, or for lost profits or data. Our
          total liability for any claim relating to the service will not exceed the amount you paid
          us in the 12 months before the claim arose.
        </p>
      </Section>

      <Section heading="10. Changes to these Terms">
        <p style={p}>
          We may update these Terms from time to time. If we make material changes, we will provide
          reasonable notice. Your continued use of the service after changes take effect constitutes
          acceptance of the revised Terms.
        </p>
      </Section>
    </LegalDocument>
  );
}
