// Generic keyset (cursor) pagination utilities.

export interface CursorInput {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
}

export function encodeCursor(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  // URL-safe base64: replace + with -, / with _, and remove padding =
  return Buffer.from(json)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeCursor<T = Record<string, unknown>>(cursor?: string | null): T | null {
  if (!cursor) return null;
  
  try {
    // Restore standard base64 characters
    let base64 = cursor.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(json) as T;
  } catch (err) {
    console.error('[pagination] Failed to decode cursor:', err);
    return null;
  }
}

// DESC sort: (column < value) OR (column = value AND id < id)
export function getKeysetFilter(column: string, value: string | number, id: string): string {
  return `${column}.lt.${value},and(${column}.eq.${value},id.lt.${id})`;
}

// ASC sort: (column > value) OR (column = value AND id > id)
export function getKeysetFilterAsc(column: string, value: string | number, id: string): string {
  return `${column}.gt.${value},and(${column}.eq.${value},id.gt.${id})`;
}
