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
- [ ] Implement the minimal client integration API.
- [ ] Keep client signals explicitly untrusted.
- [ ] Add safe failure behavior when optional browser APIs are missing.
- [ ] Add unit tests for normal, missing, tampered, and failing conditions.

## Phase 3 — Server-side examples
- [ ] Provide server-side validation and authorization examples.
- [ ] Demonstrate rate limiting and replay protection where relevant.
- [ ] Demonstrate how to ignore, validate, or rate-limit client integrity signals.
- [ ] Document what must never be placed in browser code.

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
