# Deployment

## Architecture

MessMate uses four managed services while retaining one application repository:

- Vercel builds and serves the React/Vite frontend.
- Vercel proxies browser requests under `/api/*` to the Render service.
- Render runs the Express API.
- TiDB Cloud Starter provides a MySQL-compatible database over TLS.
- Brevo's HTTPS API sends password-reset and administrator-invitation email.

The API proxy is an authentication boundary, not only a convenience. Browser requests, refresh cookies, and the Google callback use the Vercel origin, avoiding reliance on third-party cookies across unrelated provider domains.

## Release workflow

Deployment work is prepared on `deployment/production`. After hosted verification, merge that branch into `main`; both Vercel and Render should deploy `main`. Tag the verified release as `v1.0.0` before creating the separate cloud-virtualization coursework branch.

## 1. Prepare TiDB Cloud

1. Create a TiDB Cloud Starter instance in a region close to the Render region.
2. Keep paid usage disabled unless a budget is intentionally configured.
3. Create a strong database password and keep all connection values outside Git.
4. Connect with a MySQL-compatible client and apply `database/schema.sql`.
5. Do not apply `database/seed.sql` to production; it contains development accounts and time-specific sample records.

The Render database variables are:

```text
DB_HOST=<TiDB host>
DB_PORT=4000
DB_USER=<TiDB user>
DB_PASSWORD=<provider secret>
DB_NAME=mess_management
DB_SSL=true
```

`DB_SSL=true` enables certificate validation and requires TLS 1.2 or newer. The Starter public endpoint is signed by a CA already trusted by Node.js, so disabling certificate verification is unnecessary and prohibited by this configuration.

## 2. Create the Vercel project shell

Import the GitHub repository into Vercel and set:

```text
Root directory: frontend
Framework: Vite
Install command: npm ci
Build command: npm run build
Output directory: dist
Production branch: main
```

The initial `frontend/vercel.json` supplies the SPA fallback. Deploy it once to reserve the stable `vercel.app` hostname. API calls are not enabled until the Render URL is known.

## 3. Create the Render API

Use the repository `render.yaml` Blueprint or create a web service with:

```text
Root directory: backend
Runtime: Node
Build command: npm ci --omit=dev
Start command: npm start
Health check path: /api/health
Plan: Free
```

Enter secrets only in the Render dashboard. Do not paste them into `render.yaml`, GitHub, screenshots, issues, or documentation.

Required production values include:

```text
NODE_ENV=production
TRUST_PROXY=true
FRONTEND_URL=https://<vercel-host>
CORS_ALLOWED_ORIGINS=https://<vercel-host>
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=lax
EMAIL_PROVIDER=brevo
BREVO_API_KEY=<secret>
EMAIL_FROM_NAME=MessMate
EMAIL_FROM_ADDRESS=<verified sender>
GOOGLE_CLIENT_ID=<secret>
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_CALLBACK_URL=https://<vercel-host>/api/auth/google/callback
AI_PROVIDER=gemini
GEMINI_API_KEY=<secret>
GEMINI_MODEL=gemini-2.5-flash
```

Render generates `JWT_SECRET` when the Blueprint is used. If configuring manually, generate a cryptographically random value of at least 32 characters.

## 4. Enable the Vercel API proxy

After Render assigns `https://<render-host>.onrender.com`, place this rewrite before the SPA fallback in `frontend/vercel.json`:

```json
{
  "source": "/api/:path*",
  "destination": "https://<render-host>.onrender.com/api/:path*"
}
```

Set this Vercel production environment variable:

```text
VITE_API_URL=/api
```

The Express server adds `Cache-Control: no-store` to API responses so authentication and customer-specific responses are not cached by the proxy.

## 5. Configure Google OAuth

In Google Cloud Console, add:

```text
Authorized JavaScript origin:
https://<vercel-host>

Authorized redirect URI:
https://<vercel-host>/api/auth/google/callback
```

The Google callback must match `GOOGLE_CALLBACK_URL` exactly, including scheme and path.

## 6. Bootstrap the first administrator

Run the bootstrap script locally while the database variables point to TiDB. Do not put a plaintext password in SQL or a command-line argument.

In PowerShell, collect the password without displaying it or placing it directly in command history:

```powershell
$securePassword = Read-Host "Temporary admin password" -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$env:BOOTSTRAP_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
$env:BOOTSTRAP_ADMIN_NAME = "Mess Admin"
$env:BOOTSTRAP_ADMIN_EMAIL = "admin@example.com"
$env:BOOTSTRAP_ADMIN_PHONE = "9876543210"
npm run admin:bootstrap
Remove-Item Env:BOOTSTRAP_ADMIN_PASSWORD
Remove-Item Env:BOOTSTRAP_ADMIN_NAME
Remove-Item Env:BOOTSTRAP_ADMIN_EMAIL
Remove-Item Env:BOOTSTRAP_ADMIN_PHONE
```

Run these commands from `backend`. The password must contain at least 12 characters and no more than 72 UTF-8 bytes. The script is idempotent for an existing administrator email and refuses to promote an existing student.

## 7. Verification

Confirm `https://<vercel-host>/api/health` reports database connectivity, then test:

- password registration, login, refresh, reload, and logout;
- Google registration, login, explicit linking, and callback-state rejection;
- password-reset and administrator-invitation email from a second device;
- student/admin authorization boundaries;
- subscription payment approval and activation;
- day skips, bookings, cancellation restrictions, receipts, and feedback;
- Gemini insight minimum-data and quota behavior;
- direct refresh of nested frontend routes.

Run production dependency audits and the frontend build before merging:

```powershell
cd backend
npm audit --omit=dev --audit-level=moderate

cd ..\frontend
npm run lint
npm run build
npm audit --omit=dev --audit-level=moderate
```

Use a staging database for `npm run test:integration`; the suite creates and removes records but must never be aimed casually at real customer data.

## Rollback and secret rotation

- Vercel and Render retain deployment history for rollback to a prior build.
- Database schema changes require forward-safe migrations and a tested backup before destructive operations.
- If a secret is exposed, rotate it at the provider, update the deployment environment, revoke affected sessions when relevant, and redeploy. Removing a secret from the newest Git commit is not sufficient after publication.
- Never enable `rejectUnauthorized=false` to bypass a database certificate problem.
