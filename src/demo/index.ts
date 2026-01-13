import { get } from "../requests/get";
import { post } from "../requests/post";
import { put } from "../requests/put";
import { patch } from "../requests/patch";
import { del } from "../requests/delete";
import { optionsReq } from "../requests/options";

import {
  WciLogger,
  HttpLogEvent,
  RequestInterceptor,
  ResponseInterceptor,
} from "../../src/types/http.types";

import { CONTENT_TYPES } from "../../src/constants/protocol/contentTypes";
import { ApiSuccessResponse } from "../../src/types/success.types";
import { handleSuccess } from "../../src/utils/handleSuccess";
import { createLoggingInterceptors } from "../../src/interceptors/loggingInterceptor";


const CONFIG = {
  BASE_URL: "http://127.0.0.1:6010",
  DEFAULT_USER_ID: "demo-user-1",
  DELAY_MS: 100,
} as const;



interface DemoUser {
  _id?: string;
  name: string;
  email: string;
  age: number;
}

interface DemoContext {
  userId?: string;
  options: {
    logger: WciLogger;
    headers: Record<string, string>;
    timeoutMs?: number;
    requestInterceptors?: RequestInterceptor[];
    responseInterceptors?: ResponseInterceptor[];
  };
}

type DemoCase = {
  label: string;
  requiresUserId?: boolean;
  expectError?: boolean;
  run: (ctx: DemoContext) => Promise<unknown>; 
};


const createDemoLogger = (): WciLogger => ({
  log: (event: HttpLogEvent) => {
    const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
    const lvl = event.level.toUpperCase().padEnd(5);
    const mtd = (event.method ?? "N/A").padEnd(7);
    const st = event.status ? String(event.status).padEnd(3) : "N/A";
    const dur = event.durationMs ? `${event.durationMs}ms` : "";
    const err = event.errorCode ? `ERROR:${event.errorCode}` : "";

    console.log(
      `${ts} || ${lvl} || ${mtd} || ${st} || ${event.url ?? "N/A"} || ${dur} || ${err} || ${event.message}`,
    );
  },
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  trace: console.trace,
});



const generateEmail = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class LoggedHttpClient {
  private readonly logger: WciLogger;
  private readonly requestInterceptors: RequestInterceptor[];
  private readonly responseInterceptors: ResponseInterceptor[];

  constructor(logger: WciLogger) {
    this.logger = logger;
    const { requestInterceptor, responseInterceptor } =
      createLoggingInterceptors(logger);
    this.requestInterceptors = [requestInterceptor];
    this.responseInterceptors = [responseInterceptor];
  }

  private async exec<T>(
    fn: () => Promise<any>,
    expectedStatus: number,
  ): Promise<ApiSuccessResponse<T>> {
    const response = await fn();
    return handleSuccess<T>(response, expectedStatus);
  }

  get<T>(url: string, options: any) {
    return this.exec<T>(
      () =>
        get(url, {
          ...options,
          logger: this.logger,
          requestInterceptors: this.requestInterceptors,
          responseInterceptors: this.responseInterceptors,
        }),
      200,
    );
  }

  post<T>(url: string, data: unknown, options: any) {
    return this.exec<T>(
      () =>
        post(url, data, {
          ...options,
          logger: this.logger,
          requestInterceptors: this.requestInterceptors,
          responseInterceptors: this.responseInterceptors,
        }),
      201,
    );
  }

  put<T>(url: string, data: unknown, options: any) {
    return this.exec<T>(
      () =>
        put(url, data, {
          ...options,
          logger: this.logger,
          requestInterceptors: this.requestInterceptors,
          responseInterceptors: this.responseInterceptors,
        }),
      200,
    );
  }

  patch<T>(url: string, data: unknown, options: any) {
    return this.exec<T>(
      () =>
        patch(url, data, {
          ...options,
          logger: this.logger,
          requestInterceptors: this.requestInterceptors,
          responseInterceptors: this.responseInterceptors,
        }),
      200,
    );
  }

  delete<T>(url: string, options: any) {
    return this.exec<T>(
      () =>
        del(url, {
          ...options,
          logger: this.logger,
          requestInterceptors: this.requestInterceptors,
          responseInterceptors: this.responseInterceptors,
        }),
      200,
    );
  }

  options<T>(url: string, options: any) {
    return this.exec<T>(
      () =>
        optionsReq(url, {
          ...options,
          logger: this.logger,
          requestInterceptors: this.requestInterceptors,
          responseInterceptors: this.responseInterceptors,
        }),
      200,
    );
  }
}


