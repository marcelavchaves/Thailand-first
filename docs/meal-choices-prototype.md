# Prototype meal choices

Site: https://thailand-first-prototype.netlify.app

This feature belongs to the `prototype` branch only. Thailand-first production remains on `main`. The meal API and one-time TD setup endpoint also refuse requests outside Netlify site `c1f3ce92-834f-4a1e-a84b-1551409ddb7b`.

## Using the feature

1. Set the prototype TD password using the private, expiring, single-use setup link. This does not copy or change a live-site credential.
2. Open TD Suitcase → Meal choices → Meal submission deadlines. Set each meal’s cutoff in Hanoi time (UTC+7). All five default to November 16, 2026 at 18:30, 30 minutes before the welcome dinner. You can adjust a deadline while that meal is still open; a closed meal cannot be reopened.
3. Travelers select their name from Meal choices (or open their guest-card Meal choices link). Choices start public. They can expand “Public choices · add an optional PIN” to set and confirm a four-digit PIN, including leading zeros. Protected choices require the PIN before opening. Changing/removing a PIN requires the current PIN; a signed-in TD can reset or remove it through the traveler’s form. Public choices and dietary notes can be read and edited by anyone selecting the name; the interface explains this before protection is removed. Existing private links remain usable for public choices, but cannot bypass PIN protection. Send those links privately if used.
4. Travelers can save drafts, submit individual meals, or submit all open meals together. Every meal closes independently at its own cutoff. A closed meal’s selections, submission status, and dietary/allergy notes remain fixed while other meals can still be edited. Existing submissions are preserved during this migration.
5. In TD Suitcase, refresh choices, select a restaurant or all menus, and download CSV, Excel (.xlsx), or PDF. Reports use each meal’s own submission status, cutoff, and saved dietary notes. Totals count submitted choices only; drafts and missing submissions remain labeled.

The Lakorn PDF specifies a lunch but not a tour day, so no date is assigned to it. The original five PDFs are linked from the corresponding forms. Menu data is in `app/meal-menus.json`; default deadline and per-meal validation helpers are in `lib/meal-choices.ts`. TD-adjusted deadlines are stored under `settings/deadlines` in the meal store.

## Storage and configuration

Private Netlify Blobs store `meal-choices-v1` contains separately keyed credentials, submissions, sessions and rate-limit records. `protection/<guestId>` holds the optional PIN’s salted scrypt hash and version; raw PINs are never returned or stored. PIN login is limited by both guest and IP, with 15-minute windows; protection changes require the current PIN and are rate limited too. A protection change revokes existing public/PIN sessions and prevents private-link sessions from bypassing protection. Cookies are opaque, HttpOnly, Secure, SameSite Strict and scoped to a traveler. Legacy name-only sessions are rejected. TD editing requires current TD sign-in. `MEAL_PINS_REQUIRED=false` means no mandatory generated PIN; optional guest-chosen protection is independent.

Legacy private access tokens remain hashed for verification and encrypted for TD retrieval. They work only while choices are public. Traveler removal revokes access.

Prototype-only Functions secrets: `MEAL_PIN_ENCRYPTION_KEY`, `PROTOTYPE_TD_SETUP_HASH`, and `PROTOTYPE_TD_SETUP_EXPIRES`. The setup link’s raw token is never stored in the repository or Netlify environment. Setup only creates an absent TD credential, with a conditional write. The encryption key supports legacy private-link retrieval; optional PINs use salted hashes, not reversible encryption.

The prototype build sets `NEXT_PUBLIC_MEAL_CHOICES=true` in `netlify.toml`. Server authorization and deadline checks do not rely on that flag or browser clocks.

Run `node tests/meal-choices.mjs` for handler/security/deadline/export checks and `NEXT_PUBLIC_MEAL_CHOICES=true npx next build --webpack` for the static build. Never push this feature to `main` without separate authorization.

## Change history

Every successful meal save/submit appends server-authored audit data to the same conditionally written submission record. It labels public access (identity unverified), PIN-authorized access, legacy private-link access or the TD Suitcase account, timestamp, and before/after meal choices, dietary notes, and status. Supplied browser actor/history fields are ignored. Only TD reports return the history; restaurant exports and traveler responses omit it. The log records the access credential used, not proof of who physically held the device. History starts with this release; prior unverified edits cannot be attributed retroactively.
