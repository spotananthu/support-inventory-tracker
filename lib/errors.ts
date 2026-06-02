import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const issue of error.issues) {
      details[issue.path.join(".")] = issue.message;
    }
    return apiError("Validation failed", 400, details);
  }

  if (error instanceof Error) {
    console.error(error.message);
  }

  return apiError("Internal server error", 500);
}
