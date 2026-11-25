import test from "node:test";
import assert from "node:assert/strict";
import { createConsoler } from "../src/index.js";

test("reports a versioned, minimal signal", () => {
  const received = [];
  const client = createConsoler({ onSignal: signal => received.push(signal) });

  client.reportSignal("client-runtime-error", "widget.failed", "page-42");

  assert.equal(received.length, 1);
  assert.equal(received[0].version, 1);
  assert.equal(received[0].kind, "client-runtime-error");
  assert.equal(received[0].detailCode, "widget.failed");
  assert.equal(received[0].pageId, "page-42");
  assert.equal(typeof received[0].occurredAt, "number");
  assert.deepEqual(Object.keys(received[0]).sort(), [
    "detailCode", "kind", "occurredAt", "pageId", "version"
  ]);
  assert.equal(Object.isFrozen(received[0]), true);
});

test("allows a missing callback and performs no implicit work", () => {
  const client = createConsoler();
  assert.doesNotThrow(() => {
    client.reportSignal("client-runtime-error", "runtime.failed");
  });
});

test("rejects invalid options", () => {
  assert.throws(() => createConsoler(null), TypeError);
  assert.throws(() => createConsoler({ onSignal: true }), TypeError);
});

test("rejects unsupported signal kinds", () => {
  const client = createConsoler({ onSignal() {} });
  assert.throws(
    () => client.reportSignal("devtools-opened", "debugger.detected"),
    /Unsupported Consoler signal kind/
  );
});

test("rejects invalid detail codes", () => {
  const client = createConsoler({ onSignal() {} });
  for (const value of ["", "contains spaces", "secret/token", "x".repeat(65), 42]) {
    assert.throws(
      () => client.reportSignal("client-runtime-error", value),
      /detailCode/
    );
  }
});

test("rejects invalid page identifiers", () => {
  const client = createConsoler({ onSignal() {} });
  assert.throws(
    () => client.reportSignal("client-runtime-error", "runtime.failed", "bad id"),
    /pageId/
  );
  assert.throws(
    () => client.reportSignal("client-runtime-error", "runtime.failed", "x".repeat(129)),
    /pageId/
  );
});

test("contains callback exceptions", () => {
  const client = createConsoler({
    onSignal() {
      throw new Error("consumer failure");
    }
  });

  assert.doesNotThrow(() => {
    client.reportSignal("client-runtime-error", "consumer.failed");
  });
});

test("dispose is idempotent and prevents later callbacks", () => {
  let calls = 0;
  const client = createConsoler({ onSignal: () => calls++ });

  client.dispose();
  client.dispose();
  client.reportSignal("client-runtime-error", "after.dispose");

  assert.equal(calls, 0);
});

test("client methods cannot be replaced", () => {
  const client = createConsoler();
  assert.equal(Object.isFrozen(client), true);
});
