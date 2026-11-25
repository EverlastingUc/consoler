import test from "node:test";
import assert from "node:assert/strict";
import { createSignalRateLimiter } from "../src/server/rate-limit.js";

test("enforces a fixed window per principal", () => {
  let time = 1000;
  const limiter = createSignalRateLimiter({limit:2,windowMs:500,now:()=>time});
  assert.deepEqual(limiter.consume("session-a"),{allowed:true,remaining:1,resetAt:1500});
  assert.deepEqual(limiter.consume("session-a"),{allowed:true,remaining:0,resetAt:1500});
  assert.deepEqual(limiter.consume("session-a"),{allowed:false,remaining:0,resetAt:1500});
  time=1500;
  assert.deepEqual(limiter.consume("session-a"),{allowed:true,remaining:1,resetAt:2000});
});
test("isolates authenticated principals", () => {
  const limiter=createSignalRateLimiter({limit:1});
  assert.equal(limiter.consume("a").allowed,true);
  assert.equal(limiter.consume("b").allowed,true);
});
test("bounds memory and rejects new principals when full", () => {
  const limiter=createSignalRateLimiter({limit:1,maxPrincipals:1});
  limiter.consume("a");
  assert.equal(limiter.consume("b").allowed,false);
});
test("validates configuration and principal identifiers", () => {
  assert.throws(()=>createSignalRateLimiter({limit:0}),TypeError);
  const limiter=createSignalRateLimiter();
  assert.throws(()=>limiter.consume(""),TypeError);
  assert.throws(()=>limiter.consume(42),TypeError);
});
test("clear resets stored buckets", () => {
  const limiter=createSignalRateLimiter({limit:1});
  limiter.consume("a"); limiter.clear();
  assert.equal(limiter.consume("a").allowed,true);
});
