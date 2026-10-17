# Wondercase · K&D102 Edition — v0.004

September 27, 2026

- Adopted **Wondercase** as the official app name. The compact folio masthead displays Wondercase, K&D102 Edition, and Kingdoms & Dragons in that order, freeing more vertical space for daily content.
- Updated the browser title, installed app name, guest feedback invitation, tutorial entry, and tutorial player heading. Internal K&D102 filenames and the edition label remain for continuity.
- Kept the test edition visibly marked **TEST** and refreshed the service worker cache for the new branding.
- Included two additional design mockups: ivory folio (selected) and forest green ribbon.

Verification: TypeScript, production compilation, static export, and the 92-page itinerary content check passed. Existing guest data and trip itinerary were not changed.

Deployment: Published to the existing Netlify test and live sites. Test: https://kingdoms-dragons-tour102-test.netlify.app (deploy 6ab91b49e0a386d3d6ec891e). Live: https://kingdoms-dragons-tour102.netlify.app (deploy 6ab91bd6db13481a1eb538fd). Verified both home pages and feedback endpoints return HTTP 200; the live manifest names Wondercase.
