import type { ZodSchema } from "zod";

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

/**
 * Shared base for the (currently mocked) domain services.
 * Firebase-specific helpers were dropped for the dummy-data phase; the error
 * handling and Zod validation surface is preserved so services stay consistent.
 */
export abstract class BaseService {
  protected handleError(error: unknown, customMessage: string): never {
    console.error(`${customMessage}:`, error);
    throw new ServiceError(customMessage, undefined, error);
  }

  protected validateInput<T>(data: T, schema: ZodSchema<T>): T {
    try {
      return schema.parse(data);
    } catch (error) {
      this.handleError(error, "Validation failed");
    }
  }
}
