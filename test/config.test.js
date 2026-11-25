import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  ConsolerConfigError,
  loadConfig,
  parseConfig
} from "../src/config.js";

const valid = JSON.stringify({
  version: 1,
  translation: { source: "consoler-js", target: "electa" }
});

test("parseConfig accepts and freezes the supported v1 config", () => {
  const config = parseConfig(valid);
  assert.equal(config.version, 1);
  assert.equal(config.translation.target, "electa");
  assert.equal(Object.isFrozen(config), true);
  assert.equal(Object.isFrozen(config.translation), true);
});

test("parseConfig rejects malformed JSON with a stable error code", () => {
  assert.throws(
    () => parseConfig("{", { filePath: "custom.console" }),
    (error) => error instanceof ConsolerConfigError &&
      error.code === "CFG_INVALID_JSON" &&
      error.filePath === "custom.console"
  );
});

test("parseConfig rejects unsupported versions, keys, source and targets", () => {
  const cases = [
    [valid.replace('"version":1', '"version":2'), "CFG_UNSUPPORTED_VERSION"],
    [valid.replace('"target":"electa"', '"target":"rust"'), "CFG_UNSUPPORTED_TARGET"],
    [valid.replace('"consoler-js"', '"javascript"'), "CFG_UNSUPPORTED_SOURCE"],
    [valid.replace('"version":1', '"version":1,"extra":true'), "CFG_UNKNOWN_KEY"],
    [valid.replace('"source":"consoler-js",', '"source":"consoler-js","extra":true,'), "CFG_UNKNOWN_KEY"]
  ];
  for (const [source, code] of cases) {
    assert.throws(() => parseConfig(source), (error) => error.code === code);
  }
});

test("parseConfig rejects non-object roots and missing keys", () => {
  assert.throws(() => parseConfig("[]"), (error) => error.code === "CFG_INVALID_ROOT");
  assert.throws(
    () => parseConfig(JSON.stringify({ version: 1 })),
    (error) => error.code === "CFG_MISSING_KEY"
  );
});

test("loadConfig resolves explicit paths relative to cwd", async (t) => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "consoler-config-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await mkdir(path.join(cwd, "config"));
  await writeFile(path.join(cwd, "config", "project.console"), valid);
  const config = await loadConfig({
    cwd,
    configPath: "config/project.console"
  });
  assert.equal(config.translation.target, "electa");
});

test("loadConfig reports a missing config file", async (t) => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "consoler-config-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await assert.rejects(
    loadConfig({ cwd }),
    (error) => error.code === "CFG_NOT_FOUND"
  );
});
