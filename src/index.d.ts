export type ConsolerSignalKind =
  | "client-integrity-check-failed"
  | "client-runtime-error";

export interface ConsolerSignal {
  readonly version: 1;
  readonly kind: ConsolerSignalKind;
  readonly occurredAt: number;
  readonly pageId?: string;
  readonly detailCode: string;
}

export interface ConsolerOptions {
  onSignal?: (signal: Readonly<ConsolerSignal>) => void;
}

export interface ConsolerClient {
  reportSignal(
    kind: ConsolerSignalKind,
    detailCode: string,
    pageId?: string
  ): void;
  dispose(): void;
}

export declare function createConsoler(
  options?: ConsolerOptions
): ConsolerClient;
