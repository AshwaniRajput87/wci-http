# @wci/http

A framework-agnostic, infra-grade HTTP client designed for long-term stability,
clear error semantics, and predictable behavior across Node, Edge, and browser
environments.

This is not a frontend utility. This is infrastructure code.

---

## Why this library exists

Most HTTP clients:
- Mix transport, business logic, and UI concerns
- Hide errors behind inconsistent shapes
- Break when moved across runtimes (Node / Edge / SSR)
- Become unmaintainable as teams grow

This library exists to provide:
- Deterministic error handling
- Stable public APIs
- Zero ambiguity for contributors
- Safe usage across multiple environments and organizations

---

## Design principles

- Immutable by default
- Explicit over implicit
- No hidden side effects
- Tree-shakable
- Framework-agnostic
- DSaaS-ready (Design System as a Service)
- Long-term API stability

---

## Folder structure (high level)

