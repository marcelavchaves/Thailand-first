# Wondercase KD102 v0.008

Shared release for test, live and pre-tour.

- Approved full-color suitcase/globe main banner; removed the tagline.
- Brand icon artwork across navigation, guide cards, menus and schedules.
- Journey day swipe navigation retains first/last-day bounds, ignores controls and vertical scrolling, and includes a visible hint.
- Guides, destination stories, stay guides, menus and daily schedules start with Coming soon and require TD release.
- TD controls: preview, reveal, hide, rename, upload replacement, add PDF/image, delete and restore hidden. Uploads up to 3 MB; replacements require fresh approval.
- Resources persist separately on each site, with version conflict protection. The same resource state is used on related pages.
- Existing TD password now supports an eight-hour secure, HttpOnly session while Netlify Identity is not activated. Identity remains the primary authentication path when configured. Sign-out invalidates the server session; password changes invalidate old sessions.
- Day photos, day PDFs and the current travel book honor hidden schedules. Document viewers honor resource releases.
- Tauck itinerary, useful contacts, companion letter, tutorial and More content retained.
- Existing phone installation icon retained.

Validation: production Next build and TypeScript; release policy tests; resource authorization tests; deployed endpoint and TD workflow checks. Native mobile swipe interaction requires a device check; local browser execution is unavailable in this environment.

TD workflow: Info → tap Chervil’s name/photo → enter existing password. Open a resource’s Preview / edit, upload if needed, then Reveal to travelers. Edit daily schedules inside their preview. Uploading a replacement automatically hides it until revealed.
