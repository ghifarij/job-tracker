import type { ErrorRequestHandler, RequestHandler } from "express";
import { z } from "zod";

// Thrown by routes and middleware for an expected failure (401, 404, ...).
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFoundHandler: RequestHandler = () => {
  throw new HttpError(404, "Not found");
};

// Express 5 passes errors thrown in async handlers here, so routes need no
// try/catch. Every error leaves in one shape: { error: { message, fields? } }.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    res.status(400).json({
      error: {
        message: "Invalid request",
        fields: z.flattenError(err).fieldErrors,
      },
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }

  // express.json() rejects a malformed or oversized body with its own 4xx.
  const status = (err as { status?: unknown }).status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    res.status(status).json({ error: { message: "Invalid request body" } });
    return;
  }

  // Anything else is a bug or an outage: log it, and don't leak the details.
  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
};
