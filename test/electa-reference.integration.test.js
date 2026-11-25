import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { emitElecta } from "../src/translator/electa.js";
import { parseConsoler } from "../src/translator/parser.js";

const neutronPath = process.env.NEUTRON_PATH;

test("generated source executes in the Neutron Electa reference runtime", {
  skip: !neutronPath
}, async () => {
  const parserUrl = pathToFileURL(resolve(neutronPath, "src/parser.js"));
  const runtimeUrl = pathToFileURL(resolve(neutronPath, "src/runtime.js"));
  const { parse } = await import(parserUrl.href);
  const { execute } = await import(runtimeUrl.href);

  const fixtures = [
    ['console.log("Hii")', "Hii\n"],
    ['console.log("")', "\n"],
    ['console.log("A"); console.log("B")', "A\nB\n"],
    ['console.log("Hello, π 🚀")', "Hello, π 🚀\n"]
  ];

  for (const [input, expectedOutput] of fixtures) {
    const generated = emitElecta(parseConsoler(input));
    const result = execute(parse(generated));
    assert.equal(result.status, "HALTED");
    assert.deepEqual(
      [...result.output],
      [...new TextEncoder().encode(expectedOutput)]
    );
  }
});
