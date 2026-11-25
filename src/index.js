const SIGNAL_KINDS = new Set([
  "client-integrity-check-failed",
  "client-runtime-error"
]);

const DETAIL_CODE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
const PAGE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

/**
 * Create an explicit, privacy-minimal Consoler client.
 *
 * No browser APIs, global listeners, network requests, or automatic
 * collection are used. The host application decides when to report.
 *
 * @param {{ onSignal?: (signal: Readonly<ConsolerSignal>) => void }} [options]
 * @returns {ConsolerClient}
 */
export function createConsoler(options = {}) {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Consoler options must be an object.");
  }

  if (options.onSignal !== undefined && typeof options.onSignal !== "function") {
    throw new TypeError("Consoler onSignal must be a function when provided.");
  }

  const onSignal = options.onSignal;
  let disposed = false;

  return Object.freeze({
    reportSignal(kind, detailCode, pageId) {
      if (disposed || onSignal === undefined) {
        return;
      }

      if (!SIGNAL_KINDS.has(kind)) {
        throw new TypeError("Unsupported Consoler signal kind.");
      }

      if (typeof detailCode !== "string" || !DETAIL_CODE_PATTERN.test(detailCode)) {
        throw new TypeError(
          "Consoler detailCode must be 1-64 characters: letters, digits, dot, underscore, or hyphen."
        );
      }

      if (
        pageId !== undefined &&
        (typeof pageId !== "string" || !PAGE_ID_PATTERN.test(pageId))
      ) {
        throw new TypeError(
          "Consoler pageId must be 1-128 characters: letters, digits, dot, underscore, colon, or hyphen."
        );
      }

      const signal = Object.freeze({
        version: 1,
        kind,
        occurredAt: Date.now(),
        ...(pageId === undefined ? {} : { pageId }),
        detailCode
      });

      // A consumer callback is outside Consoler's trust boundary. Its failure
      // must never break the host application.
      try {
        onSignal(signal);
      } catch {
        // Deliberately contained; Consoler has no implicit logging or telemetry.
      }
    },

    dispose() {
      disposed = true;
    }
  });
}

/**
 * @typedef {"client-integrity-check-failed" | "client-runtime-error"} ConsolerSignalKind
 * @typedef {{
 *   version: 1;
 *   kind: ConsolerSignalKind;
 *   occurredAt: number;
 *   pageId?: string;
 *   detailCode: string;
 * }} ConsolerSignal
 * @typedef {{
 *   reportSignal(kind: ConsolerSignalKind, detailCode: string, pageId?: string): void;
 *   dispose(): void;
 * }} ConsolerClient
 */
