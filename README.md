# MessMate

MessMate is a web-based operations platform for a mess and its customers. It brings subscriptions, daily meals, individual bookings, day skips, payments, receipts, feedback, and administrative workflows into one system.

The current application is intentionally scoped to a single mess. A future multi-tenant direction is documented separately in [the roadmap](docs/FUTURE_MULTI_MESS_SAAS_ROADMAP.md).

## Key features

### Student portal

- View the active subscription, remaining duration, and skipped days.
- Browse today's and upcoming meals, with past meals available as history.
- Book individual meals and cancel eligible future bookings.
- Submit payment references and download payment receipts.
- Skip eligible subscription days and track the resulting extension.
- Submit meal feedback.
- Sign in with a password or Google and recover an account by email.

### Admin portal

- Monitor daily demand and operational activity from the dashboard.
- Manage meals and subscription plans.
- Review subscriptions, bookings, students, and payments.
- Verify submitted payment references.
- Review ratings and generate feedback summaries from eligible written responses.
- Invite additional administrators using expiring, single-use invitations.

## Technology

- **Frontend:** React, Vite, Tailwind CSS, Motion, shadcn/ui primitives
- **Backend:** Node.js, Express
- **Database:** MySQL with `mysql2`
- **Authentication:** short-lived JWT access tokens, rotating HTTP-only refresh cookies, Google OAuth
- **Email:** Brevo-compatible transactional email configuration
- **AI insights:** Gemini-based summaries combined with SQL-derived rating statistics

## Repository structure

```text
MessManagement/
|-- backend/       Express API, business logic, and integration tests
|-- database/      Base schema, seed data, and incremental migrations
|-- docs/          Architecture and feature documentation
|-- frontend/      React application for student and admin portals
|-- postman/       API collection
|-- DESIGN.md      Interface principles and design system
|-- PRODUCT.md     Product scope and business rules
`-- README.md
```

## Local setup

### Prerequisites

- Node.js and npm
- MySQL 8 or a compatible database

### Database

Create a database and apply `database/schema.sql`. Use `database/seed.sql` only when sample records are wanted. If working from an older database, apply the numbered SQL migrations in order.

### Backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

Update `backend/.env` with local database credentials, a strong JWT secret, and optional Google, Gemini, and email-provider credentials. Never commit this file.

The API defaults to `http://localhost:5000/api`. Verify it at `http://localhost:5000/api/health`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:5173` and uses `http://localhost:5000/api`. To use another API, set `VITE_API_URL` in a local frontend environment file.

## Verification

With the backend and a test database running:

```powershell
cd backend
npm run test:integration
```

The smoke suite exercises authentication, authorization, subscription activation, payment approval, day skips, bookings, cancellations, receipts, feedback constraints, refresh-token rotation, and logout cleanup. See [integration testing](docs/INTEGRATION_TESTING.md) for details.

Frontend checks:

```powershell
cd frontend
npm run lint
npm run build
```

## Supporting documentation

- [Product rules](PRODUCT.md)
- [Design system](DESIGN.md)
- [Authentication sessions](docs/AUTH_SESSIONS.md)
- [Google authentication](docs/GOOGLE_AUTHENTICATION.md)
- [Password reset](docs/PASSWORD_RESET.md)
- [Administrator invitations](docs/ADMIN_INVITATIONS.md)
- [Future multi-mess roadmap](docs/FUTURE_MULTI_MESS_SAAS_ROADMAP.md)

## Deployment direction

The planned free-tier deployment uses Vercel for the frontend, Render for the Express API, and a MySQL-compatible managed database. Production configuration must use HTTPS, provider-managed secrets, restricted CORS origins, secure cookies, database TLS, and deployed Google OAuth callback URLs.

