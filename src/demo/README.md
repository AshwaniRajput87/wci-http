# demo

Temporary demo layer for validating the `wci-http` library behavior.

## Purpose

This folder exists ONLY to:
- Manually test the HTTP client during development
- Validate error codes, request flow, and configuration
- Simulate real API usage without external consumers

This is **NOT part of the public API**.

## What is allowed here

- Fake / public APIs (e.g. jsonplaceholder)
- Direct calls to `createHttpClient`
- Console logging for verification
- Quick experimentation

## What is NOT allowed

- Business logic
- Production usage
- Reusable utilities
- Long-term dependencies

## Lifecycle

This folder is **temporary**.
It MUST be removed once:
- All features are verified
- Test coverage is complete
- Library API is stabilized

## Example Usage

```ts
import { createHttpClient } from '../index';

const client = createHttpClient({
  errorPrefix: 'DEMO',
});

client.get('/todos/1').then(console.log);
