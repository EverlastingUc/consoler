const MAX_SOURCE_BYTES = 1_048_576;
const WHITESPACE = new Set([" ", "\\t", "\\r", "\\n"]);
const ESCAPES = new Map([
  ["\\\\", "\\\\"],
  ["n", "\\n"],
  ["r", "\\r"],
  ["t", "\\t"],
  ['"', '"'],
  ["'", "'"]
]);

export class ConsolerSyntaxError extends SyntaxError {
  constructor(code, message, line, column) {
    super(message);
    this.name = "ConsolerSyntaxError";
    this.code = code;
    this.line = line;
    this.column = column;
  }
}

/** Parse the intentionally small consol er-js output-only language into a frozen AST. */
export function parseConsoler(source) {
  if (typeof source !== "string") {
    throw new TypeError("Consoler source must be a string.");
  }
  if (new TextEncoder().encode(source).byteLength > MAX_SOURCE_BYTES) {
    throw new ConsolerSyntaxError("C001", "Source exceeds the 1 MiB limit.", 1, 1);
  }

  let index = 0;
  const statements = [];

  function location(at = index) {
    let line = 1;
    let column = 1;
    for (let i = 0; i < at; i += 1) {
      if (source[i] === "\\n") {
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
    }
    return { line, column };
  }

  function fail(code, message, at = index) {
    const point = location(at);
    throw new ConsolerSyntaxError(code, message, point.line, point.column);
  }

  function skipWhitespace() {
    while (index < source.length && WHITESPACE.has(source[index])) index += 1;
  }

  function expect(text, code, message) {
    if (!source.startsWith(text, index)) fail(code, message);
    index += text.length;
  }

  function readString() {
    const quote = source[index];
    const start = index;
    index += 1;
    let value = "";

    while (index < source.length) {
      const character = source[index];
      if (character === quote) {
        index += 1;
        return value;
      }
      if (character === "\\n" || character === "\\r") {
        fail("C004", "Line breaks are not allowed inside string literals.");
      }
      if (character === "\\\\") {
        const escapeAt = index;
        index += 1;
        if (index >= source.length) fail("C005", "Unterminated escape sequence.", escapeAt);
        const escaped = source[index];
        if (!ESCAPES.has(escaped)) {
          fail("C006", "Unsupported string escape sequence.", escapeAt);
        }
        value += ESCAPES.get(escaped);
        index += 1;
        continue;
      }
      value += character;
      index += 1;
    }

    fail("C003", "Unterminated string literal.", start);
  }

  skipWhitespace();
  while (index < source.length) {
    const statementStart = index;
    const point = location(statementStart);
    expect("console.log", "C002", "Expected console.log output statement.");
    skipWhitespace();
    expect("(", "C007", "Expected '(' after console.log.");
    skipWhitespace();

    if (source[index] !== '"' && source[index] !== "'") {
      fail("C008", "Expected a single- or double-quoted string literal.");
    }
    const value = readString();
    skipWhitespace();
    expect(")", "C009", "Expected ')' after the string literal.");
    skipWhitespace();
    if (source[index] === ";") index += 1;

    statements.push(Object.freeze({
      type: "OutputStatement",
      value,
      line: point.line,
      column: point.column
    }));
    skipWhitespace();
  }

  return Object.freeze({
    type: "Program",
    sourceLanguage: "consoler-js",
    statements: Object.freeze(statements)
  });
}
