# Prototype meal choices

Site: https://thailand-first-prototype.netlify.app

This feature belongs to the `prototype` branch only. Thailand-first production remains on `main`. The meal API and one-time TD setup endpoint also refuse requests outside Netlify site `c1f3ce92-834f-4a1e-a84b-1551409ddb7b`.

## Using the feature

1. Set the prototype TD password using the private, expiring, single-use setup link. This does not copy or change a live-site credential.
2. Open TD Suitcase → Meal choices → Meal submission deadlines. Set each meal’s cutoff in Hanoi time (UTC+7). All five default to November 16, 2026 at 18:30, 30 minutes before the welcome dinner. You can adjust a deadline while that meal is still open; a closed meal cannot be reopened.
3. Travelers open Meal choices beside Safe on their guest card, which preselects their name. They can also use the Day 1 Dinner choices button and choose their name. No meal PIN is currently required. Anyone with the prototype link can choose a traveler and view or manage that traveler’s meal choices. Traveler Safe authentication is unchanged.
4. Travelers can save drafts, submit individual meals, or submit all open meals together. Every meal closes independently at its own cutoff. A closed meal’s selections, submission status, and dietary/allergy notes remain fixed while other meals can still be edited. Existing submissions are preserved during this migration.
5. In TD Suitcase, refresh choices, select a restaurant or all menus, and download CSV, Excel (.xlsx), or PDF. Reports use each meal’s own submission status, cutoff, and saved dietary notes. Totals count submitted choices only; drafts and missing submissions remain labeled.

The Lakorn PDF specifies a lunch but not a tour day, so no date is assigned to it. The original five PDFs are linked from the corresponding forms. Menu data is in `app/meal-menus.json`; default deadline and per-meal validation helpers are in `lib/meal-choices.ts`. TD-adjusted deadlines are stored under `settings/deadlines` in the meal store.

## Storage and configuration

Private Netlify Blobs store `meal-choices-v1` contains separately keyed credentials, submissions, sessions and rate-limit records. Meal PINs are currently paused (`MEAL_PINS_REQUIRED=false`). Previous PIN records are retained but unused; generation/reveal actions and the PIN interface are disabled. Browser sessions contain only opaque HttpOnly cookies and identify the traveler selected by name. Removed travelers cannot access their old records.

Prototype-only Functions secrets: `MEAL_PIN_ENCRYPTION_KEY`, `PROTOTYPE_TD_SETUP_HASH`, and `PROTOTYPE_TD_SETUP_EXPIRES`. The setup link’s raw token is never stored in the repository or Netlify environment. Setup only creates an absent TD credential, with a conditional write. The encryption key is retained for future PIN support; it is not needed for name-only entry.

The prototype build sets `NEXT_PUBLIC_MEAL_CHOICES=true` in `netlify.toml`. Server authorization and deadline checks do not rely on that flag or browser clocks.

Run `node tests/meal-choices.mjs` for handler/security/deadline/export checks and `NEXT_PUBLIC_MEAL_CHOICES=true npx next build --webpack` for the static build. Never push this feature to `main` without separate authorization.
