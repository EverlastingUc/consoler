export interface OutputStatement {
  readonly type: "OutputStatement";
  readonly value: string;
  readonly line: number;
  readonly column: number;
}
export interface ConsolerProgram {
  readonly type: "Program";
  readonly sourceLanguage: "consoler-js";
  readonly statements: readonly OutputStatement[];
}
export declare class ConsolerSyntaxError extends SyntaxError {
  readonly code: string;
  readonly line: number;
  readonly column: number;
  constructor(code: string, message: string, line: number, column: number);
}
export declare function parseConsoler(source: string): ConsolerProgram;
