// Auth.js renews the cookie and JWT whenever the session endpoint is accessed.
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
export const SESSION_ACTIVITY_REFRESH_MS = 5 * 60 * 1000;

// Enforce the new idle window for cookies issued before the policy changed too.
export function sessionIdleExpired(token: { iat?: number }, now = Date.now()) {
  return !Number.isFinite(token.iat) || now >= (token.iat! + SESSION_MAX_AGE_SECONDS) * 1000;
}
