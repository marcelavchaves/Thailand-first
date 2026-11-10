# Traveler Safe: sign in and open automatically

Guests in both editions use a verified email/password or Google account. A private Safe opens automatically after sign-in; there is no Safe PIN, invitation, activation, Connect step or TD email setup. Account creation still requires the normal email confirmation. Forgot password resets the account password. Live and prototype use the same sign-in behavior.

The server verifies the visitor's nf_jwt against Identity /user, never an Identity operator token. Personal account storage keys derive from the verified Identity subject, not a typed guest name, Safe ID, URL parameter, public roster email or user metadata. Provisioning uses create-only writes, independent random owner IDs and AES encryption keys. Repeat sign-in and email changes on the same Identity account retain the same personal Safe. Another verified Identity cannot access those files or plans.

Previously linked accounts continue to use their existing assigned Safe with the same document owner ID, AES key, nickname, documents and plans. First migration strips legacy PIN hashes and recovery fields. Existing personal Safes remain stable when roster entries or emails change. Revocation of a shared assignment removes access to that shared Safe; the guest can still open their own separate personal Safe. Unknown legacy PIN-only records are retained rather than guessed or attached to an arbitrary login.

The invitation endpoint is retired (410). Invitation/activation components and the TD invitation panel are removed. Old invitation fragments are discarded on the Safe page. Private TD assignment records remain solely for compatibility with already-linked/shared accounts. Guests never choose an owner from the public guest list.

Private documents remain encrypted, with server authorization, same-origin checks, rate limits, file limits and optimistic revisions. Logout clears Identity sessions and document-list caches. Downloaded files remain on the guest's device.

Validation: tests/traveler-safe.mjs covers automatic provisioning, repeat login, verified-subject stability across email changes, guest isolation, unverified/operator/legacy-cookie denial, existing encrypted file and plan preservation, authorization revocation, document CRUD, CSRF and revisions. Browser checks exercise the real Identity SDK against mocked providers for email/Google sign-in, confirmation/reset callbacks, direct Safe opening, no PIN/invitation/activation UI and responsive layouts. No real guest account or document is used in tests.
