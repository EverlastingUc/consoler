# Consoler Roadmap

The roadmap is incremental. A phase is complete only after its acceptance criteria are met and its tests (where applicable) pass.

## Phase 0 — Repository foundation
- [x] Establish project scope and separate translator/security responsibilities.
- [x] Document security boundaries and limitations.
- [x] Add versioned starter configuration with Electa as the default target.
- [x] Establish a dependency-free Node.js project scaffold.
- [ ] Review the initial documentation against the implementation brief.

## Phase 1 — Threat model and API design
- [x] Draft the initial threat model in docs/THREAT-MODEL.md.
- [x] Propose a minimal typed API in docs/API-DESIGN.md.
- [ ] Finalize assets, trust boundaries, abuse cases, and privacy requirements.
- [ ] Specify a small typed security API.
- [ ] Define development/production behavior and safe defaults.
- [ ] Define server-side verification examples and event schema.
- [ ] Review API design before implementation.

## Phase 2 — Security toolkit foundation
- [x] Implement the minimal explicit client signal API in src/index.js.
- [x] Keep client signals explicitly untrusted and caller-triggered.
- [x] Avoid browser API dependencies; the core API does not require optional browser APIs.
- [x] Add unit tests for normal reporting, missing callback, invalid input, callback failure, and disposal.
- [ ] Add server-side receiver examples and integration tests in Phase 3.

## Phase 3 — Server-side examples
- [x] Provide server-side signal validation and authorization integration examples.
- [x] Demonstrate bounded per-session rate limiting (single-process reference only).
- [x] Document replay limitations and server-issued one-time nonce requirements.
- [x] Document what must never be placed in browser code.
- [ ] Add executable HTTP-framework integration tests and a production shared-store adapter.

## Phase 4 — Translator specification and parser
- [x] Define the initial source grammar and Electa output strategy in docs/TRANSLATOR-SPEC.md.
- [ ] Define the supported JavaScript-like grammar and semantics.
- [ ] Build a parser and a small, typed intermediate representation.
- [ ] Reject unsupported syntax with source locations.
- [ ] Never use eval or execute input during translation.

## Phase 5 — Electa backend
- [ ] Implement the Electa output backend as the default target.
- [ ] Confirm emitted syntax against the Electa language specification.
- [ ] Add golden tests for literals, output, variables, and supported expressions.
- [ ] Keep generated output separate from execution.

## Phase 6 — Additional translation backends
- [ ] Implement C output.
- [ ] Implement C++ output.
- [ ] Implement Rust output.
- [ ] Add backend-specific tests and clearly document semantic differences.
- [ ] Do not label a target supported before its tests pass.

## Phase 7 — CLI and configuration
- [ ] Parse and validate .consoler.console.
- [ ] Add explicit source/target selection and output-file handling.
- [ ] Add useful diagnostics and non-zero exit codes on errors.
- [ ] Require explicit user action to execute generated programs, if execution support is ever added.

## Phase 8 — Hardening and release
- [ ] Run the full test suite and security-focused tests.
- [ ] Audit dependencies (prefer none at runtime).
- [ ] Review privacy, accessibility, and failure behavior.
- [ ] Publish limitations, examples, changelog, and release notes.

## Completion rules
- Never claim a feature is complete without implementation and tests.
- Never silently translate unsupported syntax.
- Never treat browser-side checks or client-reported signals as authoritative security controls.
- Work directly on main; do not create feature branches unless the repository owner explicitly changes this instruction.
