# Meal choices

Live: https://thailand-first.netlify.app/meal-choices

Prototype: https://thailand-first-prototype.netlify.app/meal-choices

Promoted to live with user authorization on November 6, 2026. The meal API allows the live and prototype site IDs; each site keeps its own Blobs, credentials and settings. Prototype submissions/settings are not copied.

## Using the feature

1. Sign in using the existing TD account. Promotion does not change the live TD password.
2. Open TD Suitcase → Meal choices → Meal submission deadlines. Set each meal’s cutoff in Hanoi time (UTC+7). All five default to November 16, 2026 at 18:30, 30 minutes before the welcome dinner. You can adjust a deadline while that meal is still open; a closed meal cannot be reopened.
3. Travelers select their name from Meal choices or open their guest-card link. Public choices open directly; existing protected choices still require their PIN. The Add an optional PIN control has been removed from the traveler page. TDs can remove an existing PIN in the private traveler-links section without deleting meal choices. New traveler edits remain attributed in the change history.
4. Travelers submit each released meal individually using its Submit button. Draft, bulk-submit, PIN-setup, sharing and bottom deadline panels are no longer shown on the traveler page. Every meal closes independently at its own cutoff. A closed meal’s selections, submission status, and dietary/allergy notes remain fixed while other meals can still be edited. Existing submissions are preserved during this migration.
5. In TD Suitcase, refresh choices, select a restaurant or all menus, and download CSV, Excel (.xlsx), or PDF. Reports use each meal’s own submission status, cutoff, and saved dietary notes. Totals count submitted choices only; drafts and missing submissions remain labeled.

The Lakorn PDF specifies a lunch but not a tour day, so no date is assigned to it. The original five PDFs are linked from the corresponding forms. Menu data is in `app/meal-menus.json`; default deadline and per-meal validation helpers are in `lib/meal-choices.ts`. TD-adjusted deadlines are stored under `settings/deadlines` in the meal store.

## Storage and configuration

Private Netlify Blobs store `meal-choices-v1` contains separately keyed credentials, submissions, sessions and rate-limit records. `protection/<guestId>` holds the optional PIN’s salted scrypt hash and version; raw PINs are never returned or stored. PIN login is limited by both guest and IP, with 15-minute windows; protection changes require the current PIN and are rate limited too. A protection change revokes existing public/PIN sessions and prevents private-link sessions from bypassing protection. Cookies are opaque, HttpOnly, Secure, SameSite Strict and scoped to a traveler. Legacy name-only sessions are rejected. TD editing requires current TD sign-in. `MEAL_PINS_REQUIRED=false` means no mandatory generated PIN; optional guest-chosen protection is independent.

Legacy private access tokens remain hashed for verification and encrypted for TD retrieval. They work only while choices are public. Traveler removal revokes access.

Functions require `MEAL_PIN_ENCRYPTION_KEY`, independently generated per site for private-link retrieval. Optional PINs use salted hashes, not reversible encryption. Prototype TD setup endpoints and credentials are not promoted.

The build sets `NEXT_PUBLIC_MEAL_CHOICES=true` in `netlify.toml`. Server authorization and deadline checks do not rely on that flag or browser clocks.

Run `node tests/meal-choices.mjs` for handler/security/deadline/export checks and `NEXT_PUBLIC_MEAL_CHOICES=true npx next build --webpack` for the static build.

## Change history

Every successful meal save/submit appends server-authored audit data to the same conditionally written submission record. It labels public access (identity unverified), PIN-authorized access, legacy private-link access or the TD Suitcase account, timestamp, and before/after meal choices, dietary notes, and status. Supplied browser actor/history fields are ignored. Only TD reports return the history; restaurant exports and traveler responses omit it. The log records the access credential used, not proof of who physically held the device. History starts with this release; prior unverified edits cannot be attributed retroactively.

## Traveler sharing

The Share your meal choices option has been removed from the traveler page. Restaurant CSV, Excel and PDF exports remain available to the TD.

## Menu layout

The traveler page shows square menu tiles in two columns on phones (three on wider screens). A tile opens its full menu below and scrolls to it; unsaved choices stay in shared form state when switching menus. Tiles show draft/submission/read-only status. Individual deadlines remain beside the meal choices.

## Paper-form import (TD only)

Open TD Suitcase → Meal choices → Scan paper meal choices. Use Take a photo or Upload photos (up to 10 images, 15 MB each). Select a photo. For several sheets in one photo, choose two/three side by side or two top/bottom; for uneven placement, drag a rectangle tightly around a single sheet. Read the selected sheet(s), then choose another photo or region as needed. Each completed crop becomes an independent review entry.

Text recognition runs in a Tesseract web worker using the existing same-site scanner assets. Photos and cropped previews remain only in memory on the device; they are not uploaded to Netlify or an external OCR service. Refreshing/clearing the page discards the photos and unsaved review work. Clear photos and reviews removes local previews without deleting submitted choices. First use needs network access to load the scanner. JPEG/PNG are recommended; device formats need to be decodable by the browser.

Select the traveler and the meals actually shown on each paper. Review each dish against the photo, transcribe allergies/dietary notes (including confirming blank notes), and check the final confirmation before submitting. Unique printed traveler names and explicit Selected/Choice/checkmarked text may suggest fields; a printed list of dishes never selects all of them. Handwriting and marked boxes are not reliably recognized and may require manual entry. Recognition never infers allergy absence. Existing saved choices/notes are shown for comparison; a confirmed import replaces only the selected meals and their dietary snapshots. Other meals are preserved. Each sheet is submitted individually; there is no automatic bulk approval.

The TD-only `paper-review` endpoint fetches the current record/revision. `paper-import` requires an active TD session, same-origin request, explicit review, valid complete choices, selected menus and an exact revision. Server deadlines still apply, including a second cutoff check before the conditional write. Closed meals cannot be imported. Stale/duplicate revisions fail rather than overwriting newer choices; reload current choices, inspect them and confirm again. Imports append the server-authored “TD paper-form entry” actor to existing change history in the same write. No guest PIN or session is changed.

Validation: `node tests/meal-paper.mjs` and `node tests/meal-choices.mjs`. Browser verification used a real two-form image and real locally served OCR assets, with backend APIs mocked; it checked separate crops/text, explicit confirmation, corrected choices/dietary submission and phone layout.

## Meal visibility controls

TD Suitcase → Meal choices → Meals shown to travelers has one switch for each of the five menus. Existing menus start shown. Toggle a menu to hide its tile and form from travelers; showing it again restores access to the same saved choices subject to its original deadline. Hidden menus remain in TD reports/exports and paper-form import tools. A TD viewing an individual traveler can still manage all meals, with hidden ones labeled as a TD preview.

Visibility is stored separately in `settings/visibility` with revision checks and same-origin/TD authorization. Traveler responses omit hidden selection/state records. Traveler writes cannot target hidden meals; old all-menu requests only update released open meals. The handler rechecks visibility before writing to catch a meal hidden during validation. Hidden selections, per-meal dietary snapshots and audit history are preserved. Public pages refresh visibility on focus and every 30 seconds without replacing unsaved selections. If no meals are released, show a short waiting message instead of empty controls.
