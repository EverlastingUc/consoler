# Consoler

**Consoler** is an application-security toolkit and a small, explicit source-to-source translation toolchain.

It has two separate parts:

1. **Defensive security toolkit** — helps application developers apply safer client/server boundaries, validate untrusted input, and report optional integrity signals without pretending that browser-side checks are unbreakable.
2. **Translator** — translates a deliberately limited, documented JavaScript-like source language into a selected target language. The default target is **Electa** (extension .el). Translation produces source code; it does not execute generated code.

These parts share the Consoler project but do not share security responsibilities. The translator is not a security boundary, and the security toolkit does not depend on the translator.

## Status

Early development. The repository is being established. Configuration and security design are documented first; implementation and executable tests are not complete yet. See ROADMAP.md.

## Configuration

The repository includes a starter .consoler.console configuration:

```json
{
  "version": 1,
  "translation": {
    "source": "consoler-js",
    "target": "electa"
  }
}
```

The default target is Electa. The planned target set includes Electa, C, C++, and Rust. A target is only considered supported when its backend and tests are implemented. The config is a project file, not a browser-console setting.

## Translation example (planned)

Input:

```js
console.log("Hii");
```

A C++ backend should emit equivalent C++ source, for example:

```cpp
#include <iostream>

int main() {
    std::cout << "Hii" << std::endl;
    return 0;
}
```

The exact accepted syntax and output are governed by the translator specification. Unsupported syntax must produce a clear error instead of silently generating incorrect code. Generated code is never run automatically.

Consoler will **not** intercept or replace the browser's native DevTools console. Use its own CLI/API workflow to translate source files.

## Security principles

- Browser code and browser-visible state are controlled by the user and must be treated as untrusted.
- Authorization, validation, rate limits, replay protection, and sensitive operations belong on the server.
- Optional client-side integrity/tamper signals are telemetry hints, not proof and not authorization decisions.
- No disabling DevTools, keyboard shortcuts, browser controls, or accessibility features.
- No keystroke, password, token, or page-content surveillance.
- No stealth, persistence, anti-analysis evasion, data destruction, denial-of-service behavior, or automatic execution of generated code.
- Security features must be opt-in, documented, privacy-conscious, and removable.

Read SECURITY.md, docs/THREAT-MODEL.md, and docs/API-DESIGN.md before integrating security features. The initial source grammar and Electa encoding design are in docs/TRANSLATOR-SPEC.md.

## Defensive client API (implemented baseline)

```js
import { createConsoler } from "consoler";

const consoler = createConsoler({
  onSignal(signal) {
    // The application chooses its own transport and server endpoint.
    // Treat this client-originated payload as untrusted telemetry.
    console.info("Consoler signal received", signal.kind, signal.detailCode);
  }
});

consoler.reportSignal("client-runtime-error", "editor.initialization-failed", "editor-page");

// When the integration is no longer needed:
consoler.dispose();
```

The callback above is illustrative. Consoler itself does not send the signal anywhere. Do not send secrets, personal data, full URLs, request bodies, or user-entered text in signal fields. See docs/API-DESIGN.md for validation rules.

## Development

Requirements: Node.js 20 or newer.

```sh
npm test
```

There are no runtime dependencies. The minimal client API has Node.js tests under test/. Run them locally with `npm test`; test execution has not yet been verified in this repository session.

## Non-goal

No client-side library can make hacking impossible. Consoler aims to make secure application design easier and to provide honest, limited signals—not to replace server-side security controls.
