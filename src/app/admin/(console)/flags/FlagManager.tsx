'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FlagName } from '@/lib/feature-flags';
import type { AdminCommunityRow } from '@/lib/admin';
import {
  setGlobalFlag,
  setCommunityFlag,
  clearCommunityFlagOverride,
  getOverridesForFlag,
} from '@/app/actions/admin';

// ─── Types ────────────────────────────────────────────────────────────────────

type Override = { communityId: string; communityName: string; enabled: boolean };

type Props = {
  globalFlags: Record<FlagName, boolean>;
  communities: AdminCommunityRow[];
};

// ─── FlagToggle ───────────────────────────────────────────────────────────────

type FlagToggleProps = {
  enabled: boolean;
  onChange: (val: boolean) => void;
  pending?: boolean;
};

function FlagToggle({ enabled, onChange, pending = false }: FlagToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      disabled={pending}
      role="switch"
      aria-checked={enabled}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-neutral-600 ${
        enabled ? 'bg-emerald-500' : 'bg-neutral-700'
      } ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200 ease-in-out mt-0.5 ${
          enabled ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ─── OverrideSkeleton ─────────────────────────────────────────────────────────

function OverrideSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-12 bg-neutral-800 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// ─── AddOverrideRow ───────────────────────────────────────────────────────────

type AddOverrideRowProps = {
  flagName: FlagName;
  communities: AdminCommunityRow[];
  existingOverrideCommunityIds: string[];
  onAdded: () => void;
};

function AddOverrideRow({
  flagName,
  communities,
  existingOverrideCommunityIds,
  onAdded,
}: AddOverrideRowProps) {
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [selectedEnabled, setSelectedEnabled] = useState(true);
  const [pending, setPending] = useState(false);

  const available = communities.filter(
    (c) => !existingOverrideCommunityIds.includes(c.id),
  );

  const handleAdd = async () => {
    if (!selectedCommunityId) return;
    setPending(true);
    const result = await setCommunityFlag(selectedCommunityId, flagName, selectedEnabled);
    setPending(false);
    if (!result.error) {
      setSelectedCommunityId('');
      setSelectedEnabled(true);
      onAdded();
    }
  };

  return (
    <div>
      <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
        Add Override
      </h4>
      <div className="flex items-center gap-3">
        <select
          value={selectedCommunityId}
          onChange={(e) => setSelectedCommunityId(e.target.value)}
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neutral-600"
        >
          <option value="">Select community...</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <FlagToggle enabled={selectedEnabled} onChange={setSelectedEnabled} />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedCommunityId || pending}
          className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── FlagDetailPanel ──────────────────────────────────────────────────────────

type FlagDetailPanelProps = {
  flagName: FlagName;
  globalEnabled: boolean;
  communities: AdminCommunityRow[];
  overrides: Override[];
  loadingOverrides: boolean;
  pending: boolean;
  onOverrideToggle: (communityId: string, val: boolean) => void;
  onClearOverride: (communityId: string) => void;
  onAdded: () => void;
};

function FlagDetailPanel({
  flagName,
  globalEnabled,
  communities,
  overrides,
  loadingOverrides,
  pending,
  onOverrideToggle,
  onClearOverride,
  onAdded,
}: FlagDetailPanelProps) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-base font-semibold text-white mb-1">{flagName}</h3>
        <p className="text-sm text-neutral-500">
          Global default: {globalEnabled ? 'ON' : 'OFF'}
        </p>
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Community Overrides {!loadingOverrides && `(${overrides.length})`}
        </h4>
        {loadingOverrides ? (
          <OverrideSkeleton />
        ) : overrides.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No community overrides. All communities use the global default.
          </p>
        ) : (
          <div className="rounded-xl border border-neutral-800 overflow-hidden">
            {overrides.map((o) => (
              <div
                key={o.communityId}
                className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/60 last:border-0"
              >
                <span className="text-sm text-neutral-300">{o.communityName}</span>
                <div className="flex items-center gap-3">
                  <FlagToggle
                    enabled={o.enabled}
                    onChange={(val) => onOverrideToggle(o.communityId, val)}
                    pending={pending}
                  />
                  <button
                    type="button"
                    onClick={() => onClearOverride(o.communityId)}
                    className="text-xs text-neutral-600 hover:text-red-400 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddOverrideRow
        flagName={flagName}
        communities={communities}
        existingOverrideCommunityIds={overrides.map((o) => o.communityId)}
        onAdded={onAdded}
      />
    </div>
  );
}

// ─── FlagManager ──────────────────────────────────────────────────────────────

export default function FlagManager({ globalFlags, communities }: Props) {
  const [selectedFlag, setSelectedFlag] = useState<FlagName | null>(null);
  const [localGlobalFlags, setLocalGlobalFlags] = useState<Record<FlagName, boolean>>(globalFlags);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchOverrides = useCallback(async (flag: FlagName) => {
    setLoadingOverrides(true);
    const result = await getOverridesForFlag(flag);
    if (result.data) setOverrides(result.data);
    setLoadingOverrides(false);
  }, []);

  useEffect(() => {
    if (!selectedFlag) return;
    void fetchOverrides(selectedFlag);
  }, [selectedFlag, fetchOverrides]);

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(null), 3000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  const handleGlobalToggle = async (flag: FlagName, val: boolean) => {
    const previousVal = localGlobalFlags[flag];
    setLocalGlobalFlags((curr) => ({ ...curr, [flag]: val }));
    setPending(true);
    const result = await setGlobalFlag(flag, val);
    setPending(false);
    if (result.error) {
      setLocalGlobalFlags((curr) => ({ ...curr, [flag]: previousVal }));
      setErrorMessage(result.error);
    }
  };

  const handleOverrideToggle = async (communityId: string, val: boolean) => {
    if (!selectedFlag) return;
    const prevOverrides = overrides;
    setOverrides((prev) =>
      prev.map((o) => (o.communityId === communityId ? { ...o, enabled: val } : o)),
    );
    setPending(true);
    const result = await setCommunityFlag(communityId, selectedFlag, val);
    setPending(false);
    if (result.error) {
      setOverrides(prevOverrides);
      setErrorMessage(result.error);
    }
  };

  const handleClearOverride = async (communityId: string) => {
    if (!selectedFlag) return;
    const prevOverrides = overrides;
    setOverrides((prev) => prev.filter((o) => o.communityId !== communityId));
    setPending(true);
    const result = await clearCommunityFlagOverride(communityId, selectedFlag);
    setPending(false);
    if (result.error) {
      setOverrides(prevOverrides);
      setErrorMessage(result.error);
    }
  };

  const refetchOverrides = useCallback(() => {
    if (selectedFlag) void fetchOverrides(selectedFlag);
  }, [selectedFlag, fetchOverrides]);

  const flagKeys = Object.keys(localGlobalFlags) as FlagName[];

  return (
    <div className="flex w-full h-full">
      {/* Left panel — global flags list */}
      <div className="w-64 shrink-0 border-r border-neutral-800 overflow-y-auto">
        <div className="px-4 py-3 border-b border-neutral-800">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Global Flags
          </h2>
        </div>
        {flagKeys.map((flag) => (
          <button
            key={flag}
            type="button"
            onClick={() => setSelectedFlag(flag)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-b border-neutral-800/40 ${
              selectedFlag === flag
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <span className="font-mono text-xs">{flag}</span>
            <FlagToggle
              enabled={localGlobalFlags[flag] ?? false}
              onChange={(val) => void handleGlobalToggle(flag, val)}
              pending={pending}
            />
          </button>
        ))}
      </div>

      {/* Right panel — context / detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedFlag ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-neutral-600 text-sm">
              Select a flag to view community overrides
            </p>
          </div>
        ) : (
          <FlagDetailPanel
            flagName={selectedFlag}
            globalEnabled={localGlobalFlags[selectedFlag] ?? false}
            communities={communities}
            overrides={overrides}
            loadingOverrides={loadingOverrides}
            pending={pending}
            onOverrideToggle={(id, val) => void handleOverrideToggle(id, val)}
            onClearOverride={(id) => void handleClearOverride(id)}
            onAdded={refetchOverrides}
          />
        )}
      </div>

      {/* Error toast */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-900/80 text-red-200 text-sm px-4 py-3 rounded-lg shadow-lg z-50">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
