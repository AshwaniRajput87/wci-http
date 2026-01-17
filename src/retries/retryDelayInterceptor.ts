export const calculateRetryDelay = (
  baseDelayMs: number,
  attempt: number,
): number => {
  return Math.min(
    baseDelayMs * Math.pow(2, attempt) + Math.random() * 100,
    5000 + Math.random() * 100,
  );
};
