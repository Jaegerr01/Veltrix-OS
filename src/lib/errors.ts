/** Minimal structural view of a caught value (Error, AiError, CeoRequestError, plain object, string...). */
export interface ErrorLike {
  name?: string;
  message?: string;
  code?: string;
  hint?: string;
  status?: number;
  statusCode?: number;
  userMessage?: string;
}

/** Narrow an `unknown` catch value without `any`. Objects are returned as-is (so instanceof still works). */
export function asErr(e: unknown): ErrorLike {
  if (typeof e === 'object' && e !== null) return e as ErrorLike;
  return { message: String(e ?? 'Unknown error') };
}
