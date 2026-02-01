import { WciHttp } from "../client/WciHttp";
import { WciHttpError, isWciHttpError } from "./WciHttpError";

// Assume WciHttp is initialized with a base URL and a mock fetcher
const mockFetch = jest.fn();
const http = new WciHttp({
  baseURL: "https://api.example.com",
  fetcher: mockFetch as any,
});

async function demonstrateIsWciHttpError() {
  // Mock a response that will trigger an error based on default validateStatus
  mockFetch.mockResolvedValueOnce(
    new Response(null, {
      status: 401,
      statusText: "Unauthorized",
    }),
  );

  try {
    await http.get("/protected-resource");
  } catch (error) {
    if (isWciHttpError(error)) {
      console.log("--- Caught a WciHttpError ---");
      console.log("Error Name:", error.name);
      console.log("Error Code:", error.code);
      console.log("Error Status:", error.status);
      console.log("Message:", error.message);
      console.log("isWciHttpError flag:", error.isWciHttpError);
    } else if (error instanceof Error) {
      console.log("--- Caught a generic Error ---");
      console.log("Error Name:", error.name);
      console.log("Message:", error.message);
    } else {
      console.log("--- Caught an unknown error ---");
      console.log(error);
    }
  }

  // Demonstrate with a non-WciHttpError
  try {
    throw new Error("A generic JavaScript error");
  } catch (error) {
    if (isWciHttpError(error)) {
      console.log("\n--- Incorrectly identified as WciHttpError (should not happen) ---");
    } else if (error instanceof Error) {
      console.log("\n--- Correctly identified as generic Error ---");
      console.log("Error Name:", error.name);
      console.log("Message:", error.message);
    }
  }
}

demonstrateIsWciHttpError();
