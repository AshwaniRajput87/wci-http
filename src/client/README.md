# HTTP Client Core — @wci/http

This folder contains the **core request execution engine**.

It is intentionally:

- Minimal
- Immutable
- Transport-focused

No business logic lives here.

---

## What this client is

- A thin, predictable wrapper over `fetch`
- Responsible only for:
  - URL resolution
  - Header merging
  - Timeout handling
  - Error normalization

---

## What this client is NOT

This client does **not**:

- Retry requests automatically
- Handle auth refresh
- Parse domain-specific responses
- Mutate global state

Those concerns belong to:

- Interceptors
- Retry policies
- Consumer layers

---

## Immutability Rule

The HTTP client is **immutable by design**.

- No shared mutable state
- No runtime config mutation
- Each request is independent

This guarantees:

- Thread safety
- SSR compatibility
- Edge safety

---

## URL Resolution

URL resolution follows strict rules:

1. Absolute URLs are never modified
2. Relative URLs require a baseURL
3. Invalid combinations fail early

Implementation lives in:
