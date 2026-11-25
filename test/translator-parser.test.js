import test from "node:test";
import assert from "node:assert/strict";
import { ConsolerSyntaxError, parseConsoler } from "../src/translator/parser.js";

test("parses one output statement and freezes its typed AST", () => {
  const program = parseConsoler('console.log("Hii");');
  assert.equal(program.type, "Program");
  assert.equal(program.sourceLanguage, "consoler-js");
  assert.deepEqual(program.statements[0], {
    type: "OutputStatement", value: "Hii", line: 1, column: 1
  });
  assert.equal(Object.isFrozen(program), true);
  assert.equal(Object.isFrozen(program.statements), true);
  assert.equal(Object.isFrozen(program.statements[0]), true);
});

test("parses multiple statements, whitespace, quote styles, and supported escapes", () => {
  const program = parseConsoler("  console.log('a\\n\\t\\\\b');\\nconsole.log(\"it's okay\")");
  assert.equal(program.statements.length, 2);
  assert.equal(program.statements[0].value, "a\\n\\t\\\\b");
  assert.equal(program.statements[1].value, "it's okay");
  assert.equal(program.statements[1].line, 2);
});

test("accepts an empty program and empty strings", () => {
  assert.equal(parseConsoler("").statements.length, 0);
  assert.equal(parseConsoler('console.log("")').statements[0].value, "");
});

test("rejects unsupported syntax with stable source locations", () => {
  assert.throws(
    () => parseConsoler("console.log(1)"),
    error => error instanceof ConsolerSyntaxError && error.code === "C008" && error.line === 1
  );
  assert.throws(
    () => parseConsoler("\\nalert('x')"),
    error => error instanceof ConsolerSyntaxError && error.code === "C002" && error.line === 2
  );
});

test("rejects invalid escapes, raw newlines, and unterminated strings", () => {
  for (const source of ['console.log("\\q")', 'console.log("a\\nb")', 'console.log("unterminated)']) {
    assert.throws(() => parseConsoler(source), ConsolerSyntaxError);
  }
});

test("rejects malformed calls and trailing unsupported tokens", () => {
  for (const source of ['console.log "x"', 'console.log("x"', 'console.log("x") + 1', 'console.error("x")']) {
    assert.throws(() => parseConsoler(source), ConsolerSyntaxError);
  }
});

test("enforces the UTF-8 source byte ceiling", () => {
  assert.throws(() => parseConsoler(" ".repeat(1_048_577)), error => error.code === "C001");
});

test("rejects non-string source", () => {
  assert.throws(() => parseConsoler(null), TypeError);
});
