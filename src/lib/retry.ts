export async function callWithRetry<T>(
  func: () => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await func();
    } catch (e: any) {
      if (e?.message?.includes('429') || String(e).includes('429')) {
        const waitMs = (Math.pow(2, attempt) + Math.random()) * 1000;
        console.warn(`Quota exceeded, retrying in ${(waitMs / 1000).toFixed(1)}s...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      } else {
        throw e;
      }
    }
  }
  throw new Error("Retries exhausted");
}
