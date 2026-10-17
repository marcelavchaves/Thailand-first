# Wondercase Prototype — v0.026

September 30, 2026

- Assigned permanent TG01, TG02, etc. Safe IDs in the original saved guest-list order. IDs survive reordering and removal and are never recycled; later guests receive the next number.
- Safe activation is optional. Each assigned ID can activate one Safe only, with a six-digit PIN and optional display nickname. A couple may share one partner’s Safe. Nickname changes preserve its ID, documents and plans. Existing username accounts remain accessible.
- Added the approved Classic hotel-safe icon to the primary Journey button and small accessible icon-only guest-card shortcuts. Card shortcuts prefill the guest’s Safe ID.
- Applied Muted Evergreen #315C4F to the app theme, UI and vector artwork, retaining gold and ivory.
- Replaced the Flights illustration and compact airplane icons with a recognizable top-view airplane. Removed the star from the Hotels illustration.
- Handouts starts with no bundled documents. TD Suitcase has a dedicated Handouts upload collection; new uploads remain hidden until revealed.
- Refreshed the service-worker cache.

Validation: production static build and TypeScript passed. Safe isolation, duplicate and concurrent activation prevention, nicknames, recovery, session revocation, encryption, shared access, plans and document checks passed. Roster permanence, hidden-list privacy, ordering and resource authorization checks passed.

Deployment target: Prototype only (existing pre-tour site). Test and live unchanged.

Published: https://kingdoms-dragons-tour102-pre-tour.netlify.app/
Deploy: 6abd8b3830dcf08be3af391a — ready September 30, 2026 at 22:23 UTC, all 20 functions deployed.
Published checks: Journey button navigates to Safe; guest-card shortcut for Marcela opens the Safe with TG06 prefilled; activation shows optional nickname; primary green is #315C4F; Handouts returns no documents; revised Flights and Hotels artwork visually verified. Current roster exposes TG01–TG14 in its preserved order. Signed-in behavior verified with isolated service tests; no real guest Safe was activated during the check.
