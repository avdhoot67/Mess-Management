# Authentication Sessions

MessMate keeps access tokens out of browser storage.

1. Password and Google sign-in return a short-lived access JWT (15 minutes by default) in the response body.
2. The React app holds that JWT only in memory and sends it as a bearer token for protected API calls.
3. The backend also sets a `messmate_refresh` cookie. It is `HttpOnly`, uses the `/api/auth` path, and contains an opaque random token; only its SHA-256 hash is stored in MySQL.
4. On a page reload or an expired access token, `POST /api/auth/refresh` rotates the cookie and returns a new access JWT.
5. Logout revokes the current refresh token and clears the cookie. Password reset increments `users.session_version`, invalidating every older access and refresh token for that account.

## Environment settings

Development defaults use `AUTH_COOKIE_SECURE=false` and `AUTH_COOKIE_SAME_SITE=lax`.

The free-tier deployment keeps browser API requests on the Vercel frontend origin and uses a Vercel rewrite to proxy `/api/*` to Render. This avoids depending on third-party cookies even though the API process runs on another provider.

Set:

```env
NODE_ENV=production
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=lax
FRONTEND_URL=https://app.example.com
CORS_ALLOWED_ORIGINS=https://app.example.com
```

The Google OAuth callback must also use the Vercel `/api/auth/google/callback` URL so its state cookie is created and returned through the same public origin. The Render service remains the upstream application server, but browsers use the Vercel URL.

HTTPS is mandatory for production secure cookies. Do not expose the refresh token to JavaScript or store access tokens in `localStorage` or `sessionStorage`.
