/**
 * Reads one query-string parameter. The name is matched case-insensitively
 * (so "caseId" also finds "caseid"). Returns undefined when it is missing or blank.
 */
export function getQueryParam(search: string, name: string): string | undefined {
  const wanted = (name || '').trim().toLowerCase();
  if (!wanted) {
    return undefined;
  }

  let found: string | undefined;
  new URLSearchParams(search).forEach((value, key) => {
    if (found === undefined && key.toLowerCase() === wanted) {
      found = value;
    }
  });

  const trimmed = found === undefined ? '' : (found as string).trim();
  return trimmed === '' ? undefined : trimmed;
}
