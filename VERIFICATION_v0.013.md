# KD102 TEST v0.013 verification — September 28, 2026

Published deploy: 6abae14efb679ab2ffb9ea05
URL: https://kingdoms-dragons-tour102-test.netlify.app/?tab=td

Live remains 6aba1073fb745b094c1e07f4. Pre-tour remains 6aba106c0daf020e33e4e8d5.

## Passed

- Function ZIP/runtime/route/rate-limit validation; diagnostic HTTP 200 upload.
- All nine requested function uploads plus the reused functions accepted; deployment reached ready.
- Published homepage, service worker, current test manifest and iPhone icon byte-match built output.
- All automated checks listed in RELEASE_NOTES_v0.013.md.
- Browser: More and Travelers entry buttons, direct TD URL, branded sign-in page, public guest-list placeholder, fixed bottom navigation; no app-origin error observed (browser-extension log noise excluded).
- Real services: session endpoint configured; public resource, day 1/day 14 schedule, day 1/day 14 announcement, traveler profile and director-photo reads returned 200.
- Anonymous writes to password, resources, schedule, director photo, traveler profile and announcement endpoints returned 401.

## Authenticated verification completed on retry

The user retried secure browser sign-in successfully. Chervil’s authenticated workspace opened; no password reset or source change was needed.

- Announcements: selected day and editor opened; canceled without posting. WhatsApp share remains in the saved-announcement implementation; no message was sent and no announcement was created solely to test external sharing.
- Schedule: switched Day 1 to Day 14, opened editor, saved the unchanged Day 14 content. Server confirmed the date-specific save and updated interactive PDF. Schedule remained hidden from travelers.
- Documents: created a temporary custom image document through the file chooser, verified hidden TD preview, independently confirmed anonymous download returned 404, then deleted it. Browser confirmed Removed / Saved. Existing documents were unchanged.
- Hotel collections: verified Jimbaran spa menus and stay guide appeared in their collection.
- Travelers: workspace opened correctly with the intended empty guest-list placeholder.
- Account: password-change fields and photo control rendered. Uploaded the temporary test image as director photo, confirmed server save, removed it and confirmed original empty photo restored.
- Signed out after verification; workspace returned to protected sign-in.

Successful password change and actual WhatsApp delivery were deliberately not performed. Password hashing, validation, session rotation/revocation and authorization remain covered by automated tests. Real traveler profile editing remains unexercised because this tour’s guest list is empty.

No announcement or WhatsApp message was sent. Password unchanged. Temporary document removed and profile photo restored. Day 14 schedule content was saved unchanged (its update timestamp/revision advanced). Live and pre-tour unchanged.
