import assert from "node:assert/strict";
import test from "node:test";
import { Auth } from "@auth/core";
import { encode, decode } from "@auth/core/jwt";
import { SESSION_MAX_AGE_SECONDS, sessionIdleExpired } from "../src/lib/session-policy.ts";

const secret = "test-only-session-secret-never-used-by-the-app";
const cookieName = "authjs.session-token";
const DAY = 86400000;
const base = Date.UTC(2030, 0, 1);
const config = {
  trustHost: true,
  basePath: "/api/auth",
  secret,
  providers: [],
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  jwt: { maxAge: SESSION_MAX_AGE_SECONDS },
  callbacks: {
    jwt: async ({ token }) => (sessionIdleExpired(token) ? null : token),
    session: async ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.userId },
    }),
  },
};
async function access(token) {
  return Auth(
    new Request("http://localhost/api/auth/session", {
      headers: { cookie: `${cookieName}=${token}` },
    }),
    config,
  );
}
function renewedToken(response) {
  const match = response.headers.get("set-cookie")?.match(/authjs\.session-token=([^;]+)/);
  assert.ok(match, "Session access must write a renewed cookie");
  return match[1];
}

test("signed sessions expire seven days after their last renewal, not seven days after signup", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: base });
  const initial = await encode({
    secret,
    salt: cookieName,
    token: { userId: "test-user" },
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  t.mock.timers.setTime(base + 6 * DAY);
  const response = await access(initial);
  assert.equal(response.status, 200);
  const session = await response.json();
  assert.equal(session.user.id, "test-user");
  assert.equal(Date.parse(session.expires), base + 13 * DAY);
  const refreshed = renewedToken(response);
  const claims = await decode({ secret, salt: cookieName, token: refreshed });
  assert.equal(claims.iat, (base + 6 * DAY) / 1000);
  assert.equal(claims.exp, (base + 13 * DAY) / 1000);
  // Continued use extends the session beyond the original seven days.
  t.mock.timers.setTime(base + 12 * DAY);
  const next = await access(refreshed);
  assert.equal((await next.json()).user.id, "test-user");
  const last = renewedToken(next);
  // Exactly seven days with no access invalidates it (including JWT clock tolerance).
  t.mock.timers.setTime(base + 19 * DAY);
  const expired = await access(last);
  assert.equal(await expired.json(), null);
  assert.match(expired.headers.get("set-cookie"), /Max-Age=0/);
});

test("legacy thirty-day cookies cannot renew after seven days of inactivity", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: base });
  const old = await encode({
    secret,
    salt: cookieName,
    token: { userId: "legacy-user" },
    maxAge: 30 * 86400,
  });
  t.mock.timers.setTime(base + 8 * DAY);
  const result = await access(old);
  assert.equal(await result.json(), null);
  assert.match(result.headers.get("set-cookie"), /Max-Age=0/);
});

test("activity policy rejects missing issue times and accepts a recently renewed session", () => {
  const now = base + 7 * DAY;
  assert.equal(sessionIdleExpired({}, now), true);
  assert.equal(sessionIdleExpired({ iat: NaN }, now), true);
  assert.equal(sessionIdleExpired({ iat: base / 1000 }, now), true);
  assert.equal(sessionIdleExpired({ iat: (base + DAY) / 1000 }, now), false);
});

test("foreground activity renews at most once per five minutes; hidden or offline tabs do not renew", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: base });
  const { readFileSync } = await import("node:fs");
  const { default: ts } = await import("typescript");
  const listeners = new Map();
  const document = { visibilityState: "visible" };
  const navigator = { onLine: true };
  let requests = 0;
  let cleanup;
  const dependencies = {
    react: {
      useEffect: (effect) => {
        cleanup = effect();
      },
    },
    "next-auth/react": {
      useSession: () => ({
        status: "authenticated",
        update: async () => {
          requests++;
        },
      }),
    },
    "@/lib/session-policy": { SESSION_ACTIVITY_REFRESH_MS: 5 * 60 * 1000 },
  };
  const compiled = ts.transpileModule(
    readFileSync(new URL("../src/components/SessionActivity.tsx", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const exports = {};
  const window = {
    addEventListener: (event, listener) => listeners.set(event, listener),
    removeEventListener: (event) => listeners.delete(event),
  };
  new Function("require", "exports", "window", "document", "navigator", compiled)(
    (name) => dependencies[name],
    exports,
    window,
    document,
    navigator,
  );
  exports.SessionActivity();
  listeners.get("pointerdown")();
  assert.equal(requests, 0);
  t.mock.timers.setTime(base + 5 * 60 * 1000);
  listeners.get("pointerdown")();
  listeners.get("keydown")();
  assert.equal(requests, 1);
  await Promise.resolve();
  await Promise.resolve();
  t.mock.timers.setTime(base + 12 * 60 * 1000);
  document.visibilityState = "hidden";
  listeners.get("scroll")();
  assert.equal(requests, 1);
  document.visibilityState = "visible";
  navigator.onLine = false;
  listeners.get("keydown")();
  assert.equal(requests, 1);
  navigator.onLine = true;
  listeners.get("keydown")();
  assert.equal(requests, 2);
  cleanup();
  assert.equal(listeners.size, 0);
});
