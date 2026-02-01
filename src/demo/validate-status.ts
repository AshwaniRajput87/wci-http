import { WciHttp } from "../client/WciHttp";
import { isWciHttpError } from "../errors/WciHttpError";

// This example requires a running server to hit.
// You can use a simple express server for this.
const http = new WciHttp({ baseURL: "http://localhost:3000" });

async function runDemos() {
  console.log("--- Running validateStatus Demo ---");

  // A custom validateStatus function that considers 404 as a valid, non-error status.
  const customValidateStatus = (status: number) =>
    (status >= 200 && status < 300) || status === 404;

  try {
    console.log("\nRequesting a non-existent path with custom validation...");
    // The response will be undefined because a 404 has no body, but the request will succeed.
    const response = await http.get("/non-existent-path", {
      validateStatus: customValidateStatus,
    });

    console.log(
      "✅ Success: Request was treated as successful because validateStatus returned true for status 404.",
    );
    console.log("   Response data:", response);
  } catch (error) {
    if (isWciHttpError(error)) {
      console.error(
        `❌ Failure: Request was unexpectedly rejected with status: ${error.status}`,
      );
    } else {
      console.error("❌ Failure: An unexpected error occurred.", error);
    }
  }
}

runDemos();