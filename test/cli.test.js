import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "bin", "consoler.js");
const config = JSON.stringify({
  version: 1,
  translation: { source: "consoler-js", target: "electa" }
});

async function fixture(t) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "consoler-cli-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(path.join(cwd, ".consoler.console"), config);
  return cwd;
}

function run(cwd, args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8"
  });
}

test("CLI translates a source file to Electa without executing it", async (t) => {
  const cwd = await fixture(t);
  await writeFile(path.join(cwd, "hello.js"), 'console.log("Hii");');
  const result = run(cwd, ["translate", "hello.js"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /not executed/);
  const generated = await readFile(path.join(cwd, "hello.el"), "utf8");
  assert.ok(generated.length > 0);
  assert.match(generated, /\n$/);
});

test("CLI refuses to overwrite output unless --force is explicit", async (t) => {
  const cwd = await fixture(t);
  await writeFile(path.join(cwd, "hello.js"), 'console.log("Hii");');
  await writeFile(path.join(cwd, "hello.el"), "keep-me");
  const first = run(cwd, ["translate", "hello.js"]);
  assert.equal(first.status, 1);
  assert.match(first.stderr, /Use --force/);
  assert.equal(await readFile(path.join(cwd, "hello.el"), "utf8"), "keep-me");

  const second = run(cwd, ["translate", "hello.js", "--force"]);
  assert.equal(second.status, 0, second.stderr);
  assert.notEqual(await readFile(path.join(cwd, "hello.el"), "utf8"), "keep-me");
});

test("CLI accepts explicit config and output paths", async (t) => {
  const cwd = await fixture(t);
  await mkdir(path.join(cwd, "generated"));
  await writeFile(path.join(cwd, "input.js"), 'console.log("ok");');
  const result = run(cwd, [
    "translate", "input.js",
    "--config", ".consoler.console",
    "--out", "generated/output.el"
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.ok((await readFile(path.join(cwd, "generated/output.el"), "utf8")).length > 0);
});

test("CLI rejects unsupported syntax and unknown options", async (t) => {
  const cwd = await fixture(t);
  await writeFile(path.join(cwd, "bad.js"), "process.exit(1);");
  const syntax = run(cwd, ["translate", "bad.js"]);
  assert.equal(syntax.status, 1);
  assert.match(syntax.stderr, /Expected console.log/);

  const option = run(cwd, ["translate", "bad.js", "--surprise"]);
  assert.equal(option.status, 1);
  assert.match(option.stderr, /Unknown option/);
});

test("CLI help is available without loading project configuration", async (t) => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "consoler-cli-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const result = run(cwd, ["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
});
