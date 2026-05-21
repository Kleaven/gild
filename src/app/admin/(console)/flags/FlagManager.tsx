'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FlagName } from '@/lib/feature-flags';
import type { AdminCommunityRow } from '@/lib/admin';
import { GILD_ADMIN_TOKENS, GILD_FONTS } from '@/components/gild/styles';
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

// ─── Shared style fragments ──────────────────────────────────────────────────

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: GILD_ADMIN_TOKENS.text.subtle,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 12,
  fontFamily: GILD_FONTS.mono,
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
      style={{
        position: 'relative',
        display: 'inline-flex',
        height: 20,
        width: 36,
        flexShrink: 0,
        borderRadius: 9999,
        border: 'none',
        padding: 0,
        cursor: pending ? 'not-allowed' : 'pointer',
        opacity: pending ? 0.5 : 1,
        background: enabled ? GILD_ADMIN_TOKENS.accent.success : GILD_ADMIN_TOKENS.bg.track,
        transition: 'background-color 200ms ease-in-out',
      }}
    >
      <span
        style={{
          pointerEvents: 'none',
          display: 'inline-block',
          height: 16,
          width: 16,
          borderRadius: 9999,
          background: GILD_ADMIN_TOKENS.text.primary,
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          transform: enabled ? 'translateX(18px)' : 'translateX(2px)',
          marginTop: 2,
          transition: 'transform 200ms ease-in-out',
        }}
      />
    </button>
  );
}

// ─── OverrideSkeleton ─────────────────────────────────────────────────────────

function OverrideSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            height: 48,
            background: GILD_ADMIN_TOKENS.bg.raised,
            borderRadius: 8,
            animation: 'gild-pulse 1.6s ease-in-out infinite',
          }}
        />
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
  const [addHover, setAddHover] = useState(false);

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

  const disabled = !selectedCommunityId || pending;

  return (
    <div>
      <h4 style={sectionLabelStyle}>Add Override</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <select
          value={selectedCommunityId}
          onChange={(e) => setSelectedCommunityId(e.target.value)}
          style={{
            flex: 1,
            background: GILD_ADMIN_TOKENS.bg.surface,
            border: `1px solid ${GILD_ADMIN_TOKENS.border.default}`,
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 14,
            color: GILD_ADMIN_TOKENS.text.primary,
            fontFamily: GILD_FONTS.sans,
            outline: 'none',
          }}
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
          disabled={disabled}
          onMouseEnter={() => setAddHover(true)}
          onMouseLeave={() => setAddHover(false)}
          style={{
            padding: '8px 12px',
            background: disabled
              ? GILD_ADMIN_TOKENS.bg.raised
              : addHover
                ? GILD_ADMIN_TOKENS.bg.raisedHover
                : GILD_ADMIN_TOKENS.bg.raised,
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            color: GILD_ADMIN_TOKENS.text.primary,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            transition: 'background-color 150ms ease',
            fontFamily: GILD_FONTS.sans,
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── OverrideRow ──────────────────────────────────────────────────────────────

type OverrideRowProps = {
  override: Override;
  isLast: boolean;
  pending: boolean;
  onToggle: (val: boolean) => void;
  onClear: () => void;
};

function OverrideRow({ override, isLast, pending, onToggle, onClear }: OverrideRowProps) {
  const [clearHover, setClearHover] = useState(false);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: isLast ? 'none' : `1px solid ${GILD_ADMIN_TOKENS.border.subtle}`,
      }}
    >
      <span style={{ fontSize: 14, color: GILD_ADMIN_TOKENS.text.secondary }}>
        {override.communityName}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <FlagToggle enabled={override.enabled} onChange={onToggle} pending={pending} />
        <button
          type="button"
          onClick={onClear}
          onMouseEnter={() => setClearHover(true)}
          onMouseLeave={() => setClearHover(false)}
          style={{
            fontSize: 11,
            color: clearHover ? GILD_ADMIN_TOKENS.accent.danger : GILD_ADMIN_TOKENS.text.faint,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: GILD_FONTS.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'color 150ms ease',
            padding: 0,
          }}
        >
          Clear
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
      <div style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: GILD_ADMIN_TOKENS.text.primary,
            marginBottom: 4,
            fontFamily: GILD_FONTS.mono,
          }}
        >
          {flagName}
        </h3>
        <p style={{ fontSize: 14, color: GILD_ADMIN_TOKENS.text.subtle }}>
          Global default: {globalEnabled ? 'ON' : 'OFF'}
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h4 style={sectionLabelStyle}>
          Community Overrides {!loadingOverrides && `(${overrides.length})`}
        </h4>
        {loadingOverrides ? (
          <OverrideSkeleton />
        ) : overrides.length === 0 ? (
          <p style={{ fontSize: 14, color: GILD_ADMIN_TOKENS.text.faint }}>
            No community overrides. All communities use the global default.
          </p>
        ) : (
          <div
            style={{
              borderRadius: 12,
              border: `1px solid ${GILD_ADMIN_TOKENS.border.default}`,
              overflow: 'hidden',
            }}
          >
            {overrides.map((o, idx) => (
              <OverrideRow
                key={o.communityId}
                override={o}
                isLast={idx === overrides.length - 1}
                pending={pending}
                onToggle={(val) => onOverrideToggle(o.communityId, val)}
                onClear={() => onClearOverride(o.communityId)}
              />
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

// ─── FlagListRow ──────────────────────────────────────────────────────────────

type FlagListRowProps = {
  flag: FlagName;
  enabled: boolean;
  selected: boolean;
  pending: boolean;
  onSelect: () => void;
  onToggle: (val: boolean) => void;
};

function FlagListRow({ flag, enabled, selected, pending, onSelect, onToggle }: FlagListRowProps) {
  const [hover, setHover] = useState(false);
  const background = selected
    ? GILD_ADMIN_TOKENS.bg.raised
    : hover
      ? GILD_ADMIN_TOKENS.bg.surface
      : 'transparent';
  const color = selected || hover ? GILD_ADMIN_TOKENS.text.primary : GILD_ADMIN_TOKENS.text.muted;
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        fontSize: 14,
        border: 'none',
        borderBottom: `1px solid ${GILD_ADMIN_TOKENS.border.faint}`,
        background,
        color,
        cursor: 'pointer',
        transition: 'background-color 150ms ease, color 150ms ease',
      }}
    >
      <span style={{ fontFamily: GILD_FONTS.mono, fontSize: 12 }}>{flag}</span>
      <FlagToggle
        enabled={enabled}
        onChange={onToggle}
        pending={pending}
      />
    </button>
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
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Left panel — global flags list */}
      <div
        style={{
          width: 256,
          flexShrink: 0,
          borderRight: `1px solid ${GILD_ADMIN_TOKENS.border.default}`,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${GILD_ADMIN_TOKENS.border.default}`,
          }}
        >
          <h2 style={sectionLabelStyle}>Global Flags</h2>
        </div>
        {flagKeys.map((flag) => (
          <FlagListRow
            key={flag}
            flag={flag}
            enabled={localGlobalFlags[flag] ?? false}
            selected={selectedFlag === flag}
            pending={pending}
            onSelect={() => setSelectedFlag(flag)}
            onToggle={(val) => void handleGlobalToggle(flag, val)}
          />
        ))}
      </div>

      {/* Right panel — context / detail */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {!selectedFlag ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <p style={{ color: GILD_ADMIN_TOKENS.text.faint, fontSize: 14 }}>
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
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: GILD_ADMIN_TOKENS.status.errorToastBg,
            color: GILD_ADMIN_TOKENS.status.errorToastText,
            fontSize: 14,
            padding: '12px 16px',
            borderRadius: 8,
            border: `1px solid ${GILD_ADMIN_TOKENS.status.errorBorder}`,
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            zIndex: 50,
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
