# Admin Customer Directory

## Goal

Give mess administrators one read-only place to understand every student/customer and their current relationship with the mess without piecing together bookings, subscriptions, payments, and feedback across separate screens.

## Product decisions

- The sidebar label is **Customers**. Administrators remain under **Team & access**.
- Only student accounts appear in this directory.
- The first release is read-only. It does not delete accounts, change roles, or create subscriptions on a customer's behalf.
- A customer has an **active subscription** only when its stored status is `active` and today's date is within its start and end dates.
- A customer has an **upcoming booking** only when the booking is `pending` or `confirmed` and its meal date is today or later.
- **Both** means the customer satisfies both conditions.
- **No current service** means the customer satisfies neither condition.
- Sensitive authentication data (password hashes, Google subject IDs, tokens, and session versions) must never leave the backend.

## API contract

### `GET /api/customers`

Admin-only customer directory with server-side search, filtering, sorting, and pagination.

Query parameters:

- `search`: name, email, or phone
- `segment`: `all`, `subscribed`, `bookings`, `both`, or `inactive`
- `sort`: `newest`, `oldest`, `name_asc`, `name_desc`, or `recent_activity`
- `page`: positive integer
- `limit`: 10–50

### `GET /api/customers/:id`

Admin-only customer profile containing safe account fields, subscription history with skips, booking history, payment history, feedback history, and aggregate totals.

## Interface

- Desktop: compact operational table with clear service-state chips and a direct profile action.
- Mobile: stacked customer rows/cards preserving the same information hierarchy.
- Controls: segment tabs, search, sorting, pagination, loading skeleton, empty state, error recovery, and keyboard-visible focus.
- Customer profile: contact/joined information, current-service summary, active subscription dates and remaining days, and compact history sections.
- Visual language: inherit `DESIGN.md` and existing Calm Operations Desk components; do not add a new UI dependency.

## Delivery checklist

- [x] Isolate work on `admin-customer-directory` branch/worktree.
- [x] Confirm existing schema can support the feature without a migration.
- [x] Record the parallel-worktree lesson in external interview notes.
- [x] Add admin-only customer list and detail endpoints.
- [x] Add backend validation, safe field selection, filters, sorting, and pagination.
- [x] Add customer service module in the frontend.
- [x] Add Customers navigation and routes.
- [x] Build responsive customer directory states.
- [x] Build responsive customer profile and related histories.
- [x] Extend integration coverage for authorization and directory semantics.
- [x] Run backend integration tests.
- [x] Run frontend lint and production build.
- [x] Run desktop/mobile visual inspection and Impeccable detector/reviewer.
- [x] Commit and push the feature branch for review.
- [ ] Merge and deploy only after explicit approval.

