# interceptors

Cross-cutting request/response concerns.

## Examples

- Authentication
- Tenant injection
- Logging
- Headers

## Rules

- Must be composable
- Must not depend on application state
- Must not throw untyped errors

Interceptors are optional and order-sensitive.
