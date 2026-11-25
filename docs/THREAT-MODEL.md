# Consoler Threat Model

**Status:** Initial design baseline; implementation review is pending.

## 1. Security objective

Help developers reduce avoidable application-security mistakes and optionally collect narrowly scoped integrity signals. Consoler is not an anti-hacking product and cannot establish trust in a browser controlled by an end user.

The translator is a separate developer tool. Its output must not be treated as a security control.

## 2. Assets to protect

- Server-side user data and application resources.
- Authentication and authorization decisions.
- Sensitive business operations.
- Server-side secrets, signing keys, and privileged credentials.
- Availability and integrity of the host application.
- User privacy and accessibility.

## 3. Trust boundaries

| Component | Trust level | Rule |
|---|---|---|
| Browser runtime | Untrusted | Users can inspect, alter, replay, or bypass it. |
| DOM, storage, and client state | Untrusted | Never use as proof of identity or authorization. |
| Client integrity signal | Untrusted input | Treat as a hint requiring server-side policy and validation. |
| Network request | Untrusted | Authenticate, validate, authorize, and rate-limit server-side. |
| Server-side authorization logic | Trusted only when correctly implemented | Enforce permissions for every sensitive operation. |
| Translator input and generated source | Untrusted | Parse without evaluation; review and build separately. |

## 4. Threats and mitigations

| Threat | Required mitigation | Residual risk |
|---|---|---|
| User modifies client JavaScript or state | Server-side authorization and validation | A modified client can still behave differently locally. |
| User bypasses client checks | Repeat all security-critical checks on the server | Client-only UX restrictions can be bypassed. |
| Forged or replayed integrity event | Treat as untrusted; validate schema, authenticate session, rate-limit, and use server-issued nonces where appropriate | A compromised client can still lie; signals are not proof. |
| Missing or blocked browser API | Feature-detect; fail safely; do not break core application use | Some optional signals will be unavailable. |
| Translator receives unsupported syntax | Reject with a diagnostic and source location | Users must rewrite unsupported constructs. |
| Malformed or hostile translator input | Bounded parsing, explicit grammar, no eval, tests for resource limits | Parser bugs may remain; do not feed generated code to production blindly. |
| Telemetry reveals personal data | Collect only documented fields, minimize retention, make collection opt-in | Even metadata can be identifying in some contexts. |

## 5. Out of scope

- Preventing a determined user from inspecting or modifying their own browser.
- Protecting secrets embedded in client-side bundles.
- Replacing server-side authentication, authorization, validation, or abuse prevention.
- Guaranteeing that a client integrity signal is genuine.
- Anti-debugging, anti-analysis, stealth, persistence, surveillance, or punitive browser behavior.
- Automatically compiling or executing arbitrary translated output.

## 6. Safe design requirements

1. Security-critical decisions are made on the server.
2. Client signals are optional, minimal, documented, and explicitly untrusted.
3. Missing APIs and runtime errors must not crash or lock the host application.
4. No collection of keystrokes, passwords, tokens, or arbitrary page content.
5. No hidden network transmission; any telemetry contract must be explicit.
6. Security features must be removable and must preserve accessibility.
7. Translation is deterministic source generation, not execution.
8. Unsupported syntax fails closed with actionable diagnostics.

## 7. Open design questions

- Which exact integrity events, if any, provide measurable defensive value without excessive privacy cost?
- What server event schema and replay controls should the reference implementation use?
- What exact JavaScript-like grammar is small enough to translate correctly in the first release?
- Which Electa constructs can represent the first supported translation subset without semantic ambiguity?
