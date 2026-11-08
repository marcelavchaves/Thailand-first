# Real app tab tutorial

The stable tutorial player is unchanged. For each of the six guest tabs the film first shows a screenshot captured from the actual TravelerApp, then its explanation card. Group and More include a second real detail view. Other setup, Safe and help chapters retain their existing explanations and edition-specific behavior. No replica app, custom navigation or interactive practice route is added.

scripts/capture-real-tutorial-tabs.mjs runs against a locally served production build with an isolated Chromium on port 9265. All API responses are mocked. The guest roster contains only Sample Traveler; TD portrait/contact details and departure dates are anonymized by scripts/tutorial-capture-sanitize.js before captures. External requests, including gallery navigation, receive no-content responses; no real gallery is joined and no guest data is read or written.

The capture utility clicks every actual bottom-tab button and checks its active state. Assets are in assets/tutorial/app-tabs. scripts/tutorial_app_views.py inserts the views into scripts/generate-help.py. Validation compares decoded movie frames with the source screenshots for every tab and verifies the standard player controls, chapter navigation and captions. Use a byte-range-capable local server for video seeking tests.
