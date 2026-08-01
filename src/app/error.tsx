"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import TextButton from "@/components/ui/TextButton";
import TextCard from "@/components/ui/TextCard";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [timestamp, setTimestamp] = useState<string | undefined>(undefined);
  console.log(error);

  // Extract status code from error (default to 500 if not available)
  const getStatusCode = () => {
    if ("status" in error && typeof error.status === "number") {
      return error.status;
    }
    if ("statusCode" in error && typeof error.statusCode === "number") {
      return error.statusCode;
    }
    return 500;
  };

  // Get error message or name
  const getErrorMessage = () => {
    return error.message || error.name || "Application error";
  };

  const statusCode = getStatusCode();

  useEffect(() => {
    const errorTimestamp = new Date().toISOString();
    setTimestamp(errorTimestamp);

    Sentry.captureException(error, {
      tags: {
        errorBoundary: "app",
        statusCode: statusCode.toString(),
      },
      extra: {
        digest: error.digest,
        timestamp: errorTimestamp,
        statusCode: statusCode,
        errorMessage: getErrorMessage(),
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <PageLayout>
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          {/* Error Status Code */}
          <div className="space-y-4">
            <div className="text-6xl sm:text-8xl font-mono font-bold tracking-wider">
              {statusCode}
            </div>

            {/* Main heading */}
            <h1 className="text-2xl sm:text-3xl emphasis">
              Something Went Wrong
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg max-w-md mx-auto muted">
              An unexpected error occurred. Don't worry, our team has been
              notified. Please try again.
            </p>
          </div>

          {/* Error details card */}
          <TextCard className="text-left">
            <div className="space-y-2">
              <div className="font-mono text-sm flex flex-col sm:block">
                <span className="muted">Error:</span>
                <span className="sm:ml-2">{getErrorMessage()}</span>
              </div>
              <div className="font-mono text-sm flex flex-col sm:block">
                <span className="muted">Status:</span>
                <span className="sm:ml-2">{statusCode}</span>
              </div>
              {error.digest && (
                <div className="font-mono text-sm flex flex-col sm:block">
                  <span className="muted">Error ID:</span>
                  <span className="sm:ml-2">{error.digest}</span>
                </div>
              )}
              {timestamp && (
                <div className="font-mono text-sm flex flex-col sm:block">
                  <span className="muted">Timestamp:</span>
                  <span className="sm:ml-2">{timestamp}</span>
                </div>
              )}
            </div>
          </TextCard>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <TextButton
              onClick={reset}
              variant="default"
              className="w-full sm:w-auto"
            >
              Try Again
            </TextButton>

            <TextButton
              onClick={() => (window.location.href = "/")}
              variant="success"
              className="w-full sm:w-auto"
            >
              Home Page
            </TextButton>
          </div>

          {/* Additional help text */}
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm muted">
              If this error persists, please contact the development team.
            </p>
          </div>
        </div>
      </PageLayout>
    </div>
  );
}
