import 'server-only';
import db from '../db';
import { FEATURE_FLAGS, type FlagName } from './flags';

export type FlagResult = {
  enabled: boolean;
  source: 'community' | 'global' | 'default';
};

type FlagRow = {
  community_id: string | null;
  flag_name: string;
  is_enabled: boolean;
};

export async function getFlag(
  flagName: FlagName,
  communityId: string | null,
): Promise<FlagResult> {
  // 1. Community-level override
  if (communityId !== null) {
    const communityRows = await db<FlagRow[]>`
      SELECT community_id, flag_name, is_enabled
      FROM feature_flags
      WHERE community_id = ${communityId}
        AND flag_name = ${flagName}
      LIMIT 1
    `;
    if (communityRows.length > 0 && communityRows[0] !== undefined) {
      return { enabled: communityRows[0].is_enabled, source: 'community' };
    }
  }

  // 2. Global override
  const globalRows = await db<FlagRow[]>`
    SELECT community_id, flag_name, is_enabled
    FROM feature_flags
    WHERE community_id IS NULL
      AND flag_name = ${flagName}
    LIMIT 1
  `;
  if (globalRows.length > 0 && globalRows[0] !== undefined) {
    return { enabled: globalRows[0].is_enabled, source: 'global' };
  }

  // 3. Hardcoded default
  return { enabled: FEATURE_FLAGS[flagName].default, source: 'default' };
}

export async function getAllFlagsForCommunity(
  communityId: string,
): Promise<Record<FlagName, FlagResult>> {
  const rows = await db<FlagRow[]>`
    SELECT community_id, flag_name, is_enabled
    FROM feature_flags
    WHERE community_id = ${communityId}
       OR community_id IS NULL
  `;

  const communityMap = new Map<string, boolean>();
  const globalMap = new Map<string, boolean>();

  for (const row of rows) {
    if (row.community_id === communityId) {
      communityMap.set(row.flag_name, row.is_enabled);
    } else {
      globalMap.set(row.flag_name, row.is_enabled);
    }
  }

  const result = {} as Record<FlagName, FlagResult>;

  for (const key of Object.keys(FEATURE_FLAGS) as FlagName[]) {
    if (communityMap.has(key)) {
      result[key] = { enabled: communityMap.get(key) as boolean, source: 'community' };
    } else if (globalMap.has(key)) {
      result[key] = { enabled: globalMap.get(key) as boolean, source: 'global' };
    } else {
      result[key] = { enabled: FEATURE_FLAGS[key].default, source: 'default' };
    }
  }

  return result;
}

export async function assertFlag(
  flagName: FlagName,
  communityId: string | null,
): Promise<void> {
  const result = await getFlag(flagName, communityId);
  if (!result.enabled) {
    throw new Error(`Feature '${flagName}' is not enabled`);
  }
}
