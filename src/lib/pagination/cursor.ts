/**
 * Generic keyset (cursor) pagination utilities.
 */

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
}

/**
 * Encodes an object payload into a URL-safe Base64 cursor string.
 */
export function encodeCursor(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  // URL-safe base64: replace + with -, / with _, and remove padding =
  return Buffer.from(json)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes a URL-safe Base64 cursor string back into its original payload.
 * Returns null if the cursor is invalid, null, or undefined.
 */
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

/**
 * Builds a PostgREST filter string for symmetric keyset pagination.
 * 
 * For a sort order of (column DESC, id DESC), the keyset filter is:
 * (column < value) OR (column = value AND id < idValue)
 * 
 * Syntax used: .or('column.lt.value,and(column.eq.value,id.lt.idValue)')
 */
export function getKeysetFilter(
  column: string,
  value: string | number,
  id: string
): string {
  return `${column}.lt.${value},and(${column}.eq.${value},id.lt.${id})`;
}
