import { validateConsolerSignal } from "./index.js";

const JSON_CONTENT_TYPE = /^application\/json(?:\s*;|\s*$)/i;

function response(status, body, extraHeaders = {}) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: {
      "cache-control": "no-store",
      ...(body === null ? {} : { "content-type": "application/json; charset=utf-8" }),
      ...extraHeaders
    }
  });
}

async function readBoundedBody(request, maxBodyBytes) {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    if (!/^\d+$/.test(declaredLength)) return { ok: false, status: 400 };
    if (Number(declaredLength) > maxBodyBytes) return { ok: false, status: 413 };
  }
  if (!request.body) return { ok: false, status: 400 };

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBodyBytes) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, status: 400 };
  }
}

/**
 * Create a framework-neutral Fetch API handler for an authenticated signal endpoint.
 * Authentication, CSRF/origin policy, persistence, and retention remain application-owned.
 */
export function createSignalReceiver({
  authenticate,
  rateLimiter,
  onSignal,
  maxBodyBytes = 4096
} = {}) {
  if (typeof authenticate !== "function") {
    throw new TypeError("authenticate must be a function.");
  }
  if (
    rateLimiter === null ||
    typeof rateLimiter !== "object" ||
    typeof rateLimiter.consume !== "function"
  ) {
    throw new TypeError("rateLimiter must provide consume(principal).");
  }
  if (typeof onSignal !== "function") {
    throw new TypeError("onSignal must be a function.");
  }
  if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes < 1 || maxBodyBytes > 1_048_576) {
    throw new TypeError("maxBodyBytes must be a safe integer between 1 and 1048576.");
  }

  return async function handleSignalRequest(request) {
    if (
      request === null ||
      typeof request !== "object" ||
      typeof request.method !== "string" ||
      !request.headers
    ) {
      return response(400, { error: "invalid-request" });
    }
    if (request.method !== "POST") {
      return response(405, { error: "method-not-allowed" }, { allow: "POST" });
    }
    if (!JSON_CONTENT_TYPE.test(request.headers.get("content-type") ?? "")) {
      return response(415, { error: "content-type-must-be-application-json" });
    }

    let principal;
    try {
      principal = await authenticate(request);
    } catch {
      return response(500, { error: "authentication-service-failed" });
    }
    if (
      typeof principal !== "string" ||
      principal.length === 0 ||
      principal.length > 256
    ) {
      return response(401, { error: "unauthorized" });
    }

    let limit;
    try {
      limit = rateLimiter.consume(principal);
    } catch {
      return response(503, { error: "rate-limiter-unavailable" });
    }
    if (!limit || limit.allowed !== true) {
      const retryAfter = Number.isFinite(limit?.resetAt)
        ? Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))
        : 60;
      return response(429, { error: "rate-limited" }, { "retry-after": String(retryAfter) });
    }

    const body = await readBoundedBody(request, maxBodyBytes);
    if (!body.ok) {
      return response(body.status, {
        error: body.status === 413 ? "payload-too-large" : "invalid-request-body"
      });
    }

    let payload;
    try {
      payload = JSON.parse(body.text);
    } catch {
      return response(400, { error: "invalid-json" });
    }
    const validation = validateConsolerSignal(payload);
    if (!validation.ok) {
      return response(400, { error: "invalid-signal", reason: validation.reason });
    }

    try {
      await onSignal(validation.value, Object.freeze({ principal }));
    } catch {
      return response(500, { error: "signal-handler-failed" });
    }
    return response(202, { accepted: true });
  };
}
