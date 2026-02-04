import { WciHttp } from "../client/WciHttp";


// Assume WciHttp is initialized with a base URL and a mock fetcher
const mockFetch = jest.fn();
const http = new WciHttp({
  baseURL: "https://api.example.com",
  fetcher: mockFetch as any,
});

async function demonstrateTransformResponse() {
  // --- Example 1: Single transformResponse function ---
  mockFetch.mockResolvedValueOnce(
    new Response(
      JSON.stringify({ value: 100, unit: "USD" }),
      {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "application/json" },
      },
    ),
  );

  try {
    const transformedData = await http.get<{ price: string }>(
      "/products/item-1",
      {
        transformResponse: (data: { value: number; unit: string }, headers: Record<string, string>, status: number) => {
          console.log(
            `[Single Transformer] Status: ${status}, Content-Type: ${headers["content-type"]}`,
          );
          return { price: `${data.value} ${data.unit}` };
        },
      },
    );
    console.log("--- Single Transform Response Example ---");
    console.log("Transformed Data:", transformedData); // Expected: { price: "100 USD" }
  } catch (error) {
    console.error("Error in single transform example:", error);
  }

  // --- Example 2: Array of transformResponse functions ---
  mockFetch.mockResolvedValueOnce(
    new Response(
      JSON.stringify({ user_name: "John Doe", user_id: 123 }),
      {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "application/json" },
      },
    ),
  );

  try {
    const transformedDataArray = await http.post<{ id: number; name: string }>( 
      "/users",
      {},
      {
        transformResponse: [
          (data: { user_name: string; user_id: number }, headers: Record<string, string>, status: number) => {
            console.log(
              `[Array Transformer 1] Status: ${status}, Content-Type: ${headers["content-type"]}`,
            );
            return { id: data.user_id, name: data.user_name.toUpperCase(), original: data };
          },
          (data: { id: number; name: string; original: any }) => {
            console.log(`[Array Transformer 2] Data before: ${JSON.stringify(data.original)}`);
            return { id: data.id, name: `USER_${data.name}` };
          },
        ],
      },
    );
    console.log("\n--- Array Transform Response Example ---");
    console.log("Transformed Data Array:", transformedDataArray); // Expected: { id: 123, name: "USER_JOHN DOE" }
  } catch (error) {
    console.error("Error in array transform example:", error);
  }
}

demonstrateTransformResponse();
