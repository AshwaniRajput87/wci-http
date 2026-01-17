export const createTimeoutController = (
  timeoutMs?: number,
  userSignal?: AbortSignal,
) => {
  if (!timeoutMs) {
    return { signal: userSignal, clear: () => {} };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (userSignal) {
    userSignal.addEventListener("abort", () => controller.abort());
  }

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
};
