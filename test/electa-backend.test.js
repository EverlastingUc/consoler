import test from "node:test";
import assert from "node:assert/strict";
import { emitElecta, ConsolerTranslationError } from "../src/translator/electa.js";
import { parseConsoler } from "../src/translator/parser.js";

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!?";

function decodeOutputOnly(source) {
  let key = 0;
  let data = 0;
  const output = [];
  let halted = false;

  for (let index = 0; index < source.length; index += 1) {
    const symbol = ALPHABET.indexOf(source[index]);
    assert.notEqual(symbol, -1, "backend must emit only Electa alphabet symbols");
    const opcode = (symbol ^ key) & 63;
    const nextPc = index + 1;

    if (opcode === 1) data = (data + 1) & 255;
    else if (opcode === 2) data = (data - 1) & 255;
    else if (opcode === 5) output.push(data);
    else if (opcode === 15) halted = true;
    else assert.fail("backend emitted unsupported opcode " + opcode);

    key = ((key * 17) + opcode + data + (nextPc & 63)) & 63;
    if (opcode === 15) {
      assert.equal(index, source.length - 1, "HALT must be the final symbol");
      break;
    }
  }

  assert.equal(halted, true, "program must terminate with HALT");
  return output;
}

test("matches the published Electa example for INC, EMIT, HALT", () => {
  assert.deepEqual(decodeOutputOnly("16q"), [1]);
});

test("translates console.log text into valid Electa output bytes", () => {
  const source = emitElecta(parseConsoler('console.log("Hii")'));
  assert.deepEqual(decodeOutputOnly(source), [...new TextEncoder().encode("Hii\n")]);
  assert.equal(source.length > 0, true);
});

test("emits a newline for empty strings and each output statement", () => {
  const source = emitElecta(parseConsoler('console.log(""); console.log("A")'));
  assert.deepEqual(decodeOutputOnly(source), [...new TextEncoder().encode("\nA\n")]);
});

test("is deterministic and emits only the Electa alphabet", () => {
  const program = parseConsoler('console.log("repeat")');
  const first = emitElecta(program);
  assert.equal(emitElecta(program), first);
  assert.match(first, /^[0-9A-Za-z!?]+$/);
});

test("rejects malformed intermediate representations", () => {
  assert.throws(() => emitElecta(null), TypeError);
  assert.throws(() => emitElecta({type:"Program",sourceLanguage:"consoler-js",statements:[{}]}), TypeError);
});

test("enforces the generated source ceiling", () => {
  const program = {
    type: "Program",
    sourceLanguage: "consoler-js",
    statements: [{type:"OutputStatement",value:"x".repeat(1_048_577),line:1,column:1}]
  };
  assert.throws(() => emitElecta(program), error => error instanceof ConsolerTranslationError && error.code === "T001");
});
