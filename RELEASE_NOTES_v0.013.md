# KD102 TEST v0.013 — TD Suitcase integration

September 28, 2026. Target: kingdoms-dragons-tour102-test.netlify.app only.

## Source comparison

Compared the exact v0.011 main-development archive with both v0.012 TD Suitcase archives (the two v0.012 copies were byte-identical). The TD package builds on v0.011; no source files were removed. Its changes add the workspace and password endpoint, extend schedule/login integration, and refresh generated itinerary documents. The v0.011 header, typography, calendar, guest navigation and KD102 T installation icons are retained.

The generic manifest was regenerated with an older icon by prepare-branding.mjs. Corrected that build path to reuse the current KD102 test manifest. TD Suitcase now uses the current native W suitcase mark. Advanced the service-worker cache to v0.013.

## Workspace

Entry: More → TD Suitcase, Travelers → TD Suitcase, or /?tab=td.

Central announcements with WhatsApp sharing, day-specific schedule editing and release controls, document/spa-menu collections, traveler profiles, account/photo settings, sign-in/out and password changes. Shared data identifiers are preserved. New uploads remain hidden until explicitly revealed.

## Deployment investigation

Netlify still had v0.011 published before this release. Two v0.012 attempts had ten function digests outstanding, and a later attempt had one. No server error was exposed in those deploy records; original client upload logs were not in the source package. Exact historical cause cannot be established from these records.

Repacked functions with Netlify zip-it-and-ship-it, verified ZIP contents, runtime API v2, stream invocation metadata, custom routes, rate limits and expanded sizes below 250 MB. An unpublished one-function diagnostic received HTTP 200. Use function-name uploads (without extension) with runtime=js and invocation_mode=stream, application/octet-stream body containing the ZIP. All required server-function uploads were accepted before static uploads. Reused unchanged published functions. No static-only release and no authentication or environment-scope changes.

## Validation

- Production build, TypeScript, 71-page PDF and 1,052 PDF content checks passed.
- Password/session/security (17 assertions), schedule authorization/date-isolation/conflict tests, document authorization tests passed.
- Updated stale test fixtures for configurable TD email and new credential storage. Announcement authorization (20 assertions), Identity migration, release policy, traveler moderation/photo authorization tests passed.
- Deployed service and browser verification details are recorded in VERIFICATION_v0.013.md.
