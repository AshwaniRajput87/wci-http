import { httpClient } from "../client/httpClient";

import {
  WciLogger,
  HttpLogEvent,
  RequestInterceptor,
  ResponseInterceptor,
} from "../../src/types/http.types";

import { CONTENT_TYPES } from "../../src/constants/protocol/contentTypes";
import { createLoggingInterceptors } from "../../src/interceptors/loggingInterceptor";

/* ---------------------------------------
   Config
--------------------------------------- */
const CONFIG = {
  BASE_URL: "http://127.0.0.1:6010",
  DEFAULT_USER_ID: "demo-user-1",
  DELAY_MS: 100,
} as const;

/* ---------------------------------------
   Types
--------------------------------------- */
interface DemoUser {
  _id?: string;
  name: string;
  email: string;
  age: number;
}

interface DemoContext {
  userId?: string;
  token?: string;
  requestInterceptors: RequestInterceptor[];
  responseInterceptors: ResponseInterceptor[];
}

/* ---------------------------------------
   VERY DETAILED LOGGER
--------------------------------------- */
const createDemoLogger = (): WciLogger => ({
  log: (event: HttpLogEvent) => {
    const ts = new Date().toISOString().replace("T", " ").slice(0, 19);

    console.log(
      `
${ts}
LEVEL     : ${event.level.toUpperCase()}
METHOD    : ${event.method ?? "-"}
URL       : ${event.url ?? "-"}
STATUS    : ${event.status ?? "-"}
DURATION  : ${event.durationMs ?? "-"} ms
MESSAGE   : ${event.message ?? "-"}
ERROR     : ${event.errorCode ?? "-"}
`.trim(),
    );
  },
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  trace: console.trace,
});

/* ---------------------------------------
   Utils
--------------------------------------- */
const generateEmail = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}@test.com`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------------------
   AUTH INTERCEPTOR (SAFE)
--------------------------------------- */
const createAuthInterceptor = (
  getToken: () => string | undefined,
): RequestInterceptor => {
  return async (request) => {
    const token = getToken();
    if (!token) return request;

    return {
      ...request,
      headers: {
        ...(request.headers ?? {}), // ⭐ CRITICAL FIX
        Authorization: `Bearer ${token}`,
      },
    };
  };
};

/* ---------------------------------------
   Demo Runner
--------------------------------------- */
class FastifyApiDemo {
  private readonly logger = createDemoLogger();
  private readonly ctx: DemoContext;

  constructor() {
    // 1️⃣ Initialize context FIRST
    this.ctx = {
      token: undefined,
      requestInterceptors: [],
      responseInterceptors: [],
    };

    // 2️⃣ Create interceptors AFTER ctx exists
    const authInterceptor = createAuthInterceptor(() => this.ctx.token);
    const { requestInterceptor, responseInterceptor } =
      createLoggingInterceptors(this.logger);

    // 3️⃣ Register interceptors (order matters)
    this.ctx.requestInterceptors = [
      authInterceptor,     // adds Authorization
      requestInterceptor,  // logs final request
    ];

    this.ctx.responseInterceptors = [responseInterceptor];
  }

  private log(msg: string) {
    console.log(
      `\n${new Date()
        .toISOString()
        .replace("T", " ")
        .slice(0, 19)} DEMO → ${msg}`,
    );
  }

  /* ---------------------------------------
     Auth
  --------------------------------------- */
  private async authenticate() {
    this.log("Authenticating user");

    const res = await httpClient<{ token: string }>({
      method: "POST",
      baseURL: CONFIG.BASE_URL,
      url: "/login",
      body: { userId: CONFIG.DEFAULT_USER_ID },
      headers: {
        "Content-Type": CONTENT_TYPES.JSON,
      },
      requestInterceptors: this.ctx.requestInterceptors,
      responseInterceptors: this.ctx.responseInterceptors,
    });

    this.ctx.token = res.token;
    this.log("Authentication successful");
  }

  /* ---------------------------------------
     Start Demo
  --------------------------------------- */
  async start() {
    this.log("Fastify API demo starting");

    await this.authenticate();
    await sleep(CONFIG.DELAY_MS);

    /* ---------- POST /users ---------- */
    const user = await httpClient<DemoUser>({
      method: "POST",
      baseURL: CONFIG.BASE_URL,
      url: "/users",
      body: {
        name: "Ayu",
        email: generateEmail("ayu"),
        age: 24,
      },
      headers: {
        "Content-Type": CONTENT_TYPES.JSON,
        Accept: CONTENT_TYPES.JSON,
      },
      requestInterceptors: this.ctx.requestInterceptors,
      responseInterceptors: this.ctx.responseInterceptors,
    });

    this.ctx.userId = user._id;
    this.log("User created");
    await sleep(CONFIG.DELAY_MS);

    /* ---------- GET /users/me ---------- */
    await httpClient({
      method: "GET",
      baseURL: CONFIG.BASE_URL,
      url: "/users/me",
      headers: {}, // ⭐ REQUIRED so Authorization is attached
      requestInterceptors: this.ctx.requestInterceptors,
      responseInterceptors: this.ctx.responseInterceptors,
    });

    this.log("Fetched current user");
    await sleep(CONFIG.DELAY_MS);

    /* ---------- PUT /users/:id ---------- */
    await httpClient({
      method: "PUT",
      baseURL: CONFIG.BASE_URL,
      url: `/users/${this.ctx.userId}`,
      body: {
        name: "Ayu Updated",
        email: generateEmail("updated"),
        age: 25,
      },
      headers: {
        "Content-Type": CONTENT_TYPES.JSON,
      },
      requestInterceptors: this.ctx.requestInterceptors,
      responseInterceptors: this.ctx.responseInterceptors,
    });

    this.log("User updated");
    await sleep(CONFIG.DELAY_MS);

    /* ---------- DELETE /users/:id ---------- */
    await httpClient({
      method: "DELETE",
      baseURL: CONFIG.BASE_URL,
      url: `/users/${this.ctx.userId}`,
      headers: {}, // ⭐ REQUIRED
      requestInterceptors: this.ctx.requestInterceptors,
      responseInterceptors: this.ctx.responseInterceptors,
    });

    this.log("User deleted");
    this.log("Fastify API demo completed successfully");
  }
}

/* ---------------------------------------
   Run
--------------------------------------- */
new FastifyApiDemo()
  .start()
  .catch((e) => {
    console.error("Unhandled demo error:", e);
    process.exit(1);
  });

export { FastifyApiDemo };
