# Codebase Review and Push Notification Findings

## Overview
This document captures the key issues discovered while reviewing the current codebase and proposes actionable fixes. The push notification pipeline—especially for an iOS 16.4+ Progressive Web App (PWA) using Firebase-backed messaging—receives special attention.

## Follow-up Review

The remediation work in this branch addresses the highest-impact findings from the initial audit:

- **Firestore subscription IDs no longer use `btoa`.** A dedicated helper replaces forward slashes in the endpoint with underscores before persisting, ensuring Firestore accepts the document IDs while still storing the raw endpoint for downstream delivery.【F:src/firebase/messaging.ts†L22-L28】【F:src/firebase/messaging.ts†L65-L85】
- **`next-pwa` now respects the custom worker.** The build pipeline points `swSrc` to the handcrafted `public/sw.js`, so production bundles keep the push handlers required for iOS PWAs.【F:next.config.ts†L5-L15】【F:public/sw.js†L2-L50】
- **Blocking alerts were replaced with design-system toasts.** Push enablement and teardown now surface non-blocking toast notifications, aligning with the rest of the UI and improving the installation flow on Safari.【F:src/firebase/messaging.ts†L30-L47】【F:src/firebase/messaging.ts†L87-L122】

## Critical Issues

### 1. Firestore document ID generation breaks subscriptions *(Status: Fixed)*
`requestNotificationPermission` formerly turned the push endpoint into a Firestore document ID with `btoa(subscription.endpoint)`, producing `/` characters that Safari endpoints almost always include. The updated `buildSubscriptionId` helper strips those slashes, allowing the subscription metadata to be written successfully while preserving the endpoint field for notifications.【F:src/firebase/messaging.ts†L22-L28】【F:src/firebase/messaging.ts†L71-L90】

**Recommendation:** Retain this sanitisation approach or migrate to a hashed identifier if you later need stronger collision guarantees.

### 2. Production builds overwrite the custom service worker *(Status: Fixed)*
`next-pwa` now receives `swSrc: 'public/sw.js'`, preventing the plugin from replacing the bespoke worker that handles push and notification click events in production builds.【F:next.config.ts†L5-L15】【F:public/sw.js†L2-L50】

**Recommendation:** Keep the `public/sw.js` file version-controlled and validate during CI that the build output still embeds these handlers.

### 3. Firebase Cloud Messaging does not reach iOS Web Push endpoints *(Status: Known Limitation)*
The backend stores raw Web Push subscriptions and uses `web-push` to fan out messages from a Firebase Admin environment.【F:src/app/api/transactions/route.ts†L17-L126】 This is compatible with browsers that support the VAPID-standard Web Push API. However, Firebase Cloud Messaging (FCM) for Web still does **not** broker notifications to Safari’s `web.push.apple.com` endpoints used by iOS 16+ PWAs. Attempting to send through FCM yields failures because Apple requires APNs credentials or a direct Web Push send.

**Recommendation:** Continue sending through the standards-based `web-push` library (with correct VAPID keys) or integrate APNs by way of Firebase Cloud Functions. Document the limitation so stakeholders do not expect FCM topics or the REST `fcm/send` endpoint to deliver to iOS PWAs until Google adds official support.

## Additional Observations

- The API route reuses the `PushSubscription` type but never strips `expirationTime`; consider pruning undefined fields before calling `webpush.sendNotification` to avoid future type regressions.【F:src/app/api/transactions/route.ts†L47-L60】
- Consider adding a `pushsubscriptionchange` handler inside the service worker so iOS can silently resubscribe when Apple rotates the subscription, preventing stale entries in Firestore.【F:public/sw.js†L6-L33】
- Client code now surfaces non-blocking toast notifications during permission flows, matching the design system and avoiding disruptive alerts on iOS.【F:src/firebase/messaging.ts†L30-L47】【F:src/firebase/messaging.ts†L95-L122】

## Next Steps
1. QA the updated subscription identifier logic on real iOS Safari devices and monitor Firestore for duplicate entries.
2. Add a CI assertion that the built service worker bundle still contains the custom `push` and `notificationclick` handlers.
3. Keep using standards-based Web Push delivery (or APNs) for iOS PWAs and update documentation to set expectations around FCM coverage.
4. Address the remaining secondary observations to improve resilience and user experience.
