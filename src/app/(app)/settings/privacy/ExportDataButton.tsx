'use client';

import { useState } from 'react';
import { requestDataExport } from '@/app/actions';

export default function ExportDataButton() {
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    const { data, error: exportError } = await requestDataExport();
    if (exportError || !data) {
      setError(exportError ?? 'Export failed');
      setLoading(false);
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gild-data-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={loading}
        className="px-4 py-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
      >
        {loading ? 'Preparing export...' : exported ? 'Downloaded ✓' : 'Download my data'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
