# Validation — 2026-10-15

Verified locally using Node 24 and Wrangler 4.151.0:

- All 40 preset × faith × tone combinations; personal detail insertion and unsupported occasion rejection.
- No script in default results; explicit script creation uses the edited message.
- AES-GCM round trip; wrong keys and changed ciphertext rejected.
- Real local D1/HTTP integration: GET and HEAD cannot consume gifts; cross-origin POST rejected; concurrent redemption returns exactly one 200 and one 410; expired gift returns 410; excess share attempts return 429.
- Analytics reject extra properties and unknown event names; request payload limit enforced.
- Syntax checks and dependency audit pass; zero reported vulnerabilities after updating Wrangler.
- In-app browser: Thinking of You composition, editable result, optional script, encrypted link creation, recipient landing screen and successful decryption. Desktop and 390-pixel mobile layouts reviewed.

Limits: no production Cloudflare deployment or real iOS/Android device test. PNG export code is implemented but successful saves on physical devices are not verified. Browser viewport testing is not a substitute for that pilot check. Optional Turnstile integration is a server hook, disabled by default. No live LLM calls are made.

Publishing: initial local Git commit on main. Connected GitHub account: ElsaYilinWang. Repository creation is not exposed by the available GitHub connector, the GitHub CLI is absent, and existing accessible projects are unsuitable. Create an empty public `little-light-blessings` repository, then run the two publishing commands in README. Nothing was pushed into another project.
