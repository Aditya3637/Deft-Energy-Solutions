/**
 * Auth (JWT) invariants (runs in CI). Tokens guard every tenant's data, so the
 * crypto path is locked here: round-trip, tamper rejection, and token-kind
 * confusion (a magic-link token must never pass as a session, and vice-versa).
 */

import { signSession, verifySession, signMagic, verifyMagic } from "../src/auth/jwt";

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (cond) console.log(`  ok   ${msg}`);
  else {
    console.error(`  FAIL ${msg}`);
    failures += 1;
  }
}

console.log("Auth JWT invariants:");

const claims = { orgId: "org-1", userId: "user-1", email: "a@b.com" };
const session = signSession(claims);
const round = verifySession(session);
check(!!round && round.orgId === "org-1" && round.email === "a@b.com", "session signs & verifies round-trip");

// Tamper: flip the last signature char → must reject.
const flipped = session.slice(0, -1) + (session.slice(-1) === "A" ? "B" : "A");
check(verifySession(flipped) === null, "tampered signature is rejected");

// Garbage / malformed.
check(verifySession("not.a.token") === null, "malformed token rejected");
check(verifySession("abc") === null, "non-3-part token rejected");

// Magic round-trip.
check(verifyMagic(signMagic("x@y.com")) === "x@y.com", "magic link signs & verifies");

// Token-kind confusion must be impossible.
check(verifySession(signMagic("x@y.com")) === null, "a magic token is NOT accepted as a session");
check(verifyMagic(signSession(claims)) === null, "a session token is NOT accepted as a magic link");

if (failures > 0) {
  console.error(`\n${failures} auth invariant(s) failed.`);
  process.exit(1);
}
console.log("\nAll auth invariants hold.");
