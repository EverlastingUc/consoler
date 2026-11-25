export interface ConsolerServerSignal {
  readonly version: 1;
  readonly kind: "client-integrity-check-failed" | "client-runtime-error";
  readonly occurredAt: number;
  readonly pageId?: string;
  readonly detailCode: string;
}
export type ConsolerSignalValidation =
  | { readonly ok: true; readonly value: Readonly<ConsolerServerSignal> }
  | { readonly ok: false; readonly reason: string };
export declare function validateConsolerSignal(input: unknown): ConsolerSignalValidation;
