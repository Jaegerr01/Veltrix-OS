/** Minimal structural view of a caught value (Error, AiError, CeoRequestError, plain object, string...). */
export interface ErrorLike {
  name?: string;
  message?: string;
  code?: string;
  hint?: string;
  status?: number;
  statusCode?: number;
  userMessage?: string;
  stack?: string;
  details?: string;
}

/** Narrow an `unknown` catch value without `any`. Objects are returned as-is (so instanceof still works). */
export function asErr(e: unknown): ErrorLike & { message: string } {
  if (typeof e === 'object' && e !== null) {
    const o = e as ErrorLike;
    return typeof o.message === 'string' ? (o as ErrorLike & { message: string }) : Object.assign(Object.create(Object.getPrototypeOf(e)), e, { message: 'Unknown error' });
  }
  return { message: String(e ?? 'Unknown error') };
}
