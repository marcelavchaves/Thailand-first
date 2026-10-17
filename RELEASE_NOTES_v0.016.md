# v0.016 — TD guest roster (TEST only)

- Home day label uses the same font family and regular weight as the calendar.
- Guest names and ordering are now saved in a site-specific roster instead of being fixed in the source.
- TD-only scan/import editor accepts JPEG, PNG, WebP, PDF (10 pages maximum), CSV, TSV and pasted text. Files up to 15 MB are processed in the browser with same-origin OCR assets; originals are not uploaded.
- OCR is a draft: review text, create draft cards, correct names/headers/couples and save explicitly. English OCR may require spelling corrections for names and complex layouts.
- Two guest cards per row, with earlier/later controls for the TD to rearrange guests. Import appends to existing guests; it does not silently replace them.
- Individual bios and photos retain the existing profile editing and moderated guest-submission workflow.
- Optional phone, email and social URL fields remain TD-only unless the TD confirms the guest agreed to share them on the public Info page.
- Server-side TD/origin checks, schema validation, safe web URL validation and conditional writes protect roster updates and private contact fields.
- Existing guest profile API supports imported IDs and excludes removed guests after roster creation.

## Verification
- Next production build and TypeScript passed.
- Guest roster tests passed: authorization, contact redaction, consent, persisted order, removal, input validation, unsafe URLs, stale/concurrent writes and CSV quoted fields.
- Existing profile security/moderation/photo tests passed.
- Bundled English OCR read a synthetic image containing three test guest names.
- Real TD scan/upload/editor browser verification with a tour-provided list remains pending; no real guest list was supplied or uploaded, and no site guest data was changed in this release.
- Live and pre-tour must remain unchanged.
