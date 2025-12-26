export function createErrorCode(prefix: string, domain: string, key: string) {
  return `${prefix}_${domain}_${key}`;
}
