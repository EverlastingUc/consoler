import type { ConsolerServerSignal } from "./index.js";
import type { SignalRateLimiter } from "./rate-limit.js";

export interface SignalReceiverContext {
  readonly principal: string;
}
export interface SignalReceiverOptions {
  /** Must authenticate using server-controlled credentials/session state. */
  authenticate: (request: Request) => string | null | Promise<string | null>;
  /** The principal passed to consume() must be the authenticated server identity. */
  rateLimiter: Pick<SignalRateLimiter, "consume">;
  /** Persist or process the validated signal without granting privileges. */
  onSignal: (
    signal: Readonly<ConsolerServerSignal>,
    context: SignalReceiverContext
  ) => void | Promise<void>;
  /** Maximum request body size in bytes. Defaults to 4096. */
  maxBodyBytes?: number;
}

/** Create a Fetch API POST handler; authentication and CSRF/origin policy remain application-owned. */
export declare function createSignalReceiver(
  options: SignalReceiverOptions
): (request: Request) => Promise<Response>;
