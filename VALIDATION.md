# Validation — updated 2026-10-16

## Cloudflare backend preparation — 2026-10-19

OAuth connection verified for the owner's selected account. Created D1 database `little-light`, applied migration `0001_initial.sql`, and deployed `little-light-blessings` with its hourly cleanup schedule and asset binding. Seven unit tests passed before deployment. `workers_dev` and `preview_urls` are disabled, with no custom routes configured, until the owner-only Cloudflare Access policy is configured. This is a deployed backend without a publicly reachable test address; hosted recipient-link tests and private-access verification remain pending.

## Private-test feedback update — 2026-10-18

- Seven unit checks pass, including conversational baby-shower scripts with 15/30-second word budgets, one-sentence quote extraction, and preservation of the formal card message.
- Sharing now retains the full message and signature; the earlier redaction behavior below is historical and has been removed from this MVP. The long spoken script is not exported on the card.
- Browser smoke check: baby-shower scenario, names and three keywords, conversational script beside recording controls, optional quoted keepsake sentence, full-content share preview, then Write another. Verified keywords, recipient, sender and personal detail are empty, selections reset and optional panels close without requiring a save/share first.
- Simulated camera tests verify the guide uses the spoken script and is hidden when recording ends/leaving. The recorder receives the raw camera stream; no guide text is burned into saved video. Actual camera eye contact and physical-device layout remain user-pilot checks; no real camera was accessed by the tests.

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

## Publication preparation — 2026-10-18

The owner supplied the new `ElsaYilinWang/little-light-blessings` repository. Its remote was checked and had no refs before the initial push. Documentation now prioritises the five-sender card/wallpaper pilot and labels existing media experimental. Six unit tests are rerun before publication. Source publication does not imply Cloudflare deployment, real-device media verification or completed GDPR launch requirements.
