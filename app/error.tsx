"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-4">
        <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
        <p className="text-sm text-gray-600">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400">Error ID: {error.digest}</p>
        )}
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
