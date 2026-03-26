import { WciHttp } from "./src/client/WciHttp";
import { WciHttpError } from "./src/errors/WciHttpError";

// Assume WciHttp is initialized with a base URL and a mock fetcher
const mockFetch = jest.fn();
const http = new WciHttp({
  baseURL: "https://api.example.com",
  fetcher: mockFetch as any,
});

async function demonstrateToJson() {
  // Mock a response that will trigger an error based on default validateStatus
  mockFetch.mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        error: "Resource not found",
        details: "The requested item does not exist.",
      }),
      {
        status: 404,
        statusText: "Not Found",
        headers: { "Content-Type": "application/json" },
      },
    ),
  );

  try {
    await http.get("/non-existent-resource", { timeoutMs: 5000 });
  } catch (error) {
    if (error instanceof WciHttpError) {
      console.log("--- WciHttpError toJSON() output ---");
      // Calling JSON.stringify will implicitly call the toJSON method
      const jsonError = JSON.stringify(error, null, 2);
      console.log(jsonError);

      // You can also call it directly
      const directToJson = error.toJSON();
      console.log("\n--- Direct toJSON() output ---");
      console.log(JSON.stringify(directToJson, null, 2));

      // Verify some properties
      console.log("\n--- Verification ---");
      const parsedError = JSON.parse(jsonError);
      console.log("Error Name:", parsedError.name);
      console.log("Error Code:", parsedError.code);
      console.log("Error Status:", parsedError.status);
      console.log("Request URL (from serialized request):", parsedError.request?.url);
      console.log("Response Status (from serialized response):", parsedError.response?.status);
      console.log("Response Headers (from serialized response):", parsedError.response?.headers);

    } else {
      console.error("An unexpected error occurred:", error);
    }
  }
}

demonstrateToJson();
