'use client';

import { useState } from 'react';
import { requestAccountDeletion } from '@/app/actions';

type Step = 'idle' | 'confirm';

export default function DeleteAccountButton() {
  const [step, setStep] = useState<Step>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await requestAccountDeletion();
    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success, server redirects to '/' — no client-side navigation needed.
  }

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('confirm')}
        className="px-4 py-2 border border-red-300 hover:bg-red-50 text-red-600 rounded-lg text-sm font-medium transition-colors"
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-800 font-medium mb-3">
        Are you sure? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? 'Deleting...' : 'Yes, delete my account'}
        </button>
        <button
          onClick={() => setStep('idle')}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
