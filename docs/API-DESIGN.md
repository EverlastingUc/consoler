# Defensive API Design

**Status:** The minimal client API and framework-neutral server validation/rate-limit reference utilities are implemented. Production shared-store integration and HTTP-framework examples remain future work.

## 1. Design constraints

- The browser is an untrusted environment.
- The library does not make authorization decisions.
- No network requests, telemetry, or event collection happen implicitly.
- No DevTools detection, keystroke capture, DOM scraping, or browser-control interference.
- The host application owns transport, consent, retention, and server-side verification.
- Missing browser APIs must not prevent the host application from working.

## 2. Proposed minimal API

The first release should expose a small, framework-independent API:

```ts
export type ConsolerSignalKind =
  | "client-integrity-check-failed"
  | "client-runtime-error";

export interface ConsolerSignal {
  version: 1;
  kind: ConsolerSignalKind;
  occurredAt: number;
  pageId?: string;
  detailCode: string;
}

export interface ConsolerOptions {
  onSignal?: (signal: ConsolerSignal) => void;
}

export interface ConsolerClient {
  reportSignal(
    kind: ConsolerSignalKind,
    detailCode: string,
    pageId?: string
  ): void;
  dispose(): void;
}

export function createConsoler(
  options?: ConsolerOptions
): ConsolerClient;
```

This API is intentionally explicit. It does not install global listeners, inspect the page, or send signals over the network. The application calls reportSignal only when it has a documented reason to report a narrowly scoped event.

## 3. Signal contract

- The signal schema is versioned.
- detailCode is a short application-defined code, not free-form page content.
- Do not include passwords, tokens, keystrokes, full URLs, DOM snapshots, request bodies, or user-entered text.
- occurredAt is client-provided and therefore untrusted.
- pageId must be a non-sensitive, application-generated correlation identifier.
- The callback may be absent; reporting must safely become a no-op.
- Callback exceptions must not break the host application.

## 4. Server responsibilities

The server must independently:
1. authenticate the request and bind it to the current session;
2. validate the schema and allowed detail codes;
3. enforce request size limits and rate limits;
4. apply replay controls if the application needs them;
5. treat the signal as telemetry, never as proof of client integrity;
6. make authorization decisions using server-owned state only.

A signal must never grant access, bypass validation, or trigger destructive/punitive action.

## 5. Development and production

- The library must not infer an environment from unreliable browser globals.
- Applications may choose whether to provide an onSignal callback.
- No signal should be transmitted unless the application explicitly implements transport.
- Production integrations should document consent, retention, and the purpose of each signal.
- Development diagnostics must not expose secrets.

## 6. Failure behavior

- Missing callback: no-op.
- Invalid options throw `TypeError` during construction. When a callback is configured, invalid signal kinds, detail codes, and page IDs throw `TypeError` before callback invocation. With no callback, reporting is a no-op.
- Callback throws: contain the exception so it does not crash the host application; optionally surface a development diagnostic without leaking signal data.
- dispose called repeatedly: safe and idempotent.

## 7. Server reference implementation

Optional server entry points are exported as `consoler/server` and `consoler/server/rate-limit`. They validate a strict allowlisted signal shape and provide a bounded single-process fixed-window limiter. The limiter requires a server-authenticated principal. It is not distributed and is not a replacement for a production shared-store or gateway limiter. Client timestamps are never proof of freshness; applications needing replay resistance must use server-issued, session-bound, one-time nonces.

## 8. Acceptance tests

The implementation must test:
- callback receives a correctly versioned signal;
- no callback means no network activity and no exception;
- invalid kinds and detail codes are rejected;
- callback exceptions do not escape into the host application;
- dispose is idempotent;
- no global event listeners or browser inspection APIs are installed;
- signal payload contains no automatically collected page or user data.

## 9. Review decision

This proposal intentionally avoids unreliable anti-DevTools or anti-tamper detection. Before implementation, finalize the invalid-input contract and decide whether a server-side reference receiver belongs in this repository or in examples only.
