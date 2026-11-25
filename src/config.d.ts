export declare const DEFAULT_CONFIG_FILE: ".consoler.console";

export declare class ConsolerConfigError extends Error {
  readonly code: string;
  readonly filePath: string;
  constructor(code: string, message: string, filePath?: string, options?: ErrorOptions);
}

export interface ConsolerConfig {
  readonly version: 1;
  readonly translation: Readonly<{
    source: "consoler-js";
    target: "electa";
  }>;
}

export declare function parseConfig(
  source: string,
  options?: { filePath?: string }
): ConsolerConfig;

export declare function loadConfig(options?: {
  cwd?: string;
  configPath?: string;
}): Promise<ConsolerConfig>;
