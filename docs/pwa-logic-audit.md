# PWA Logic & Rules Audit

## Identified logic conflicts

1. **Transaction edits overwrite the original type and timestamp.** The form code rebuilds the payload with `Type: 'Expense'` and `Date: new Date()` for both creates and updates, so editing an income transaction or changing only the notes silently converts it into a fresh expense logged at “now”.【F:src/components/dashboard/add-transaction-form.tsx†L95-L120】 Consider preserving the original `Type` and `Date` unless the user explicitly changes them.
2. **Push subscription metadata oscillates between `createdAt` and `updatedAt`.** Client-side persistence rewrites each document without merge, removing the worker-injected `updatedAt` marker and resetting `createdAt` on every sync, while the service worker/API path stores `updatedAt` via a merge write.【F:src/firebase/messaging.ts†L96-L114】【F:src/app/api/push-subscriptions/route.ts†L35-L48】 Switching the client write to a merge (or tracking both fields consistently) would stop the churn.
3. **The rotation endpoint trusts caller-supplied identities.** `/api/push-subscriptions` accepts an arbitrary `userId` and runs with admin credentials, so any unauthenticated request can create or delete subscriptions for another account if it knows the UID.【F:src/app/api/push-subscriptions/route.ts†L14-L71】 Protect the route by verifying a Firebase Auth token or restricting it to service-worker-signed requests.
4. **Documentation vs. implementation drift.** The Firestore ruleset comments state that push-subscription documents denormalise a `userId`, yet the actual writes only persist `endpoint` and `keys`, which may cause confusion for future rule changes that rely on the documented shape.【F:firestore.rules†L21-L24】【F:src/firebase/messaging.ts†L96-L114】 Update either the stored schema or the rule documentation to stay aligned.

## Firestore rule hardening

To remove schema ambiguities and prevent malformed writes, the ruleset now:

- Centralises helper predicates for numeric, string, list, and timestamp validation so every collection enforces a consistent shape.【F:firestore.rules†L40-L120】
- Requires well-formed profile, transaction, budget, and push-subscription payloads on create/update, rejecting missing ownership fields, negative amounts, or malformed key material before they reach the database.【F:firestore.rules†L150-L183】

These constraints still honour the existing ownership model while tightening data integrity; future schema changes should extend the helper functions so the validation surface remains in one place.

## Follow-up suggestions

- Preserve push metadata across rotations by merging client writes (or by storing both `createdAt` and `updatedAt` consistently) to keep audit timelines intact.【F:src/firebase/messaging.ts†L96-L114】【F:src/app/api/push-subscriptions/route.ts†L35-L48】
- Gate the push-subscription API behind Firebase Auth verification so only the active session can rotate its own endpoints.【F:src/app/api/push-subscriptions/route.ts†L14-L71】
- Extend the Firestore helpers as new fields are added (for example, whitelisting additional transaction metadata) so validation remains explicit and conflicts stay visible in rules reviews.【F:firestore.rules†L40-L183】
