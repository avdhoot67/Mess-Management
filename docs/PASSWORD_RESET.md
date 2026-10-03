# Password Reset

## User flow

1. A user opens **Forgot password?** from the login page and submits an email address.
2. The API always returns the same success message for a valid email format, whether or not the account exists.
3. Only accounts that already have a password receive a reset email. Google-only users are directed back to **Continue with Google**.
4. The email contains a single-use link to `/reset-password?token=...`.
5. A successful reset updates the password and invalidates every outstanding reset token for that user.

## Security model

- Reset tokens use 32 random bytes and are valid for 30 minutes.
- Only a SHA-256 hash of each token is stored in MySQL.
- Token validation and consumption run inside one database transaction with a row lock.
- Used, expired, malformed, and replayed tokens are rejected.
- Request and reset endpoints have separate IP-based rate limits.
- Reset-request responses do not reveal whether an email is registered or whether it is a Google-only account.
- Passwords continue to use bcrypt and are limited to bcrypt's safe input size.

## Email configuration

Local development can continue using SMTP:

```text
FRONTEND_URL=http://localhost:5173
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password_or_app_password
EMAIL_FROM="MessMate <noreply@example.com>"
```

Port `465` normally uses `SMTP_SECURE=true`. Providers using STARTTLS commonly use port `587` with `SMTP_SECURE=false`. Never commit real SMTP credentials; `backend/.env.example` contains safe placeholders.

Render free web services block outbound SMTP ports. The production deployment therefore uses Brevo's transactional HTTPS API:

```text
EMAIL_PROVIDER=brevo
BREVO_API_KEY=provider_managed_secret
EMAIL_FROM_NAME=MessMate
EMAIL_FROM_ADDRESS=verified-sender@example.com
```

The Brevo key belongs only in Render's environment settings. `EMAIL_FROM_ADDRESS` must be a sender verified in Brevo. The application sends the same text and HTML content through either transport, so password-reset and administrator-invitation behavior remains provider-independent.

Before testing reset links from another phone or computer, replace `FRONTEND_URL` with the deployed frontend's public HTTPS origin. A localhost URL always refers to the device opening the email, so it cannot reach the development server running on another machine.

If email delivery fails after a token is created, the backend invalidates that token and records the delivery failure in server logs without printing the raw reset token.
