# Wondercase KD102 v0.012 — TD Suitcase — TEST ONLY

Prepared September 28, 2026. Not deployed: Netlify authentication required.

- Added TD Suitcase through More and the tour director card in Travelers; direct entry is /?tab=td.
- Central workspace for per-day announcements and saved-announcement WhatsApp sharing, daily schedule editing and release controls, guides/documents/hotel menus, traveler profile management, and account/photo settings.
- Existing shared APIs, resource identifiers and date identifiers are reused. Uploads remain hidden until explicitly revealed. Custom resources appear in Essentials in their collection.
- New password-change endpoint requires a TD session, same-origin request, current password and a different new password of 12–200 characters. Identity accounts use the Identity SDK. Existing password-session deployments use salted scrypt hashes with conditional writes and rotate/revoke password sessions after changes; plaintext passwords are not stored.
- Preserved test Home Screen icon and existing bottom navigation. No live or pre-tour deployment.
- Updated PDF content extraction to find the welcome letter in Essentials and language lessons after the earlier navigation reorganization.

Validation: full production build and TypeScript passed; PDF consistency passed (71 pages, 1,052 content checks). Seventeen password/security assertions passed, along with document authorization/conflict tests and schedule authorization/date-isolation/conflict tests.

Not yet verified: deployed Netlify login and password change against real services, real document uploads, mobile/browser visual and interaction tests. Browser runtime startup/download was unavailable in this session. These are required after test deployment before any live release.

Deployment: use existing kingdoms-dragons-tour102-test Netlify project only, NEXT_PUBLIC_APP_ENV=test. Both static output and netlify/functions are required; do not publish static files alone.
