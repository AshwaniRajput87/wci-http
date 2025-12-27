# retries

Retry decision and backoff strategies.

## Responsibility

- Decide if request should retry
- Calculate retry delay

## Must NOT

- Perform HTTP calls
- Know about request payloads
- Mutate external state

Pure decision logic only.
