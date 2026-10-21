# Validation — updated 2026-10-20

## Fixed cards and wallpapers — 20 October 2026

Thirteen automated checks cover title balance, wallpaper line breaks and content separation, full message/signature preservation, refusal to silently truncate excessive text, all 60 message combinations, encryption and read-only recipient sharing. Six generated backgrounds are locally served WebP assets. Local browser review confirms holiday panel and signature clarity plus a separate short-line wallpaper preview. Saved-export and live recipient checks recorded below after deployment.


## Seasonal themes and wishes — 2026-10-19

Ten automated checks pass, covering all 60 moment/faith/tone combinations, occasion-neutral wishes and short scripts, six theme names and legacy theme aliases, encryption, recipient sharing protection, and camera cleanup. Live private Cloudflare browser check confirms the Sending wishes radio changes suggestions, generates its own title/message/keepsake, and exposes six visual choices. Full-page Halloween and Christmas previews reviewed for message readability. Backgrounds are predefined canvas decorations shared by card, wallpaper, social preview and recipient render paths; no new API or data collection added.

## Recipient read-only view — 2026-10-19

Eight automated checks pass, including preservation of original title/message/keepsake/signature in recipient sharing despite attempted title/line overrides. Recipient rendering uses text nodes, hides authoring and production tools, and freezes the received data; sender editing is unchanged. Save and Share remain available. Cloudflare Access's first-login fragment handoff remains a separate limitation: sign in, then reopen the original gift link if the recipient landing screen is lost. No token is consumed by that navigation.

Live Cloudflare smoke test: created and explicitly redeemed a fresh synthetic gift. Recipient view shows the original message and signature with no editing controls; sharing preview also has no editing fields and retains Save/Share actions.

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

## Protected Cloudflare address — 2026-10-19

The owner supplied a saved Worker Access screenshot confirming All traffic and Cloudflare account members (Allow). Enabled workers.dev while keeping preview URLs disabled, then verified cookie-free GET /, GET /app.js and POST /api/share each return 302 to the account’s Cloudflare Access sign-in domain. The live test address is https://little-light-blessings.elsa-yilin-w39.workers.dev . Signed-in app and recipient-link smoke checks remain pending. Only permitted account members can use this test, including recipients.

Live Cloudflare verification: created and explicitly redeemed a synthetic Christmas gift. Recipient remains read-only with Save card, Save wallpaper and Share card; social dialog has no editing controls. Both PNG downloads completed and were visually inspected: card retains full message, keepsake and signature on cream panel; wallpaper is 1080×1920 with only the keepsake line. Access policy unchanged. Deployment ddfb1b42-3b6e-4a2a-a7d6-0837868555fe.

21 October 2026: added the two approved baby designs as same-origin compressed WebP assets; eight themes total. All thirteen regression checks pass, including legacy aliases and fixed output formats. No pet-voice feature added in this change.
Live browser check passed for both new themes: readable full card text/signature above the nursery illustration and short-line wallpaper preview. Deployment c23305fb-c587-45de-8676-5f355d6a0031.

21 October sharing controls: fourteen automated checks pass, including local SVG-only platform controls and no embedded external resources. Local browser verified five labelled icons, the intact full-card preview, app-picker guidance and direct-link sharing controls. No real social message was sent during testing. Cloudflare access change remains a separate user choice; existing All traffic account-member restriction is still applied.
