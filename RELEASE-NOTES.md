## Prioritize Xavier’s Hanoi map

- Make Xavier’s supplied Hanoi map the main map card, opening directly in Google Maps. Move the generic Hanoi map to a secondary “Open the city’s map” link.

## Distinct city map icons

- Give all eight visited cities their own landmark illustration, keeping the green, gold and ivory tile style: Turtle Tower, Hue Imperial City, Dragon Bridge, Hoi An lanterns, Saigon Central Post Office, Angkor Wat, Doi Suthep and Wat Arun.

## Group hotel maps

- Combine hotel maps under one Hotels tile; expand it to browse individual hotels and open their maps.

## Maps city and hotel tiles

- Match the Essentials and More tile layout, with separate city and hotel icons, expandable map panels and automatic scrolling.
- Add Xav’s supplied Hanoi map link; retain Google Maps, OpenStreetMap and shared maps.

## Timeline time and zoom controls

- Reduce the itinerary time size and move each entry’s enlarged-view control to the right edge. Replace the diagonal arrow with a magnifying-glass-plus icon, retaining the accessible dialog and large touch target.

## Calendar button visibility

- Enlarge the calendar icon and touch target, with a gold icon, solid green button and stronger label.

## Collapsible combined calendar

- Replace separate month calendars with one continuous, weekday-aligned grid spanning the journey dates, with month labels on each date.
- Put the Calendar toggle in the Home day header, collapsed by default. Selecting a date closes the calendar and opens that day; highlight the selected date.

## Original Home day controls

- Use the 103 edition’s compact Home previous/day/next controls, date and local clock below the calendar. Open the current day (Day 1 before departure) by default.
- Remove destination thumbnails, hero images and the separate Journey navigation bar from Home while retaining daily itinerary tools, swipe navigation and calendar date selection.

## Unified Home and journey

- Move the calendar to the top of Home and bring all day lists, itinerary details, swipe navigation and daily tools into Home. Remove Journey from bottom navigation.
- Keep Day 1 preview before departure and preserve old journey/day links as Home links.

## Home preview and navigation labels

- Show the Day 1 itinerary on Home before departure, including when live schedule data is unavailable or not released. Preserve visibility controls after the trip starts.
- Rename Map to Maps and Info to The Group.

## Journey navigation and Map tab

- Match the 103 edition’s day navigation layout, keep it below the resized banner, and restore day artwork.
- Add a Map tab with Google Maps, OpenStreetMap, eight destination choices, hotel links and a Maps collection for tour-director uploads.

## Journey calendar visibility

- Replace the blank-looking date grid with readable November and December 2026 calendars. Highlight all 16 tour dates by country and keep date buttons linked to the daily itinerary.

## Southeast Asia reading and viewing guide

- Replace the inherited reading resources with all 7 books, 8 films/documentaries and 5 cultural series from the supplied guide, including book links, viewing information and the four-week plan. Offer the source guide for download.

## More trip recommendations

- Replace the Vietnam, Cambodia & Thailand recommendation with Kingdoms & Dragons: Singapore to Bali, its 14-day route and official Tauck link. Correct the matching Tauck reading-resource title. Details checked against the original Tauck trip documents; a fresh website check awaits network access.

## Xavier profile

- Add the supplied portrait, WhatsApp number, email and full biography to the Info tab. Show contact details and About Xavier expanded by default; omit the old tour group invitation.

## Banner typography

- Slightly reduce WONDERCASE and enlarge Vietnam, Cambodia & Thailand, with wrapping on small screens.

## Discreet admin entry

- Display WONDERCASE in capitals and use the unstyled title to open master-admin sign-in. Remove the visible admin link from More. Existing authentication remains required.

## Section navigation and banner

- Scroll newly opened More and Essentials sections into view below the sticky banner; respect reduced-motion preferences.
- Show Wondercase, Vietnam, Cambodia & Thailand, and xxx Edition as three banner lines.

## Journey destination watercolors

- Add matching watercolor destination thumbnails to the left of all 16 days in the Journey list, including Hue, Hoi An, Cu Chi, Angkor, Chiang Mai, Doi Suthep and Bangkok. Keep day labels and navigation readable on mobile.

## Fictional guest names

- Replace the 16 guest names with cute fictional names, keeping guest IDs and Safe assignments stable. Refresh the published roster independently of daily schedules.

## Xavier director naming

- Replace remaining Chervil/Cher labels with Xavier throughout the app, notifications, help text, tutorial captions and downloadable guides. Preserve the existing TD password binding for compatibility.

## Thailand build fix

- Use the supplied Vietnam, Cambodia & Thailand itinerary PDF directly. Remove the inherited PDF-generation step from the Netlify build, which failed on missing legacy day artwork.

## Preview: TD password readiness and sessions — October 16, 2026

- TD sign-in recognizes both a password saved through Master Admin and the original CHERVIL_NOTES_PASSWORD configuration.
- Sessions established with a saved credential remain valid when the original environment variable is absent. Password changes still invalidate prior sessions.
- Truly unconfigured deployments now explain that the master admin must set a TD password, instead of displaying a misleading Identity activation message.
- Regression checks cover original and saved passwords, missing configuration, session persistence, password rotation, logout, and cross-origin denial.

## Preview: unblock Identity setup without an operator token — October 16, 2026

