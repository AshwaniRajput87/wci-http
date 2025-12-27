# Error System — @wci/http

This folder defines the **canonical error system** used by the WCI HTTP client.

Errors are **structured**, **predictable**, and **prefix-aware**.

No raw errors are ever exposed to consumers.

---

## Why this exists

In distributed systems:
- Errors must be machine-readable
- Errors must be traceable across services
- Errors must never change silently

This system guarantees:
- Stable error codes
- Org-level customization
- Zero ambiguity for consumers

---

## Error Code Structure

Every error code follows:

