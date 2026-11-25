const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!?";
const MAX_ELECTA_SOURCE_SYMBOLS = 1_048_576;
const LF = String.fromCharCode(10);
const encoder = new TextEncoder();

export class ConsolerTranslationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ConsolerTranslationError";
    this.code = code;
  }
}

/**
 * Encode a parsed consol er-js Program as valid Electa source.
 * The generated source is returned only; this function never executes it.
 */
export function emitElecta(program) {
  if (
    program === null ||
    typeof program !== "object" ||
    program.type !== "Program" ||
    program.sourceLanguage !== "consoler-js" ||
    !Array.isArray(program.statements)
  ) {
    throw new TypeError("emitElecta expects a parsed consoler-js Program.");
  }

  let source = "";
  let key = 0;
  let dataCell = 0;
  let pc = 0;
  const dp = 0;
  const cp = 0;

  function emitInstruction(opcode) {
    if (source.length >= MAX_ELECTA_SOURCE_SYMBOLS) {
      throw new ConsolerTranslationError(
        "T001",
        "Generated Electa source exceeds the 1 MiB symbol limit."
      );
    }

    const symbolIndex = (opcode ^ key) & 63;
    source += ALPHABET[symbolIndex];

    if (opcode === 1) dataCell = (dataCell + 1) & 255;
    else if (opcode === 2) dataCell = (dataCell - 1) & 255;

    pc += 1;
    key = (
      (key * 17) +
      opcode +
      dataCell +
      (dp * 3) +
      (cp * 5) +
      (pc & 63)
    ) & 63;
  }

  for (const statement of program.statements) {
    if (
      statement === null ||
      typeof statement !== "object" ||
      statement.type !== "OutputStatement" ||
      typeof statement.value !== "string"
    ) {
      throw new TypeError("Program contains an invalid OutputStatement.");
    }

    const bytes = encoder.encode(statement.value + LF);
    for (const targetByte of bytes) {
      const increments = (targetByte - dataCell + 256) & 255;
      const decrements = (dataCell - targetByte + 256) & 255;

      if (increments <= decrements) {
        for (let count = 0; count < increments; count += 1) emitInstruction(1);
      } else {
        for (let count = 0; count < decrements; count += 1) emitInstruction(2);
      }
      emitInstruction(5);
    }
  }

  emitInstruction(15);
  return source;
}
