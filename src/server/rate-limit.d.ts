export interface SignalRateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: number;
}
export interface SignalRateLimiter {
  consume(authenticatedPrincipal: string): SignalRateLimitResult;
  clear(): void;
}
export declare function createSignalRateLimiter(options?: {
  limit?: number;
  windowMs?: number;
  maxPrincipals?: number;
  now?: () => number;
}): SignalRateLimiter;
