/** Newline-delimited JSON stream response. `run` receives `send` and must resolve when finished. */
export function ndjsonResponse(run: (send: (event: unknown) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(event) + '\n')); } catch { /* client went away */ }
      };
      try {
        await run(send);
      } catch (e: any) {
        send({ type: 'error', error: { code: 'ERROR', message: String(e?.message || e).slice(0, 300) } });
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
