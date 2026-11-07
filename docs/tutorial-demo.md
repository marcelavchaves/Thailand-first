# Tab and feature tutorial

/tutorial-explore is an isolated practice route using the app’s fonts, colors, navigation icons and Wondercase mark. Its thirty states show the six tabs and representative expanded features. All content is explicitly sample data; buttons only change local component state. There is no authentication, external gallery join, API call, file upload or submission. Live demonstrates its PIN Safe; prototype demonstrates direct email/Google Safe access and booklets.

The existing suitcase opening and interactive video controls remain. scripts/generate-help.py uses scripts/tutorial_tab_frames.py and assets/tutorial/demo-screens to render three feature states per chapter, with fades and tap highlights. Captions, chapter timing, download links and printable help remain synchronized.

To refresh the sample captures, build the app with NEXT_PUBLIC_MEAL_CHOICES=true npx next build --webpack, serve out locally, and start an isolated Chromium with --remote-debugging-port=9265. Run node scripts/capture-tutorial-demo.mjs http://127.0.0.1:PORT PATH_TO_REPO. It visits only the practice route, validates all thirty states and saves screenshots plus tap coordinates. Run scripts/generate-help.py in an environment with Pillow, ReportLab, PyMuPDF and qrcode, then rebuild or copy the updated public/tutorial files to the local preview. Use a byte-range-capable server when checking video seeking.

Browser validation covers six-tab navigation, expansions, the hotel/local-guide panels, meals, edition-specific Safe screens, answer reveal, language lessons, guided playback, 320/390/1000px layouts and zero API requests. No traveler identity, personal document or real gallery photo appears in the demo or captures.
