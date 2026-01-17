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
   LOGGER
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
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------------------
   AUTH INTERCEPTOR
--------------------------------------- */
const createAuthInterceptor = (
  getToken: () => string | undefined,
): RequestInterceptor => async (request) => {
  const token = getToken();
  if (!token) return request;

  return {
    ...request,
    headers: {
      ...(request.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  };
};

/* ---------------------------------------
   MOCK FETCHERS (CLIENT-SIDE)
--------------------------------------- */

// 🔁 Retry mock: fails twice, succeeds on 3rd attempt
let retryAttempt = 0;
const retryMockFetcher = async (): Promise<Response> => {
  retryAttempt++;
  if (retryAttempt < 3) {
    throw new TypeError("NetworkError");
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

// ⏱ Timeout mock: never resolves → AbortController will fire
const timeoutMockFetcher = () =>
  new Promise<Response>(() => {});

/* ---------------------------------------
   Demo Runner
--------------------------------------- */
class FastifyApiDemo {
  private readonly logger = createDemoLogger();
  private readonly ctx: DemoContext;

  constructor() {
    this.ctx = {
      token: undefined,
      requestInterceptors: [],
      responseInterceptors: [],
    };

    const authInterceptor = createAuthInterceptor(() => this.ctx.token);
    const { requestInterceptor, responseInterceptor } =
      createLoggingInterceptors(this.logger);

    this.ctx.requestInterceptors = [
      authInterceptor,
      requestInterceptor,
    ];
    this.ctx.responseInterceptors = [responseInterceptor];
  }

  private log(msg: string) {
    console.log(
      `\n${new Date().toISOString().replace("T", " ").slice(0, 19)} DEMO → ${msg}`,
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
      headers: { "Content-Type": CONTENT_TYPES.JSON },
      requestInterceptors: this.ctx.requestInterceptors,
      responseInterceptors: this.ctx.responseInterceptors,
    });

    this.ctx.token = res.token;
    this.log("Authentication successful");
  }

  /* ---------------------------------------
     Retry Demo (Mocked)
  --------------------------------------- */
  private async retryDemo() {
    this.log("Retry demo starting (client-side mock)");

    const res = await httpClient({
      method: "GET",
      url: "/retry-mock",
      baseURL: CONFIG.BASE_URL,
      retry: true,
      maxRetries: 3,
      retryDelayMs: 300,
      fetcher: retryMockFetcher,
      headers: {},
      requestInterceptors: this.ctx.requestInterceptors,
      responseInterceptors: this.ctx.responseInterceptors,
    });

    this.log(`Retry demo succeeded: ${JSON.stringify(res)}`);
  }

  /* ---------------------------------------
     Timeout / Abort Demo (Mocked)
  --------------------------------------- */
  private async timeoutDemo() {
    this.log("Timeout demo starting (AbortController)");

    try {
      await httpClient({
        method: "GET",
        url: "/timeout-mock",
        baseURL: CONFIG.BASE_URL,
        timeoutMs: 100,
        fetcher: timeoutMockFetcher,
        headers: {},
        requestInterceptors: this.ctx.requestInterceptors,
        responseInterceptors: this.ctx.responseInterceptors,
      });
    } catch {
      this.log("Timeout demo completed (request aborted)");
    }
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
      headers: {},
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
      headers: { "Content-Type": CONTENT_TYPES.JSON },
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
      headers: {},
      requestInterceptors: this.ctx.requestInterceptors,
      responseInterceptors: this.ctx.responseInterceptors,
    });

    this.log("User deleted");
    await sleep(CONFIG.DELAY_MS);

    /* ---------- EXTRA FEATURE DEMOS ---------- */
    await this.retryDemo();
    await sleep(CONFIG.DELAY_MS);

    await this.timeoutDemo();

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
