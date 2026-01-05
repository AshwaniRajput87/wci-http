/* -------------------- REQUEST IMPORTS (ESM SAFE) -------------------- */
import { get } from "../requests/get";
import { post } from "../requests/post";
import { put } from "../requests/put";
import { patch } from "../requests/patch";
import { del } from "../requests/delete";
import { optionsReq } from "../requests/options";


/* -------------------- INTERNAL TYPES / ERRORS (ESM SAFE) -------------------- */
import { WciLogger, HttpLogEvent } from "../../src/types/loggingTypes.js";
import { WciHttpError } from "../../src/errors/WciHttpError.js";

/* -------------------- CONSTANTS -------------------- */

const BASE_URL = "http://127.0.0.1:3000";
const UNKNOWN_PORT_URL = "http://127.0.0.1:9999";

/* -------------------- LOGGER (UNCHANGED) -------------------- */

function createDemoLogger(): WciLogger {
  return {
    log: (event: HttpLogEvent) => {
      console.log(
        `[${event.level.toUpperCase()}] [${event.category}] ${event.message}`,
        {
          method: event.method,
          url: event.url,
          status: event.status,
          errorCode: event.errorCode ?? "N/A",
          durationMs: event.durationMs,
        }
      );
    },
  };
}

const DEMO_LOGGER = createDemoLogger();

/* -------------------- DEMO OPTIONS -------------------- */

const DEMO_OPTIONS: {
  logger: WciLogger;
  headers: Record<string, string>;
} = {
  logger: DEMO_LOGGER,
  headers: {},
};

/* -------------------- HTTP LOG HELPER -------------------- */

function logHttp(
  logger: WciLogger,
  event: Omit<HttpLogEvent, "method" | "url" | "status" | "durationMs"> & {
    method?: string;
    url?: string;
    status?: number;
    durationMs?: number;
  }
) {
  logger.log({
    method: event.method ?? "N/A",
    url: event.url ?? "N/A",
    status: event.status ?? 0,
    durationMs: event.durationMs ?? 0,
    ...event,
  });
}

/* -------------------- TYPES -------------------- */

interface DemoUser {
  _id?: string;
  name: string;
  email: string;
  age: number;
}

interface DemoCase {
  label: string;
  run: (userId?: string) => Promise<string | void>;
  requiresUserId?: boolean;
  returnsUserId?: boolean;
  isErrorCase?: boolean;
}

/* -------------------- HELPERS -------------------- */

function generateUniqueEmail(): string {
  return `ayu_${Date.now()}@test.com`;
}

function createUserPayload(age = 24): DemoUser {
  return {
    name: "Ayu",
    email: generateUniqueEmail(),
    age,
  };
}

/* -------------------- LOGIN (JWT) -------------------- */

async function loginAndGetToken(userId = "demo-user-1"): Promise<string> {
  const res = await post(
    `${BASE_URL}/login`,
    { userId },
    { logger: DEMO_LOGGER }
  );

  const token = (res as { token: string }).token;

  if (!token) {
    throw new Error("JWT token missing from /login response");
  }

  return token;
}

/* -------------------- DEMO CASES -------------------- */

const demoCases: DemoCase[] = [
  {
    label: "POST USER",
    returnsUserId: true,
    run: async () => {
      const payload = createUserPayload();
      const res = await post(`${BASE_URL}/users`, payload, DEMO_OPTIONS);
      return (res as DemoUser)._id!;
    },
  },
  {
    label: "GET USERS (ME)",
    run: async () => {
      await get(`${BASE_URL}/users/me`, DEMO_OPTIONS);
    },
  },
  {
    label: "PUT USER",
    requiresUserId: true,
    run: async (userId) => {
      await put(
        `${BASE_URL}/users/${userId}`,
        {
          name: "Ayu Updated",
          email: generateUniqueEmail(),
          age: 25,
        },
        DEMO_OPTIONS
      );
    },
  },
  {
    label: "PATCH USER",
    requiresUserId: true,
    run: async (userId) => {
      await patch(
        `${BASE_URL}/users/${userId}`,
        { age: 26 },
        DEMO_OPTIONS
      );
    },
  },
  {
    label: "OPTIONS USERS",
    run: async () => {
      await optionsReq(`${BASE_URL}/users`, DEMO_OPTIONS);
    },
  },
  {
    label: "DELETE USER",
    requiresUserId: true,
    run: async (userId) => {
      await del(`${BASE_URL}/users/${userId}`, DEMO_OPTIONS);
    },
  },
  {
    label: "GET 404 ERROR",
    isErrorCase: true,
    run: async () => {
      await get(`${BASE_URL}/invalid-route`, DEMO_OPTIONS);
    },
  },
  {
    label: "NETWORK ERROR",
    isErrorCase: true,
    run: async () => {
      await get(UNKNOWN_PORT_URL, DEMO_OPTIONS);
    },
  },
];

/* -------------------- RUNNER -------------------- */

async function runCase(
  caseDef: DemoCase,
  userId?: string
): Promise<string | void> {
  logHttp(DEMO_LOGGER, {
    level: "info",
    category: "http",
    message: `Starting case: ${caseDef.label}`,
  });

  try {
    if (caseDef.requiresUserId && !userId) {
      throw new Error("UserId required but missing");
    }

    const result = await caseDef.run(userId);

    if (!caseDef.isErrorCase) {
      logHttp(DEMO_LOGGER, {
        level: "info",
        category: "http",
        message: `Completed case: ${caseDef.label}`,
      });
    }

    return result;
  } catch (err) {
    if (err instanceof WciHttpError) {
      logHttp(DEMO_LOGGER, {
        level: "error",
        category: "http",
        message: `Case failed: ${caseDef.label}`,
        status: err.status ?? 0,
        errorCode: err.code,
      });
    }
    throw err;
  }
}

/* -------------------- MAIN -------------------- */

async function runDemo(): Promise<void> {
  logHttp(DEMO_LOGGER, {
    level: "info",
    category: "http",
    message: "FASTIFY API DEMO START",
  });

  const token = await loginAndGetToken("demo-user-1");
  DEMO_OPTIONS.headers.Authorization = `Bearer ${token}`;

  let userId: string | undefined;

  for (const demoCase of demoCases) {
    try {
      const result = await runCase(demoCase, userId);
      if (demoCase.returnsUserId && result) {
        userId = result;
      }
    } catch {
      continue;
    }
  }

  logHttp(DEMO_LOGGER, {
    level: "info",
    category: "http",
    message: "FASTIFY API DEMO END",
  });
}

runDemo().catch(() => {
  logHttp(DEMO_LOGGER, {
    level: "error",
    category: "http",
    message: "Demo terminated with fatal error",
  });
});