class FastifyApiDemo {
  private readonly logger = createDemoLogger();
  private readonly client = new LoggedHttpClient(this.logger);

  private readonly ctx: DemoContext = {
    options: {
      logger: this.logger,
      headers: {
        "Content-Type": CONTENT_TYPES.JSON,
        Accept: CONTENT_TYPES.JSON,
      },
    },
  };

  private log(level: "info" | "warn" | "error", msg: string) {
    console.log(
      `${new Date().toISOString().replace("T", " ").slice(0, 19)} ${level
        .toUpperCase()
        .padEnd(5)} DEMO  ${msg}`,
    );
  }

  private async authenticate() {
    this.log("info", "Authenticating user");
    const res = await this.client.post<{ token: string }>(
      `${CONFIG.BASE_URL}/login`,
      { userId: CONFIG.DEFAULT_USER_ID },
      { headers: {} },
    );
    this.ctx.options.headers.Authorization = `Bearer ${res.data.token}`;
    this.log("info", "Authentication successful");
  }

  private cases(): DemoCase[] {
    return [
      {
        label: "POST /users",
        run: async (c) => {
          const res = await this.client.post<DemoUser>(
            `${CONFIG.BASE_URL}/users`,
            { name: "Ayu", email: generateEmail("ayu"), age: 24 },
            c.options,
          );
          c.userId = res.data._id;
        },
      },
      {
        label: "GET /users/me",
        run: (c) =>
          this.client.get(`${CONFIG.BASE_URL}/users/me`, c.options),
      },
      {
        label: "PUT /users/:id",
        requiresUserId: true,
        run: (c) =>
          this.client.put(
            `${CONFIG.BASE_URL}/users/${c.userId}`,
            { name: "Ayu Updated", email: generateEmail("updated"), age: 25 },
            c.options,
          ),
      },
      {
        label: "PATCH /users/:id",
        requiresUserId: true,
        expectError: true,
        run: (c) =>
          this.client.patch(
            `${CONFIG.BASE_URL}/users/${c.userId}`,
            { age: 26 },
            c.options,
          ),
      },
      {
        label: "OPTIONS /users",
        expectError: true,
        run: (c) =>
          this.client.options(`${CONFIG.BASE_URL}/users`, c.options),
      },
      {
        label: "DELETE /users/:id",
        requiresUserId: true,
        run: (c) =>
          this.client.delete(
            `${CONFIG.BASE_URL}/users/${c.userId}`,
            {
              headers: {
                Authorization: c.options.headers.Authorization!,
              },
            },
          ),
      },
      {
        label: "GET /invalid-route",
        expectError: true,
        run: (c) =>
          this.client.get(`${CONFIG.BASE_URL}/invalid-route`, c.options),
      },
    ];
  }

  async start() {
    this.log("info", "Fastify API Demo starting");
    await this.authenticate();

    for (const t of this.cases()) {
      this.log("info", `Starting test case: ${t.label}`);
      try {
        if (t.requiresUserId && !this.ctx.userId) continue;
        await t.run(this.ctx);
        this.log("info", `Completed test case: ${t.label}`);
      } catch {
        if (t.expectError) {
          this.log("info", `Expected error handled in case: ${t.label}`);
        } else {
          throw new Error(`Unexpected failure in case: ${t.label}`);
        }
      }
      await sleep(CONFIG.DELAY_MS);
    }

    this.log("info", "Fastify API Demo completed successfully");
  }
}

new FastifyApiDemo().start().catch((e) => {
  console.error("Unhandled demo error:", e);
  process.exit(1);
});

export { FastifyApiDemo, type DemoUser, type DemoContext };
