# Per-day optional content

In TD Suitcase → Announcements or Daily schedule, choose a journey day. “Show on Day” controls the announcement, memories, trivia and language lessons separately. All start hidden. Save announcement text as a draft before showing it. Hiding preserves its draft; deleting turns it off too. The Home announcement has a small top-right up/down arrow, with panel order saved on the traveler’s device.

Settings use revision checks and are separate on live and prototype. Traveler settings refresh on focus/every 30 seconds and fail closed. Hidden announcements are omitted from public API responses and update notifications; signed-in TDs can still edit them. More → Learn more always offers language lessons, the language quiz and trivia, regardless of journey-page visibility settings. Existing memories and lesson content are preserved.

Removed from traveler views: clock location under the Home time, schedule resource headings, Day N schedule titles and A note for today panels. Reminder data remains in the TD editor. Day-photo exports omit hidden announcements and the reminder panel.

The release does not copy prototype-only meal features into live. Tests: node tests/day-feature-visibility.mjs; each site’s static build; browser checks of both builds for hidden defaults, TD reveal, day isolation, arrow order and mobile layout.
