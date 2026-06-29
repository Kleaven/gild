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

      <Section heading="3. Subscriptions and billing">
        <ul style={ul}>
          <li>
            Payments are processed in US dollars through Stripe. On the Free plan, {LEGAL.entity}{' '}
            retains a 5% platform fee on payments between you and your members. On the Pro plan,{' '}
            {LEGAL.entity} retains 0% — you keep everything except Stripe’s own processing fees.
          </li>
          <li>
            The Free plan is free and requires no payment method. The Pro plan ($29/month) begins
            when you upgrade and is billed immediately — there is no trial period. You can cancel at
            any time.
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

      <Section heading="4. Selling to your members and payouts">
        <ul style={ul}>
          <li>
            Community owners may charge members for access or membership tiers. To receive payments,
            an owner must connect a Stripe account and agree to Stripe&rsquo;s Connected Account
            Agreement. Payments are made directly to the owner&rsquo;s connected Stripe account.
          </li>
          <li>
            {LEGAL.entity} charges a 5% platform fee on payments to communities on the Free plan, and
            0% on the Pro plan. Stripe&rsquo;s own processing fees apply in all cases and are deducted
            by Stripe.
          </li>
          <li>
            Owners are solely responsible for what they sell — delivering the access, content, or
            services offered; setting and honouring a refund policy with their own members; and
            handling any taxes arising from their sales. {LEGAL.entity} is not the seller and is not
            responsible for an owner&rsquo;s offerings or for disputes between owners and members.
          </li>
          <li>
            Members pay owners for access to their communities. {LEGAL.entity} does not guarantee any
            community&rsquo;s content, availability, or results.
          </li>
        </ul>
      </Section>

      <Section heading="5. Acceptable use">
        <p style={p}>You agree not to:</p>
        <ul style={ul}>
          <li>Violate any law or infringe the rights of others;</li>
          <li>Post unlawful, hateful, harassing, deceptive, or sexually exploitative content;</li>
          <li>Distribute malware or attempt to disrupt, probe, or gain unauthorised access to the service;</li>
          <li>Scrape, resell, or misuse the service or other users&rsquo; data; or</li>
          <li>Impersonate any person or misrepresent your affiliation.</li>
        </ul>
      </Section>

      <Section heading="6. Your content">
        <p style={p}>
          You retain ownership of the content you post. You grant {LEGAL.entity} a worldwide,
          non-exclusive, royalty-free licence to host, store, reproduce, and display your content
          solely to operate and improve the service. You are responsible for your content and
          confirm you have the rights to post it.
        </p>
      </Section>

      <Section heading="7. Intellectual property">
        <p style={p}>
          The {LEGAL.entity} name, logo, software, and design are owned by {LEGAL.entity} and
          protected by intellectual-property laws. These Terms grant you no right to use them except
          as necessary to use the service.
        </p>
      </Section>

      <Section heading="8. Termination">
        <p style={p}>
          You may stop using the service and delete your account at any time. We may suspend or
          terminate access if you breach these Terms or use the service in a way that risks harm to
          others or to {LEGAL.entity}. On termination, the licences you granted end, except to the
          extent content must be retained for legal or operational reasons.
        </p>
      </Section>

      <Section heading="9. Disclaimers">
        <p style={p}>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
          warranties of any kind, whether express or implied, including fitness for a particular
          purpose and non-infringement, to the maximum extent permitted by law.
        </p>
      </Section>

      <Section heading="10. Limitation of liability">
        <p style={p}>
          To the maximum extent permitted by law, {LEGAL.entity} will not be liable for indirect,
          incidental, special, consequential, or punitive damages, or for lost profits or data. Our
          total liability for any claim relating to the service will not exceed the amount you paid
          us in the 12 months before the claim arose.
        </p>
      </Section>

      <Section heading="11. Indemnification">
        <p style={p}>
          You agree to indemnify and hold harmless {LEGAL.entity} and its officers, employees, and
          partners from any claims, damages, losses, and expenses (including reasonable legal fees)
          arising out of your content, your community, your sales to members, your use of the
          service, or your breach of these Terms or of any law or third-party right.
        </p>
      </Section>

      <Section heading="12. Third-party services">
        <p style={p}>
          {LEGAL.entity} relies on third-party services — including Stripe for payments and payouts —
          to operate. Your use of those features may be subject to the third party&rsquo;s own terms,
          and {LEGAL.entity} is not responsible for third-party services it does not control.
        </p>
      </Section>

      <Section heading="13. Changes to these Terms">
        <p style={p}>
          We may update these Terms from time to time. If we make material changes, we will provide
          reasonable notice. Your continued use of the service after changes take effect constitutes
          acceptance of the revised Terms.
        </p>
      </Section>

      <Section heading="14. Governing law">
        <p style={p}>
          These Terms are governed by the laws of {LEGAL.jurisdiction}, without regard to its
          conflict-of-laws rules. You agree to the exclusive jurisdiction of the courts located in{' '}
          {LEGAL.jurisdiction} for any dispute arising out of or relating to these Terms or the
          service.
        </p>
      </Section>

      <Section heading="15. Contact">
        <p style={p}>
          Questions about these Terms? Contact {LEGAL.entity} at{' '}
          <a href={`mailto:${LEGAL.contactEmail}`} style={{ color: '#111', fontWeight: 600 }}>
            {LEGAL.contactEmail}
          </a>
          .
        </p>
      </Section>
    </LegalDocument>
  );
}
