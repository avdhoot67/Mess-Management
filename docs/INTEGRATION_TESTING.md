# Integration Testing

`backend/scripts/integration-smoke.js` is a real HTTP smoke suite. It creates unique temporary records, exercises the backend through the API, and removes those records in a `finally` cleanup block.

It verifies:

- password registration, login, protected API access, refresh-cookie rotation, logout, and revoked-token rejection;
- student/admin authorization boundaries;
- subscription payment submission, admin approval, activation, and an eligible day skip;
- individual booking, receipt download, future cancellation, and past-cancellation rejection;
- eligible feedback, duplicate-feedback rejection, and the AI minimum-feedback guard.

It does not call Google or send email, so it does not require external OAuth or SMTP interaction.

## Run locally

Start the backend in one terminal:

```powershell
cd backend
npm run dev
```

Then run the suite in another terminal:

```powershell
cd backend
npm run test:integration
```

Use `INTEGRATION_API_URL` only if the backend is on a different port:

```powershell
$env:INTEGRATION_API_URL='http://localhost:5002/api'
npm run test:integration
```

## Manual checks before deployment

- Complete Google sign-in and account linking with the deployed HTTPS callback URLs.
- Open password-reset and administrator-invitation email links from a second browser/device.
- Confirm HTTPS cookie behavior with `AUTH_COOKIE_SECURE=true` and `AUTH_COOKIE_SAME_SITE=none` when the frontend and API use separate origins.
- Run the suite against a staging database, then perform the documented authorization and abuse test pass.
