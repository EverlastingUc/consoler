const SIGNAL_KINDS = new Set(["client-integrity-check-failed", "client-runtime-error"]);
const DETAIL_CODE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
const PAGE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const ALLOWED_KEYS = new Set(["version", "kind", "occurredAt", "pageId", "detailCode"]);

/** Validate an untrusted client signal and return a fresh allowlisted copy. */
export function validateConsolerSignal(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, reason: "invalid-object" };
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    return { ok: false, reason: "invalid-object-prototype" };
  }
  if (Object.keys(input).some(key => !ALLOWED_KEYS.has(key))) {
    return { ok: false, reason: "unknown-field" };
  }
  if (input.version !== 1) return { ok: false, reason: "unsupported-version" };
  if (typeof input.kind !== "string" || !SIGNAL_KINDS.has(input.kind)) {
    return { ok: false, reason: "invalid-kind" };
  }
  if (typeof input.occurredAt !== "number" || !Number.isSafeInteger(input.occurredAt) || input.occurredAt < 0) {
    return { ok: false, reason: "invalid-timestamp" };
  }
  if (typeof input.detailCode !== "string" || !DETAIL_CODE_PATTERN.test(input.detailCode)) {
    return { ok: false, reason: "invalid-detail-code" };
  }
  if (input.pageId !== undefined && (typeof input.pageId !== "string" || !PAGE_ID_PATTERN.test(input.pageId))) {
    return { ok: false, reason: "invalid-page-id" };
  }
  return {
    ok: true,
    value: Object.freeze({
      version: 1,
      kind: input.kind,
      occurredAt: input.occurredAt,
      ...(input.pageId === undefined ? {} : { pageId: input.pageId }),
      detailCode: input.detailCode
    })
  };
}
