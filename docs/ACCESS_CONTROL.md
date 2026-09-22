# Transmagia — Access Control Architecture

## 1. Two Separate Access Mechanisms

Transmagia uses two distinct mechanisms:

1. **Supabase Auth** for registered users and admins.
2. **Temporary section access** for anonymous visitors who successfully enter a protected section password.

Do not model anonymous section access as a user role.

## 2. Access Matrix

| Action | Visitor | Guest with valid section access | Registered reader | Admin |
|---|---:|---:|---:|---:|
| Read public section | yes | yes | yes | yes |
| Read protected book/chapter | no | yes | yes | yes |
| Comment | no | no | yes | yes |
| Open admin | no | no | no | yes |
| Create/edit books | no | no | no | yes |
| Create/edit/publish chapters | no | no | no | yes |
| Moderate comments | no | no | no | yes |
| Register readers | no | no | no | yes |
| Promote/demote admins | no | no | no | yes |
| Change section password | no | no | no | yes |

## 3. Reading Rules

For a public section:

```text
allow all visitors
```

For a protected section:

```text
admin                 -> allow
registered reader     -> allow
guest + valid access  -> allow
other anonymous       -> deny / request password
```

Book metadata can be public even when the book/chapter content is protected.

## 4. Section Password Flow

1. User requests a protected book/chapter.
2. Trusted Next.js server resolves the section.
3. Check whether a valid authenticated user session exists.
4. If admin or registered reader, allow access.
5. Otherwise check the signed HTTP-only section-access cookie.
6. If the cookie is valid for that section and not expired, allow access.
7. Otherwise show a password gate.
8. User submits the password to a server-side handler.
9. Server verifies it against `sections.password_hash`.
10. On success, server issues a short-lived signed HTTP-only cookie bound to that section.

Recommended cookie properties:

```text
HttpOnly
Secure
SameSite=Lax
Max-Age / Expires
```

The initial TTL can be a configurable value such as 7 days; it should not be hard-coded as a product requirement.

## 5. Password Security

Never store plaintext section passwords.

Never put passwords in:

- client-side JavaScript;
- localStorage;
- URLs/query strings;
- HTML attributes;
- logs.

Only a secure password hash is stored in the database.

## 6. Authenticated Users

Use Supabase Auth for email/password login.

Application role resolution should come from trusted database data, not from client state.

The frontend may hide admin navigation, but every admin operation must repeat authorization on the server.

## 7. Admin Authorization

Every privileged operation should conceptually follow:

```text
request
→ validate session
→ load trusted profile
→ require profile.is_admin = true
→ perform operation
```

This applies to:

- book creation/editing/deletion;
- chapter creation/editing/publishing/reordering;
- section password changes;
- comment moderation;
- user administration;
- admin promotion/demotion.

## 8. User Administration

Newly registered/created readers default to:

```text
is_admin = false
```

Only an existing admin can promote another registered account to admin.

Provide explicit operations for:

- create/register reader;
- promote to admin;
- demote from admin.

Do not combine registration with automatic admin assignment.

## 9. Supabase RLS Strategy

Use RLS as a database-level defense for authenticated/public data where practical.

Keep protected anonymous content access behind trusted Next.js server code because anonymous guests do not have a Supabase `auth.uid()`.

Do not attempt to fake an authenticated identity from the anonymous section cookie.

Do not expose the Supabase service-role key to the client.

## 10. Protected Content Boundary

The critical security rule is:

> Protected chapter content must not be fetched into the browser before access is verified.

The client should receive either:

- the authorized content; or
- a password gate / access-denied response.

There must be no client-side pattern of fetching the entire chapter and hiding it with React.

## 11. Comments Authorization

Creating comments requires an authenticated registered user.

Server-side checks must verify:

```text
authenticated
AND
valid profile
AND
registered user
```

Admins satisfy the same commenting requirement.

## 12. Middleware vs Server Functions

Use Next.js middleware only for lightweight routing/session concerns where appropriate.

Do not treat middleware as the only authorization layer.

Sensitive authorization must be repeated in server-side actions/route handlers/data-access functions.
