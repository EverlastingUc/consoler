# Security Policy

## Scope

Consoler is an early-stage project with two distinct areas: a defensive application-security toolkit and a source-to-source translator. Neither is a substitute for secure application architecture.

## Reporting a vulnerability

Please do not publish credentials, access tokens, private user data, or a working exploit for a live service in a public issue. Use GitHub's private vulnerability reporting for this repository when available. If private reporting is unavailable, contact the repository maintainer privately through a verified channel.

Include:
- affected version or commit;
- affected component and configuration;
- impact and realistic attack prerequisites;
- minimal reproduction steps that do not expose real user data.

## Security guarantees and limitations

Consoler does not make hacking impossible. Anything shipped to a browser can be inspected, modified, bypassed, or disabled by the person controlling that browser.

The server must independently enforce authentication, authorization, input validation, rate limits, replay protection, and all sensitive business rules. Never place secrets, private keys, privileged credentials, or trusted authorization decisions in client-side code.

Optional integrity signals are untrusted client reports. A server must not grant access or perform privileged actions solely because a client reports that it is untampered.

## Prohibited behavior

Consoler must not:
- disable DevTools, browser controls, keyboard shortcuts, or accessibility features;
- capture keystrokes, passwords, tokens, or arbitrary page content;
- hide activity, evade analysis, persist without consent, or exfiltrate data;
- freeze, crash, loop, or intentionally degrade a page or browser;
- delete or corrupt user data;
- automatically execute translated/generated source code.

## Translator safety

The translator must parse a documented language subset and generate source text only. It must not evaluate user input. Unsupported constructs must fail clearly rather than being approximated silently. Generated source is untrusted until reviewed and built through the user's normal toolchain.
