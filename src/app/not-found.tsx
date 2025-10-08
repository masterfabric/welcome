"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import TextButton from "@/components/ui/TextButton";
import TextCard from "@/components/ui/TextCard";

export default function NotFound() {
  const router = useRouter();
  const [timestamp, setTimestamp] = useState<string | undefined>(undefined);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);

  useEffect(() => {
    setTimestamp(new Date().toISOString());

    // Check if there's browser history to go back to
    setCanGoBack(window.history.length > 1);
  }, []);

  const handleGoBack = () => {
    if (canGoBack) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleGoHome = () => {
    router.replace("/");
  };

  return (
    <div className="min-h-screen flex items-end justify-center bg-white">
      <PageLayout>
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          {/* 404 Number */}
          <div className="space-y-4">
            <div className="text-6xl sm:text-8xl font-mono font-bold tracking-wider">
              404
            </div>

            {/* Main heading */}
            <h1 className="text-2xl sm:text-3xl emphasis">Page Not Found</h1>

            {/* Description */}
            <p className="text-base sm:text-lg max-w-md mx-auto muted">
              The page you're looking for doesn't exist or has been moved. Let's
              get you back on track.
            </p>
          </div>

          {/* Error details card */}
          <TextCard className="text-left">
            <div className="space-y-2">
              <div className="font-mono text-sm flex flex-col sm:block">
                <span className="muted">Error:</span>
                <span className="sm:ml-2">Resource not found</span>
              </div>
              <div className="font-mono text-sm flex flex-col sm:block">
                <span className="muted">Status:</span>
                <span className="sm:ml-2">404</span>
              </div>
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
              onClick={handleGoBack}
              variant="default"
              className="w-full sm:w-auto"
            >
              {canGoBack ? "Go Back" : "Go Home"}
            </TextButton>

            <TextButton
              onClick={handleGoHome}
              variant="success"
              className="w-full sm:w-auto"
            >
              Home Page
            </TextButton>
          </div>

          {/* Additional help text */}
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm muted">
              If you believe this is an error, please contact the development
              team.
            </p>
          </div>
        </div>
      </PageLayout>
    </div>
  );
}
