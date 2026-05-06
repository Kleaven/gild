import { requireAuth } from '@/lib/auth/session';
import ExportDataButton from './ExportDataButton';
import DeleteAccountButton from './DeleteAccountButton';

export default async function PrivacyPage() {
  await requireAuth();

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-xl font-bold mb-1">Privacy &amp; Data</h1>
      <p className="text-sm text-gray-500 mt-1 mb-10">
        Manage your personal data in accordance with PDPA.
      </p>

      <section className="mb-10">
        <h2 className="text-base font-semibold mb-1">Export your data</h2>
        <p className="text-sm text-gray-500 mb-4">
          Download a copy of all personal data Gild holds about you, including
          your profile, community memberships, course enrollments, and
          certificates.
        </p>
        <ExportDataButton />
      </section>

      <hr className="border-gray-100 mb-10" />

      <section>
        <h2 className="text-base font-semibold text-red-600 mb-1">
          Delete your account
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Permanently delete your account and all associated personal data. Your
          posts and comments will remain but will no longer be attributed to you.
          This action cannot be undone.
        </p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}
