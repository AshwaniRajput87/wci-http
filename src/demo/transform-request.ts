import { httpClient } from "../client/httpClient";
import { CONTENT_TYPES } from "../constants/protocol/contentTypes";

const API_BASE = "https://httpbin.org";

export async function run() {
  console.log("--- Demo: transformRequest modifies data and headers ---");

  // Example 1: mutate data and headers
  try {
    const res = await httpClient.post(`${API_BASE}/post`, { user: "alice" }, {
      headers: { "X-Initial": "present" },
      transformRequest: (data, headers) => {
        headers["X-Transformed"] = "yes";
        return { ...data, role: "admin" };
      },
    });
    console.log("Echoed JSON:", res.data.json);
    console.log("Sent headers (as seen by server):", res.data.headers);
  } catch (e) {
    console.error("Example 1 failed", e);
  }

  // Example 2: produce URL-encoded body
  try {
    const res = await httpClient.post(`${API_BASE}/post`, { a: 1, b: 2 }, {
      transformRequest: () => {
        const params = new URLSearchParams();
        params.set("a", "1");
        params.set("b", "2");
        return params;
      },
    });
    console.log("\n--- URL-Encoded Example ---");
    console.log("Echoed form:", res.data.form);
    console.log("Server saw Content-Type:", res.data.headers["Content-Type"] || res.data.headers["Content-type"]);
  } catch (e) {
    console.error("Example 2 failed", e);
  }
}

// Run if executed directly
if (require.main === module) {
  run().catch((err) => {
    console.error("Demo failed:", err);
    process.exit(1);
  });
}
