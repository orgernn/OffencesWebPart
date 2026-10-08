/** Escapes a value for use inside an OData string literal ('...'): a single quote is doubled. */
export function escapeODataString(value: string): string {
  return value.replace(/'/g, "''");
}
