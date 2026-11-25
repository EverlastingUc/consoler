export interface ConsolerProgram {
  readonly type: "Program";
  readonly sourceLanguage: "consoler-js";
  readonly statements: readonly {
    readonly type: "OutputStatement";
    readonly value: string;
    readonly line: number;
    readonly column: number;
  }[];
}
export declare class ConsolerTranslationError extends Error {
  readonly code: string;
  constructor(code: string, message: string);
}
export declare function emitElecta(program: ConsolerProgram): string;