- Identity readiness now uses the available endpoint rather than requiring an operator token before setup, recovery, or login.
- The visitor session is verified with Identity’s user endpoint. Confirmed owner accounts with the existing master-admin role can authenticate without privileged Identity administration access; absent roles remain blocked and cannot be self-assigned without operator access.
- Real SDK regression checks cover password login, activation and session checks without an operator token, plus rejection of missing roles.

## Preview: welcome heading and master-admin session — October 16, 2026

- Reduced welcome-letter heading sizes to fit on one line on narrow phones.
- Master-admin errors now distinguish rejected passwords from role activation, service, email recovery, and rate-limit failures.
- Fixed master-admin session verification to validate the visitor’s Identity cookie rather than the SDK’s preferred operator token. Owner email, verified account, and server-side role checks remain required.
- Added real-SDK regression coverage for login persistence, invitation activation, sign-out, forged sessions, account restrictions, and provider failures, alongside the existing TD password reset checks.
- Live Identity activation and MASTER_ADMIN_EMAIL configuration still require Netlify project settings; no account credentials or project settings were changed.

# Release notes

## Preview: simple PhotoCircle invitation — October 16, 2026

- Replace the Gallery invitation with a quiet ivory-and-gold card and a single “Join our photo album” link.
- Show no QR code, inviter portrait, or personal name in the app invitation. The existing PhotoCircle destination is retained.
- PhotoCircle controls the QR code and inviter name on its external page.

## Preview: guest order, director contact and daily layout — October 15, 2026

- Follow Tauck’s sign-up order down the left guest-list column, then down the right; keep existing guest/profile and Safe IDs attached to their owners.
- Arrange each Journey day as announcement, schedule, hotel, meals, then supporting content.
- Show Chervil’s welcome letter below the Home schedule only when viewing Day 1.
- Add Chervil’s supplied phone number (+61 400 957 782) and WhatsApp link to Info.
- Remove the welcome-letter PDF and itinerary/amendment link wording below the welcome letter; retain her original sign-off.
- Identify Chervil Tan as tour director beside the app’s PhotoCircle link. PhotoCircle controls the inviter name on its external invitation page.
- Preview only; do not merge until approved.

## Preview: Cher’s tour documents and guest list — October 15, 2026

- Import the 16 unique guests and hometowns from GUEST LIST SM23, retaining first-occurrence document order and leaving missing biographies/contact details blank.
- Publish the supplied 16-guest roster and all 14 daily schedules on fresh and existing deployments. Match existing guest/profile IDs by name and retain all issued Safe IDs. After this one-time import, later TD hides, edits and removals remain effective.
- Replace the 14 daily schedules with Cher’s ITINERARY.pdf, using the sunrise program for Day 5 and the 8:30 AM art-museum departure for Day 9 from the amendments.
- Add Cher’s food recommendations and source PDF to Day 1, and replace the welcome letter with the newly supplied version and PDF.
- Keep the original itinerary and amendments available from the Day 1 welcome panel.
- Label guest Safe links “My Safe.” Disable Journey Shop in More and show “Coming soon.”
- Update the Labuan Bajo flight time to 11:40 AM and remove meal inclusions contradicted by the supplied schedules.
- Include the currently visible roster and its approved profiles in live itinerary PDFs. Replace legacy schedules with the newly supplied itinerary; subsequent TD schedule edits take precedence.
- Verify initial publication and later hide/edit controls through the real API handlers, including fresh and legacy storage.
- Preview branch only; do not merge until approved.

## Preview: ampersand title — October 15, 2026

- Change the banner and browser title to KINGDOMS & DRAGONS.
- Retain the KD 103 edition label and existing layout.
- Preview branch only; do not merge until approved.

## Preview: Kingdoms and Dragons title — October 15, 2026

- Set the main banner and browser title to KINGDOMS AND DRAGONS.
- Remove the duplicate tour-name subtitle, retain the KD 103 edition label, and size the longer title for mobile.
- Preview branch only; pending review before merging into main.

## Trivia readability — October 15, 2026

- Restore readable question and answer colors on the light trivia card in More and Journey.
- Match option labels, score, and progress colors to the existing green-and-gold theme.
- Keep correct/incorrect answers clearly highlighted and preserve quiz progress, scoring, and replay.

## Home countdown — October 15, 2026

- Before departure, show the current Singapore date instead of the first tour date.
- Hide the Home day number and day navigation until the journey starts.
- Enlarge the “Your journey starts in X days” countdown, with singular wording for one day.
- Keep the existing in-tour day display and navigation.

## KD 103 update — October 15, 2026

- Replace the PhotoCircle invitation with https://join.photocircleapp.com/8ZCZDG2A1P.
- Add a KD 103 WhatsApp group invitation placeholder.
- Update the top banner and related tour labels to KD 103.
- Align app metadata, welcome reception date, PDF day selector, and generated interactive itinerary with the existing October 17–30, 2026 journey calendar.
- Retain the existing welcome letter and daily schedules; correct PDF extraction so the welcome letter is included in regenerated downloads.
- Preserve styling and TD Suitcase, Traveler Safe, and Master Admin application logic.

Validation: production build and TypeScript validation, roster regression tests, and desktop/mobile browser smoke tests passed. PDF content checks passed using a diagnostic checker with corrected route/image assumptions. Existing TD/Safe/Admin regression fixture failures and stock PDF-checker limitations remain.

Publication: pending Netlify access and verification of the destination site. Deploy all configured functions using netlify.toml; do not use the legacy four-function publish script. No deploy ID has been created.
