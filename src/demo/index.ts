import { get } from "../requests/get";
import { post } from "../requests/post";
import { put } from "../requests/put";
import { patch } from "../requests/patch";
import { del } from "../requests/delete";
import { head } from "../requests/head";
import { optionsReq } from "../requests/options";

import { WciLogger, HttpLogEvent } from "../../src/types/loggingTypes";
import { WciHttpError } from "../../src/errors/WciHttpError";

/* -------------------------------------------------------
   DEMO LOGGER (VISIBLE OUTPUT)
------------------------------------------------------- */

const demoLogger: WciLogger = {
  log: (event: HttpLogEvent) => {
    console.log(
      `[${event.level.toUpperCase()}] [${event.category}]`,
      event.message,
      {
        method: event.method,
        url: event.url,
        status: event.status,
        errorCode: event.errorCode,
        durationMs: event.durationMs,
      },
    );
  },
};

/* -------------------------------------------------------
   COMMON OPTIONS
------------------------------------------------------- */

const options = { logger: demoLogger };

/* -------------------------------------------------------
   DEMO RUN
------------------------------------------------------- */

async function run() {
  console.log("\n========== DEMO START ==========\n");

  /* ============================
     SUCCESS CASES (2xx)
     ============================ */

  await runCase("GET SUCCESS", async () => {
    const res = await get(
      "https://jsonplaceholder.typicode.com/todos/1",
      options,
    );
    console.log("Result:", (res as any).title);
  });

  await runCase("POST SUCCESS", async () => {
    const res = await post(
      "https://jsonplaceholder.typicode.com/posts",
      { title: "Demo", body: "Post body" },
      options,
    );
    console.log("Created ID:", (res as any).id);
  });

  await runCase("PUT SUCCESS", async () => {
    await put(
      "https://jsonplaceholder.typicode.com/posts/1",
      { title: "Updated title" },
      options,
    );
  });

  await runCase("PATCH SUCCESS", async () => {
    await patch(
      "https://jsonplaceholder.typicode.com/posts/1",
      { title: "Patched title" },
      options,
    );
  });

  await runCase("DELETE SUCCESS", async () => {
    await del("https://jsonplaceholder.typicode.com/posts/1", options);
  });

  await runCase("HEAD SUCCESS", async () => {
    await head("https://jsonplaceholder.typicode.com/posts/1", options);
  });

  await runCase("OPTIONS SUCCESS", async () => {
    await optionsReq("https://jsonplaceholder.typicode.com/posts", options);
  });

  /* ============================
     CLIENT ERROR (4xx → warn)
     ============================ */

  await runCase("GET 404 ERROR", async () => {
    await get("https://jsonplaceholder.typicode.com/invalid-endpoint", options);
  });

  /* ============================
     NETWORK ERROR (error)
     ============================ */

  await runCase("NETWORK ERROR", async () => {
    await get("https://this-domain-does-not-exist-12345.com", options);
  });

  console.log("\n========== DEMO END ==========\n");
}

/* -------------------------------------------------------
   CASE RUNNER (SAME STYLE FOR ALL)
------------------------------------------------------- */

async function runCase(label: string, fn: () => Promise<void>) {
  console.log(`\n--- ${label} ---`);

  try {
    await fn();
    console.log(`${label}: COMPLETED`);
  } catch (err) {
    if (err instanceof WciHttpError) {
      console.error(`${label}: FAILED`, err.code, err.status);
    } else {
      console.error(`${label}: UNEXPECTED ERROR`, err);
    }
  }
}

/* -------------------------------------------------------
   RUN
------------------------------------------------------- */

run();
