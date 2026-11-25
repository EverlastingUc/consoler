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

  for (const input of [
    'console.log("Hii")',
    'console.log("")',
    'console.log("A"); console.log("B")',
    'console.log("Hello, π 🚀")'
  ]) {
    const generated = emitElecta(parseConsoler(input));
    const result = execute(parse(generated));
    const expected = input.match(/console\.log\(("|')([\s\S]*?)\1\)/g);
    assert.ok(expected);
    assert.equal(result.status, "HALTED");
    assert.deepEqual(
      [...result.output],
      [...new TextEncoder().encode(
        input.includes("Hello, π 🚀") ? "Hello, π 🚀\n"
          : input.includes('console.log("A")') ? "A\nB\n"
          : input.includes('console.log("")') ? "\n"
          : "Hii\n"
      )]
    );
  }
});
