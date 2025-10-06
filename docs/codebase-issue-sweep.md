# Codebase Issue Sweep

## Push notification lifecycle
- **Logout leaves prior subscriptions active.** Signing out only calls `signOut` and redirects without clearing the registered push subscription, so the previous account keeps receiving alerts on that device. The only path that unsubscribes is the toggle handler, which a user will not hit during a normal logout flow.【F:src/app/dashboard.tsx†L227-L295】
- **Client sync clobbers worker metadata.** `persistSubscription` rewrites each Firestore document without `merge`, dropping the `updatedAt` field that the service worker/API inject to track rotation history.【F:src/firebase/messaging.ts†L96-L114】【F:src/app/api/push-subscriptions/route.ts†L35-L48】
- **Rotation endpoint trusts any caller.** `/api/push-subscriptions` never verifies Firebase Auth, so anyone who knows a user ID can create or delete subscription records using admin credentials.【F:src/app/api/push-subscriptions/route.ts†L14-L64】

## Transaction workflow
- **Form rewrites corrupt transaction history.** The add/edit drawer always sets `Type: 'Expense'` and `Date: new Date()` before writing, so editing an income entry or updating notes silently converts it into a new expense stamped with “now”.【F:src/components/dashboard/add-transaction-form.tsx†L94-L120】
- **Drawer closes even when writes fail.** The `finally` block closes the drawer regardless of the write outcome, leaving the user without feedback or a chance to retry if the Firestore call rejects.【F:src/components/dashboard/add-transaction-form.tsx†L112-L130】
- **Admin transaction API trusts user input.** The `/api/transactions` route accepts an arbitrary `userId`, `Type`, and `Date`, then writes with admin privileges; a malicious caller can post transactions for another account or supply an invalid `Date` object without any authentication or schema guard.【F:src/app/api/transactions/route.ts†L89-L149】

## Documentation alignment
- **Stored push documents differ from rules commentary.** The Firestore rules comment describes a `userId` field in `pushSubscriptions`, but the persisted schema only includes `endpoint`, `keys`, and timestamps, which will confuse future rule edits.【F:firestore.rules†L18-L24】【F:src/firebase/messaging.ts†L96-L114】
