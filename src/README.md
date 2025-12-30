# Source Architecture — @wci/http

This folder contains the **entire public and internal implementation**
of the WCI HTTP client.

Everything inside `src/` follows **infra-grade standards**.
No shortcuts. No implicit behavior.

---

## Core principles

- Explicit over implicit
- Immutable APIs
- Predictable side effects
- Clear ownership of logic
- Zero framework assumptions

This code must be safe for:

- Node
- Edge
- SSR
- SDK distribution
- Internal platforms

---

## Segregation rules

Each folder has **exactly one responsibility**.

No cross-contamination is allowed.

| Folder          | Responsibility             |
| --------------- | -------------------------- |
| `client/`       | Core HTTP engine           |
| `requests/`     | HTTP verb wrappers         |
| `errors/`       | Error modeling & codes     |
| `constants/`    | Protocol constants         |
| `utils/`        | Generic helpers only       |
| `interceptors/` | Lifecycle hooks            |
| `retries/`      | Retry & backoff logic      |
| `tests/`        | Unit tests (Vitest)        |
| `demo/`         | Temporary internal testing |

---

## Important rules

- No business logic in `utils`
- No constants mixed with logic
- No side effects at import time
- No mutation of config objects
- No framework-specific code

---

## Documentation standard

Every file must contain:

- Clear JSDoc
- Purpose (what it does)
- Usage intent (how it should be used)
- No class names in comments — only behavior

Example style:

```ts
/**
 * Resolves absolute and relative URLs safely.
 *
 * - Absolute URLs are returned as-is
 * - Relative URLs are resolved against baseURL
 *
 * This function is pure and side-effect free.
 */
```
