# Google Authentication

## Account model

- `users.google_sub` stores Google's immutable OpenID Connect subject identifier and is unique.
- Google-created users have `password = NULL` and may have `phone = NULL`.
- A phone number can be added later in Account settings. It is not described as verified until an SMS verification flow exists.
- A matching email does not automatically merge a Google identity into an existing password account. The user must sign in normally and explicitly link Google from Account settings.

## Sign-in flow

1. The frontend opens `GET /api/auth/google`.
2. The backend creates a signed, short-lived OAuth state value, stores the same value in an HttpOnly cookie, and redirects to Google. The cookie is `SameSite=Lax` locally and `SameSite=None; Secure` in production so separately hosted HTTPS frontend and API domains remain supported.
3. Google returns to `GET /api/auth/google/callback`.
4. The backend checks the state value and cookie, exchanges the authorization code, and verifies the ID token with `google-auth-library`.
5. The backend finds the user by `google_sub` or creates a new student account. An existing unlinked email is rejected with instructions to use explicit linking.
6. A cryptographically random five-minute exchange grant is created. Only its SHA-256 hash is stored in the database, and the browser returns to the frontend callback page with the opaque grant.
7. The frontend exchanges that grant once at `POST /api/auth/google/session`, then stores the same application JWT/user shape used by password login. The atomic database update rejects replay attempts.

This keeps application tokens out of callback URLs, browser history, and referrer headers. The temporary callback value is short-lived, single-use, and is not itself an application session.

## Explicit linking flow

1. An authenticated user chooses **Link Google account** in Account settings.
2. `POST /api/auth/google/link` creates a state value containing the authenticated user ID and returns the Google authorization URL.
3. The callback rejects a Google subject or email already attached to another MessMate user.
4. On success, only `google_sub` is linked; the existing account email and role are not silently changed.

## Required configuration

Backend environment variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` (local: `http://localhost:5000/api/auth/google/callback`)
- `FRONTEND_URL` (optional locally; defaults to `http://localhost:5173`)
- `JWT_SECRET`

Google Cloud must list the callback URL as an authorized redirect URI. Production must use the deployed HTTPS backend callback and frontend origin.
