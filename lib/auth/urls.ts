// Development origins are exact local addresses, never a production wildcard.
export const developmentAuthOrigins = ["http://localhost:3000"];

export function resolveAuthOrigin(configured: string | undefined, requestOrigin: string | null, development: boolean, hosted: boolean): string {
  if (development && requestOrigin && developmentAuthOrigins.includes(requestOrigin)) return requestOrigin;
  if (!configured) throw new Error("Set NEXT_PUBLIC_SITE_URL before deploying authentication.");
  const url = new URL(configured);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) throw new Error("The site URL must be an HTTP(S) origin.");
  if (hosted && (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error("Hosted authentication requires a production HTTPS site URL.");
  if (!development && requestOrigin && requestOrigin !== url.origin) throw new Error("Authentication must use the configured site URL.");
  return url.origin;
}

export function authCallbackDestination(next: string | null): "/library" | "/reset-password" {
  return next === "/reset-password" ? "/reset-password" : "/library";
}
