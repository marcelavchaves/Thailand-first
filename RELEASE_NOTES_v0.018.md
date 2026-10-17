# v0.018 — Master admin and Traveler Safe (TEST only)

## Master admin
- Dedicated /master-admin workspace and More entry, using @netlify/identity.
- Only the configured owner email, a confirmed Identity account and the server-controlled master-admin role grant master access. First verified owner activation assigns that role.
- Master admin can open TD Suitcase and reset the TD password after re-entering the admin password. A reset revokes existing TD password sessions.
- TD password/cookie access remains separate and works before and after Identity activation. This supersedes the earlier automatic TD-to-Identity migration.
- Invitation/recovery callbacks open the admin password setup page.
- Owner email configured on TEST: marcelavchaves@gmail.com.
- Netlify Identity activation and the owner invitation are still pending dashboard sign-in. No master account or invitation has been falsely reported as created.

## Traveler Safe
- /traveler-safe and More entry; username and six-digit PIN, separate from TD/admin access.
- Couples share one username/PIN and thus one document collection and personal calendar; each device has its own session.
- PINs salted/scrypt-hashed; opaque secure HttpOnly cookies, four-hour sessions; five failed attempts trigger escalating account lockout. Recovery code shown once, reset invalidates old sessions and rotates the recovery code.
- Up to 30 PDF/JPEG/PNG/WebP documents, 2 MB input each. Uploaded images lose embedded metadata and are normalized to JPEG. File bytes encrypted with AES-256-GCM using a per-Safe key, and served only after owner-session checks with no-store and attachment headers. The app does not grant TD/master access to Safe documents.
- Private calendar October 1–18, 2026: October 1–2 pre-tour, October 3–16 tour, October 17–18 post-tour. Up to three personal activities per tour day (per shared Safe), twelve on each extra day.
- Journey days show the signed-in Safe's personal plans beside the tour schedule; tour records remain separate.
- Conditional writes prevent simultaneous devices silently overwriting plans or document indexes.
- Downloads remain on the device after logout. Shared users can edit/delete the same data; original scans stay under their account.

## Checks
- Next production build and TypeScript passed.
- Master-admin tests: verified email/role, wrong-owner denial, CSRF, re-authentication, hashed TD reset, revocation and compatibility with Identity off/on passed.
- 39 Traveler Safe assertions passed: isolation between accounts, shared access, PIN lockout/recovery, encrypted document round-trip, deletion, stale writes, limits and all four extra dates.
- Guest roster regression checks passed.
- Real user browser signup/password setup requires the user to choose their credentials. No personal guest files were used for tests.

## Deploy investigation
An intermediate v0.017 deploy was not published: a malformed current-itinerary ZIP was rejected with HTTP 400. Netlify subsequently requested all function digests rather than reusing the published set. All twenty function archives were repackaged and validated, replacing a second truncated archive with its validated earlier bundle, before the retry. The repaired current-itinerary upload succeeded. Final deployment and browser status is recorded separately.

Live and pre-tour remain outside this release.

## Published result
TEST deploy 6abb3e5c129798fe9fed895a is ready with no outstanding uploads. Traveler Safe unlock screen verified in browser. Live and pre-tour deploy IDs unchanged. Dashboard authentication was cancelled; Identity activation and master-admin invitation remain pending. Signed-in real-service Safe workflows still require verification.
