# Privacy implementation and public-launch requirements

Updated 2026-10-16. This file records the implementation and the operator work still required; the product must not be advertised as GDPR-certified or unconditionally compliant on the strength of its code.

## What the MVP actually processes

| Data | Location and lifetime | Control |
| --- | --- | --- |
| Keywords, names, details, message, script | Browser memory until leaving/reset; shared final card/script encrypted in D1 up to 7 days | Edit before sharing; delete bearer-linked copy without opening |
| Selected photo | Local file input and resized pixel canvas only; never uploaded | Remove photo or leave tab |
| Camera/microphone stream | Local browser only after explicit Record permission; maximum selected 15/30 seconds | Stop; automatic stop on hiding/leaving/timeout |
| Generated animation/recording | Local in-memory Blob and object URL | Preview, save, remove; URLs revoked on removal/reset |
| Rate-limit hash | Salted network/action/time-window hash in D1, short lived | Automatic cleanup; no raw application IP storage |
| Action metrics | Daily allowlisted event totals, no content/properties/visitor IDs; 90 days | Automatic cleanup; browser events respect DNT/GPC |
| Hosting traffic | Cloudflare processes network metadata | Operator must document actual hosting configuration and contracts |

Local media is never included in encrypted gift payloads. The application has no media upload endpoint, external AI vendor, face recognition, biometric identification, social SDK or automatic posting. The browser’s own file picker/camera UI is not a third-party upload. Exported frames are re-rendered without source-file metadata; the visual content can still identify a person or reveal sensitive information.

The user must have a right to use and share another person’s image; a simple uploader checkbox cannot establish another person’s lawful consent. The interface advises permission and extra care with children’s photos. Browser camera permission is a device permission, **not automatically GDPR consent**. The website operator must assess the appropriate lawful basis for each actual processing purpose.

## Complete before public launch

1. Identify the controller and publish real contact details and a full privacy notice: purposes, categories, lawful bases, recipients/processors, retention including provider backups, rights, complaint route and any international transfers. Do not use invented contact details.
2. Document lawful bases for gift delivery, abuse prevention and aggregate metrics, plus any applicable ePrivacy requirements. Encryption is a safeguard, not a lawful basis or automatic anonymisation. Religious beliefs may be special-category data when linked to identifiable people; determine whether Article 9 applies and what condition permits any processing. Do not infer beliefs from names, keywords or photos.
3. Review Cloudflare’s current DPA/subprocessors, transfer mechanisms and actual access/location configuration. Do not promise EU-only handling merely because users live in Europe. Disable content/request-body logging, session replay, and third-party trackers.
4. Establish a proportionate rights procedure for access, correction, restriction/objection and erasure. Anyone holding a gift link can delete the app’s encrypted copy, but that control is not a complete rights process. Do not collect extra identity documents by default. Explain that the operator cannot decrypt gifts without the key, and that external copies cannot be recalled.
5. Record a security/breach response process and a risk/DPIA screening, considering children’s imagery and any sensitive free text. Decide whether a DPIA is required for the actual deployment. Keep public defaults private and optional choices optional.
6. Verify network behavior and deletion/expiry in the deployed configuration, plus real iOS/Android permission, video codec and sharing behavior. Explain formats honestly; destination apps may not accept WebM.

Adding server media uploads or AI video generation would require a new data-flow and risk review, provider contracts/retention/training assurances, transfer assessment, appropriate lawful basis and updated disclosure **before enabling it**. It remains outside this MVP.

Authoritative starting points: [EDPB small-business compliance guide](https://www.edpb.europa.eu/sme/be-compliant/be-compliant_en), [EDPB lawful processing and sensitive data](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en), [EDPB DPIA guidance](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/data-protection-impact-assessments-high-risk-processing_en), [EDPB privacy by design/default](https://www.edpb.europa.eu/topics/ai-and-technology/privacy-by-design-and-by-default_en), [European Commission GDPR principles](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en).

Invitation pilot: a secure first-party functional cookie remembers creator access for up to seven days, limited by code expiry. The app stores random invitation-code hashes, random session hashes, operational credit balances and expiring delivery receipts (ciphertext hash and hashed gift token). No names or emails are required. These records enforce access and prevent duplicate credit charges; they are not attached to anonymous event totals. Raw invitation codes and gift decryption keys are never logged or included in analytics. Recipients need only their private gift link. Hosting providers process network metadata as before.
