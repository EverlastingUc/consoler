#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../src/config.js";
import { parseConsoler } from "../src/translator/parser.js";
import { emitElecta } from "../src/translator/electa.js";

function usage() {
  return [
    "Consoler — explicit source-to-source translation",
    "",
    "Usage:",
    "  consoler translate <input.js> [--config <path>] [--out <path>] [--force]",
    "",
    "The current source grammar supports console.log with string literals only.",
    "Translation writes generated .el source; it never executes generated code.",
    "Existing output files are preserved unless --force is supplied."
  ].join("\n");
}

function parseArguments(args) {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return { help: true };
  }
  if (args[0] !== "translate") {
    throw new Error(`Unknown command "${args[0]}".\n\n${usage()}`);
  }

  let input = null;
  let configPath = ".consoler.console";
  let output = null;
  let force = false;

  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--force") {
      force = true;
    } else if (argument === "--config" || argument === "--out") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Option ${argument} requires a path.`);
      }
      if (argument === "--config") configPath = value;
      else output = value;
      index += 1;
    } else if (argument.startsWith("-")) {
      throw new Error(`Unknown option "${argument}".`);
    } else if (input === null) {
      input = argument;
    } else {
      throw new Error("Only one input file may be translated at a time.");
    }
  }

  if (!input) throw new Error(`Missing input file.\n\n${usage()}`);
  return { input, configPath, output, force, help: false };
}

export async function runCli(args = process.argv.slice(2), cwd = process.cwd()) {
  const options = parseArguments(args);
  if (options.help) {
    process.stdout.write(usage() + "\n");
    return 0;
  }

  const config = await loadConfig({ cwd, configPath: options.configPath });
  const inputPath = path.resolve(cwd, options.input);
  const outputPath = path.resolve(
    cwd,
    options.output ?? path.join(
      path.dirname(options.input),
      `${path.parse(options.input).name || "output"}.el`
    )
  );

  if (inputPath === outputPath) {
    throw new Error("Output path must not be the same as the input path.");
  }

  const source = await readFile(inputPath, "utf8");
  const program = parseConsoler(source);
  let generated;
  switch (config.translation.target) {
    case "electa":
      generated = emitElecta(program);
      break;
    default:
      throw new Error(`No backend is implemented for "${config.translation.target}".`);
  }

  try {
    await writeFile(outputPath, generated + "\n", {
      encoding: "utf8",
      flag: options.force ? "w" : "wx"
    });
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new Error(
        `Output already exists: ${outputPath}. Use --force to replace it.`
      );
    }
    throw error;
  }

  process.stdout.write(`Translated ${inputPath} -> ${outputPath} (Electa source only; not executed).\n`);
  return 0;
}

const invokedPath = process.argv[1]
  ? path.resolve(process.argv[1])
  : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  runCli().then(
    (code) => { process.exitCode = code; },
    (error) => {
      process.stderr.write(`Consoler: ${error.message}\n`);
      process.exitCode = 1;
    }
  );
}
