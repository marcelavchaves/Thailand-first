# Wondercase v0.007 — shared KD102 branding baseline

Prepared September 28, 2026 for identical deployment to test, live, and pre-tour.

- Continues v0.006 and its removal of Darren content.
- Approved palette: green #0D3B2E, gold #C9A962, ivory #F9F6EC, sage #6B8F72.
- Bundled Montserrat for the wordmark and headings; Avenir Next body text when available, with bundled Montserrat fallback; Cinzel accents.
- Compact ivory header with the approved outlined K&D suitcase artwork, tour identity, and “Curiosity travels well.”
- Shared theme for navigation, cards, calendars, buttons, disclosures, guest profiles, and typography throughout the interface.
- Includes the supplied Komodo dragon in relevant journey cards.
- Preserves the established installed home-screen icon, itinerary, app functionality, and site-specific stored data.
- Repairs offline pre-cache references to two brochures removed in v0.006; adds branding fonts and artwork to pre-cache.
- All sites use the production build to establish the same visible baseline, without review/test banners.

Validation: production build and TypeScript passed; 89-page itinerary checks passed (1,175 content checks, 92 external links, 623 PDF link annotations). Static brand and pre-cache asset checks passed. Local interactive browser verification was blocked by the session's socket restrictions; a Netlify-generated deployment screenshot was reviewed, and the published page, bundled font, session endpoint, and day-specific announcements endpoint passed HTTP checks. Phone-size interactive review remains outstanding.

Scope: interface branding. Existing illustrated publications and tutorial imagery remain as supplied in v0.006.
