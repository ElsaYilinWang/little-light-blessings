# Validation — updated 2026-10-16

Verified locally using Node 24 and Wrangler 4.151.0:

- All 40 preset × faith × tone combinations; personal detail insertion and unsupported occasion rejection.
- No script in default results; explicit script creation uses the edited message.
- AES-GCM round trip; wrong keys and changed ciphertext rejected.
- Real local D1/HTTP integration: GET and HEAD cannot consume gifts; cross-origin POST rejected; concurrent redemption returns exactly one 200 and one 410; expired gift returns 410; excess share attempts return 429.
- Analytics reject extra properties and unknown event names; request payload limit enforced.
- Syntax checks and dependency audit pass; zero reported vulnerabilities after updating Wrangler.
- In-app browser: Thinking of You composition, editable result, optional script, encrypted link creation, recipient landing screen and successful decryption. Desktop and 390-pixel mobile layouts reviewed.

## MVP simplification and local-media update

- Six unit tests pass: existing preset/encryption checks, keyword defaults/deduplication/bounds and short script word budgets, public-card redaction without modifying the private original, and camera cleanup including late permission after leaving. Camera tests use simulated streams, not the user's camera.
- Updated local D1 integration passes explicit deletion without reading/decrypting content, cross-origin rejection, no deletion on GET, and all existing preview/expiry/concurrency/metrics/rate-limit checks.
- Browser tested: occasion and keywords with optional personalisation collapsed; on-request 15-second script; social share preview with redaction enabled by default; actual PNG file download.
- A synthetic photo was selected locally, a 15-second animation was generated, and an MP4 file downloaded (112,470 bytes with video track and media data). Embedded-player preview compatibility was inconclusive. Added explicit media load, playable-codec selection and a clear preview-error fallback. Codec playback/duration quality on real devices remains a pilot requirement.
- No real user camera/microphone was accessed. No photo/video media endpoint or media analytics exists. Photos/videos are not embedded in gifts. Source and hosting header checks permit camera/microphone only for the same origin, subject to browser permission.

Limits: no production Cloudflare deployment or real iOS/Android device test; no actual WhatsApp/Instagram post. Native share target availability, video codec playback and recording on physical devices remain unverified. Browser testing is not a substitute for that pilot check. Optional Turnstile integration is a server hook, disabled by default. No live LLM calls are made. GDPR operator requirements in PRIVACY.md remain incomplete before public launch.

Publishing: initial local Git commit on main. Connected GitHub account: ElsaYilinWang. Repository creation is not exposed by the available GitHub connector, the GitHub CLI is absent, and existing accessible projects are unsuitable. Create an empty public `little-light-blessings` repository, then run the two publishing commands in README. Nothing was pushed into another project.
