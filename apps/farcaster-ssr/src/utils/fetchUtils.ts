import { isFarcasterApiError } from 'farcaster-client-data';

// Custom error to signal HTTP status codes for Pages Router
export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message?: string) {
    super(message ?? `HTTP ${statusCode}`);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export async function fetchAndHandleError<T>(fn: () => Promise<T>): Promise<T> {
  try {
    const result = await fn();
    return result;
  } catch (error) {
    if (isFarcasterApiError(error)) {
      throw new HttpError(error.status ?? 503);
    }
    throw error;
  }
}
