# Server-side reference integration

Consoler signals are untrusted telemetry. Authenticate requests independently. Never grant permissions, block accounts, or perform sensitive operations because a client signal says so.

## Validate the payload

The optional `consoler/server` entry point validates a strict version 1 allowlist and returns a fresh frozen copy. Unknown fields are rejected to prevent accidental inclusion of tokens or free-form content. The client timestamp is data only; it does not prove freshness.

```js
import { validateConsolerSignal } from "consoler/server";

const result = validateConsolerSignal(request.body);
if (!result.ok) {
  response.status(400).json({ error: "invalid_signal" });
  return;
}

// Set only by trusted server authentication middleware.
// Never read this identity from request.body or a client-supplied user ID.
const principal = request.auth.sessionId;
```

The framework, authentication middleware, and response object are illustrative. Configure a small body limit (for example, 2 KiB) before JSON parsing. Reject unauthenticated requests first. Apply CSRF protections when cookie authentication is used.

## Rate limit

```js
import { createSignalRateLimiter } from "consoler/server/rate-limit";

const limiter = createSignalRateLimiter({ limit: 30, windowMs: 60_000 });
const rate = limiter.consume(request.auth.sessionId);
if (!rate.allowed) {
  response.status(429).json({ error: "rate_limited" });
  return;
}
```

This bounded in-memory fixed-window limiter is a single-process example only. It does not coordinate across workers, restarts, or multiple servers. Production deployments should use an atomic shared limiter (such as a gateway or shared datastore) keyed by a server-authenticated principal, with expiry and capacity controls.

## Replay protection

The occurredAt value cannot prevent replay: a browser user can forge it and resend any request. If duplicate submission has meaningful impact, issue a cryptographically random, short-lived, one-time nonce from the server, bind it to the authenticated session, and atomically consume it on receipt. Keep nonce state server-side and expire it quickly. A client-generated nonce is not proof. For low-value telemetry, rate limiting and deduplication may be sufficient.

## Data handling

- Allowlist application-owned detailCode values on the server; syntax validation is not application policy.
- Treat pageId as potentially identifying metadata and omit it unless needed.
- Do not log raw request bodies, tokens, full URLs, DOM content, or user-entered text.
- Define retention and access controls for stored signals.
- Never use a signal as evidence of identity, client integrity, or authorization.
