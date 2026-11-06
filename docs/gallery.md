# Gallery navigation

The live and prototype Gallery tabs immediately navigates to the supplied Omnifizer gallery URL. There is no separate Open photo gallery launch button. The gallery runs as a top-level page so it can use its own first-party cookies/storage to recognize an existing member or present its Join screen. The travel app does not inspect cross-origin member state, pass guessed member parameters or mark a visitor as joined just because the page was opened. A plain fallback link remains only for browsers that block the automatic navigation.

Local browser checks mock the external destination to verify immediate navigation and the exact URL. They do not verify the external service’s membership implementation. Joining and remembering members are owned by Omnifizer. Both sites use the supplied gallery URL; gallery membership is handled by Omnifizer.
