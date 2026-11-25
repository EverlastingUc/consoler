import test from "node:test";
import assert from "node:assert/strict";
import { createSignalReceiver } from "../src/server/receiver.js";

const signal = {
  version: 1,
  kind: "client-runtime-error",
  occurredAt: 123,
  detailCode: "widget.failed"
};

function makeRequest(body = signal, options = {}) {
  const method = options.method ?? "POST";
  return new Request("https://example.test/signals", {
    method,
    headers: options.headers ?? { "content-type": "application/json" },
    body: method === "GET" || method === "HEAD"
      ? undefined
      : (options.rawBody ?? JSON.stringify(body))
  });
}

function receiver(overrides = {}) {
  const received = [];
  const handler = createSignalReceiver({
    authenticate: async () => "user-123",
    rateLimiter: { consume: () => ({ allowed: true, remaining: 4, resetAt: Date.now() + 60_000 }) },
    onSignal: async (value, context) => received.push({ value, context }),
    ...overrides
  });
  return { handler, received };
}

test("receiver authenticates, validates, rate-limits and accepts a signal", async () => {
  const { handler, received } = receiver();
  const response = await handler(makeRequest());
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { accepted: true });
  assert.equal(received.length, 1);
  assert.deepEqual(received[0].value, signal);
  assert.equal(received[0].context.principal, "user-123");
});

test("receiver rejects unauthenticated requests before reading the payload", async () => {
  const { handler, received } = receiver({ authenticate: async () => null });
  const response = await handler(makeRequest());
  assert.equal(response.status, 401);
  assert.equal(received.length, 0);
});

test("receiver rejects methods and non-JSON content types", async () => {
  const { handler } = receiver();
  assert.equal((await handler(makeRequest(signal, { method: "GET" }))).status, 405);
  assert.equal((await handler(makeRequest(signal, {
    headers: { "content-type": "text/plain" }
  }))).status, 415);
});

test("receiver rejects oversized bodies and malformed JSON", async () => {
  const { handler } = receiver({ maxBodyBytes: 32 });
  const oversized = await handler(makeRequest(signal));
  assert.equal(oversized.status, 413);

  const normal = receiver();
  const malformed = await normal.handler(makeRequest(null, { rawBody: "{" }));
  assert.equal(malformed.status, 400);
});

test("receiver rejects invalid signal schemas", async () => {
  const { handler, received } = receiver();
  const response = await handler(makeRequest({ ...signal, token: "not-allowed" }));
  assert.equal(response.status, 400);
  assert.equal(received.length, 0);
});

test("receiver applies authenticated-principal rate limits", async () => {
  const { handler } = receiver({
    rateLimiter: { consume: () => ({ allowed: false, remaining: 0, resetAt: Date.now() + 5000 }) }
  });
  const response = await handler(makeRequest());
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("retry-after")) >= 1);
});

test("receiver fails closed when authentication or signal handling throws", async () => {
  const authFailure = receiver({ authenticate: async () => { throw new Error("secret"); } });
  assert.equal((await authFailure.handler(makeRequest())).status, 500);

  const handlerFailure = receiver({ onSignal: async () => { throw new Error("secret"); } });
  const response = await handlerFailure.handler(makeRequest());
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /secret/);
});

test("receiver validates configuration at construction", () => {
  assert.throws(() => createSignalReceiver(), TypeError);
  assert.throws(() => createSignalReceiver({
    authenticate: () => "user",
    rateLimiter: { consume() {} },
    onSignal() {},
    maxBodyBytes: 0
  }), TypeError);
});
