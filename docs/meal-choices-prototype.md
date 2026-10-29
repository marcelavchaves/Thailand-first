# Prototype meal choices

Site: https://thailand-first-prototype.netlify.app

This feature belongs to the `prototype` branch only. Thailand-first production remains on `main`. The meal API and one-time TD setup endpoint also refuse requests outside Netlify site `c1f3ce92-834f-4a1e-a84b-1551409ddb7b`.

## Using the feature

1. Set the prototype TD password using the private, expiring, single-use setup link. This does not copy or change a live-site credential.
2. Open TD Suitcase → Meal choices. Generate missing traveler PINs. View each PIN and copy its invitation; send it privately to that traveler.
3. On Day 1, travelers open Dinner choices, select their own name and enter their eight-digit meal PIN. They choose all nine courses across five menus and add any dietary restrictions or allergies. Saving a draft does not submit it.
4. Submit all choices before **November 16, 2026 at 18:30 Hanoi time (11:30 UTC)**, 30 minutes before the 19:00 welcome dinner. Submitted choices can be updated until the same cutoff. The server rejects writes at and after the cutoff, including TD overrides. Saved choices can still be read.
5. In TD Suitcase, refresh choices, select a restaurant or all menus, and download CSV, Excel (.xlsx), or PDF. Totals count submitted choices only; drafts and missing submissions remain labeled. Dietary notes accompany every restaurant report. PINs never appear in restaurant reports.

The Lakorn PDF specifies a lunch but not a tour day, so no date is assigned to it. The original five PDFs are linked from the corresponding forms. Menu data is in `app/meal-menus.json`; the welcome-dinner time and deadline are centralized in `lib/meal-choices.ts`.

## Storage and configuration

Private Netlify Blobs store `meal-choices-v1` contains separately keyed credentials, submissions, sessions and rate-limit records. PINs use a salted scrypt verifier plus AES-256-GCM encryption so authenticated TDs can retrieve them. Browser sessions contain only opaque HttpOnly cookies; PIN replacement revokes old sessions. Removed travelers cannot access their old records.

Prototype-only Functions secrets: `MEAL_PIN_ENCRYPTION_KEY`, `PROTOTYPE_TD_SETUP_HASH`, and `PROTOTYPE_TD_SETUP_EXPIRES`. The setup link’s raw token is never stored in the repository or Netlify environment. Setup only creates an absent TD credential, with a conditional write. Do not rotate the meal encryption key without reissuing all PINs.

The prototype build sets `NEXT_PUBLIC_MEAL_CHOICES=true` in `netlify.toml`. Server authorization and deadline checks do not rely on that flag or browser clocks.

Run `node tests/meal-choices.mjs` for handler/security/deadline/export checks and `NEXT_PUBLIC_MEAL_CHOICES=true npx next build --webpack` for the static build. Never push this feature to `main` without separate authorization.
