import test from "node:test";
import assert from "node:assert/strict";
import { validateConsolerSignal } from "../src/server/index.js";
const valid = { version: 1, kind: "client-runtime-error", occurredAt: 123, detailCode: "widget.failed" };

test("accepts a valid signal as a frozen allowlisted copy", () => {
  const result = validateConsolerSignal(valid);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, valid);
  assert.equal(Object.isFrozen(result.value), true);
  assert.notEqual(result.value, valid);
});
test("rejects null, arrays, and non-plain objects", () => {
  assert.equal(validateConsolerSignal(null).ok, false);
  assert.equal(validateConsolerSignal([]).ok, false);
  assert.equal(validateConsolerSignal(new Date()).ok, false);
});
test("rejects invalid version, kind, timestamp, and detail code", () => {
  for (const patch of [{version:2},{kind:"devtools-opened"},{occurredAt:-1},{occurredAt:Infinity},{detailCode:"private text"}]) {
    assert.equal(validateConsolerSignal({...valid,...patch}).ok, false);
  }
});
test("rejects unexpected fields", () => {
  assert.deepEqual(validateConsolerSignal({...valid,token:"secret"}), {ok:false,reason:"unknown-field"});
});
test("does not treat a client timestamp as proof of freshness", () => {
  const result = validateConsolerSignal({...valid,occurredAt:9_999_999_999_999});
  assert.equal(result.ok, true);
  assert.equal(result.value.occurredAt, 9_999_999_999_999);
});
