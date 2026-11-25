import { readFile } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_CONFIG_FILE = ".consoler.console";
const ALLOWED_TARGETS = new Set(["electa"]);

export class ConsolerConfigError extends Error {
  constructor(code, message, filePath = DEFAULT_CONFIG_FILE, options = {}) {
    super(message, options);
    this.name = "ConsolerConfigError";
    this.code = code;
    this.filePath = filePath;
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertExactKeys(value, expected, label, filePath) {
  for (const key of Object.keys(value)) {
    if (!expected.includes(key)) {
      throw new ConsolerConfigError(
        "CFG_UNKNOWN_KEY",
        `Unknown ${label} key "${key}".`,
        filePath
      );
    }
  }
  for (const key of expected) {
    if (!Object.hasOwn(value, key)) {
      throw new ConsolerConfigError(
        "CFG_MISSING_KEY",
        `Missing required ${label} key "${key}".`,
        filePath
      );
    }
  }
}

/** Parse and strictly validate a Consoler v1 JSON configuration. */
export function parseConfig(source, { filePath = DEFAULT_CONFIG_FILE } = {}) {
  if (typeof source !== "string") {
    throw new TypeError("Configuration source must be a string.");
  }
  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new TypeError("filePath must be a non-empty string.");
  }

  let config;
  try {
    config = JSON.parse(source);
  } catch (error) {
    throw new ConsolerConfigError(
      "CFG_INVALID_JSON",
      `Invalid JSON: ${error.message}`,
      filePath,
      { cause: error }
    );
  }

  if (!isRecord(config)) {
    throw new ConsolerConfigError(
      "CFG_INVALID_ROOT",
      "Configuration root must be a JSON object.",
      filePath
    );
  }
  assertExactKeys(config, ["version", "translation"], "configuration", filePath);

  if (config.version !== 1) {
    throw new ConsolerConfigError(
      "CFG_UNSUPPORTED_VERSION",
      'Configuration "version" must be 1.',
      filePath
    );
  }
  if (!isRecord(config.translation)) {
    throw new ConsolerConfigError(
      "CFG_INVALID_TRANSLATION",
      '"translation" must be a JSON object.',
      filePath
    );
  }
  assertExactKeys(
    config.translation,
    ["source", "target"],
    '"translation"',
    filePath
  );

  if (config.translation.source !== "consoler-js") {
    throw new ConsolerConfigError(
      "CFG_UNSUPPORTED_SOURCE",
      'Only the "consoler-js" source language is currently supported.',
      filePath
    );
  }
  if (typeof config.translation.target !== "string" ||
      !ALLOWED_TARGETS.has(config.translation.target)) {
    throw new ConsolerConfigError(
      "CFG_UNSUPPORTED_TARGET",
      'The only implemented translation target is "electa".',
      filePath
    );
  }

  return Object.freeze({
    version: 1,
    translation: Object.freeze({
      source: "consoler-js",
      target: "electa"
    })
  });
}

/** Load a configuration file explicitly from cwd or an explicit path. */
export async function loadConfig({
  cwd = process.cwd(),
  configPath = DEFAULT_CONFIG_FILE
} = {}) {
  if (typeof cwd !== "string" || cwd.length === 0) {
    throw new TypeError("cwd must be a non-empty string.");
  }
  if (typeof configPath !== "string" || configPath.length === 0) {
    throw new TypeError("configPath must be a non-empty string.");
  }

  const absolutePath = path.resolve(cwd, configPath);
  let source;
  try {
    source = await readFile(absolutePath, "utf8");
  } catch (error) {
    const code = error.code === "ENOENT" ? "CFG_NOT_FOUND" : "CFG_READ_FAILED";
    throw new ConsolerConfigError(
      code,
      error.code === "ENOENT"
        ? "Configuration file was not found."
        : `Could not read configuration file: ${error.message}`,
      absolutePath,
      { cause: error }
    );
  }

  return parseConfig(source, { filePath: absolutePath });
}
