# Translator Specification

**Status:** The bounded parser and Electa backend are implemented for this output-only subset. C, C++, Rust, configuration loading, and the CLI remain future work.

## 1. Purpose

Consoler translates a small, documented JavaScript-like input language called `consoler-js` into source code for a selected target. The first target is Electa. Later targets may include C, C++, and Rust.

This is a source-to-source compiler, not a browser DevTools replacement and not a runtime security mechanism.

## 2. Version 1 input language

The first version intentionally supports only one statement form:

```ebnf
program       = { output_statement } ;
output_statement = "console.log" , "(" , string_literal , ")" , [ ";" ] ;
string_literal  = double_quoted_string | single_quoted_string ;
```

String literals support UTF-8 text and a deliberately limited escape set: `\\`, `\n`, `\r`, `\t`, `\"`, and `\'`. Invalid escapes and unterminated strings are errors with line and column information.

No variables, expressions, imports, function calls other than console.log, templates, comments, or arbitrary JavaScript are supported in v1. Unsupported syntax must be rejected; it must never be guessed or passed through.

## 3. Semantics

- Each console.log statement emits the decoded string followed by one line-feed byte (LF, 0x0A), matching the newline behavior expected from console.log.
- Strings are encoded as UTF-8 bytes before target lowering.
- Statements are emitted in source order.
- Empty strings are valid.
- No source statement is executed during translation.

## 4. Electa backend

Electa is a stateful six-bit encoded esoteric language. Its source is not a textual spelling of ordinary instructions. The backend must generate a valid Electa instruction stream and encode each opcode using the current decoder key exactly as specified by the Electa language specification.

For the first output-only subset, the backend may use only:
- INC (opcode 1),
- DEC (opcode 2),
- EMIT (opcode 5),
- HALT (opcode 15).

The Electa machine starts with a zeroed data tape and key zero. To emit each UTF-8 byte:
1. Move the current data cell from its previous byte value to the desired byte value using the shorter sequence of INC or DEC operations (modulo 256).
2. Emit the current byte.
3. Update the decoder key after every instruction using the normative Electa formula and post-instruction machine state.
4. Encode each opcode as source symbol S = opcode XOR key, then map S through the exact Electa source alphabet.
5. Append an encoded HALT instruction.

The encoder must be tested against the Electa interpreter. Unit tests decode the emitted output-only instruction subset and check byte-for-byte output. CI also runs generated fixtures through the pinned Neutron reference parser and runtime. Generated Electa source is capped at 1 MiB of symbols.

## 5. Output and execution boundary

- Translation returns source text and diagnostics only.
- The default output extension for the Electa target is .el.
- The translator must not spawn a shell, invoke a compiler, or execute generated output.
- Building or running generated source, if ever offered, must be a separate explicit user action.
- The CLI must not overwrite an existing output file unless the user explicitly requests it.

## 6. Configuration

The project configuration file is `.consoler.console`, encoded as UTF-8 JSON:

```json
{
  "version": 1,
  "translation": {
    "source": "consoler-js",
    "target": "electa"
  }
}
```

Rules:
- version must equal 1.
- source must equal `consoler-js` for this initial grammar.
- target must be one of the implemented backend identifiers.
- If the target is omitted, default to `electa`.
- Unknown keys and invalid values must produce clear configuration errors.
- Configuration is data; it must never be evaluated as code.

## 7. Diagnostics

Every parse or configuration error should include:
- a stable error code;
- a concise message;
- one-based line and column when the error relates to source text.

The translator must fail on unsupported syntax rather than emitting partial or misleading output.

## 8. Future compatibility

C, C++, and Rust backends must preserve the defined output semantics for supported input. If a target cannot represent a source construct without changing behavior, the backend must reject it or document a precise, tested mapping. A target is not supported until conformance tests pass.
