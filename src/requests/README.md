# Request Helpers — @wci/http

This folder contains **HTTP verb-specific helpers**.

Each file maps **1:1 with an HTTP method** and exposes a predictable API.

---

## Purpose

These helpers:

- Normalize request shape
- Enforce HTTP semantics
- Delegate execution to the core client

They do **not**:

- Contain retry logic
- Handle auth tokens
- Parse domain responses

---

## Available Methods

| File      | HTTP Method |
| --------- | ----------- |
| get.ts    | GET         |
| post.ts   | POST        |
| put.ts    | PUT         |
| patch.ts  | PATCH       |
| delete.ts | DELETE      |

---

## Usage Example

```ts
import { get, post } from "@wci/http";

const users = await get("/users");

const created = await post("/users", {
  name: "Ayushi",
});
```
