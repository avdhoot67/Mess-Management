# Administrator Invitations

## Current scope

MessMate currently operates one mess. One bootstrap administrator must already exist, and authenticated administrators can invite additional administrators from **Admin → Team & access**.

This is not public admin registration. The public registration endpoint continues to create students only.

## Invitation flow

1. An authenticated administrator enters a new email address.
2. The backend rejects the request if any MessMate account already uses that email.
3. A cryptographically random token is generated; only its SHA-256 hash is stored.
4. Brevo sends a single-use acceptance link to the invited email.
5. The link remains valid for 48 hours unless an administrator revokes it.
6. The recipient provides their name, phone number, and password.
7. Acceptance and administrator creation occur in one database transaction.
8. The used invitation cannot be replayed.

Reinviting the same unregistered email replaces its previous invitation token, so only the newest link remains usable.

## Security properties

- Only authenticated users with the existing `admin` role can list, send, or revoke invitations.
- Public registration cannot choose a role.
- Existing student accounts are not silently promoted because the current single-mess schema stores one global role per user.
- Tokens contain 32 random bytes and are stored only as SHA-256 hashes.
- Validation and acceptance endpoints are rate-limited.
- Account creation and token consumption use a transaction and row lock.
- A failed email delivery revokes the newly created invitation.
- Invitation links use `FRONTEND_URL`; this must be the deployed public HTTPS frontend URL before mobile or production use.

## API surface

- `GET /api/admin-invitations` — current administrators and pending invitations; admin only.
- `POST /api/admin-invitations` — send or replace an invitation; admin only.
- `DELETE /api/admin-invitations/:id` — revoke an active invitation; admin only.
- `POST /api/admin-invitations/validate` — validate a public invitation token.
- `POST /api/admin-invitations/accept` — create the invited administrator account.

## Deliberate limitations

- The bootstrap administrator is still provisioned operationally because unrestricted first-admin signup would allow account takeover of the single mess.
- Existing users cannot be converted between student and administrator roles through this flow.
- Administrator removal, ownership transfer, fine-grained permissions, and audit history are future work.
- Multi-mess roles will later move from `users.role` into mess memberships.

