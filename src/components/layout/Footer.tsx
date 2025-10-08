"use client";

import { useState, useEffect } from "react";

type SystemInfoProps = {
  browser: string;
  device: string;
  os: string;
  network: string;
  memory: string;
  performance: string;
  screenResolution: string;
};

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showSystemInfo, setShowSystemInfo] = useState(false);

  return (
    <>
      <div className="relative mt-8 p-4 text-sm muted border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center items-start gap-4">
          <div className="flex items-center gap-4">
            <span>© {currentYear} All rights reserved by MasterFabric.</span>
          </div>
          <button
            onClick={() => setShowSystemInfo(true)}
            className="border border-black bg-white px-3 py-1 font-mono text-xs hover:bg-black hover:text-white transition-colors flex items-center gap-2"
            title="View System Information"
          >
            <ComputerIcon />
            <span>SYSTEM</span>
          </button>
        </div>
      </div>
      {/* System Info Dialog */}
      {showSystemInfo && (
        <SystemInfoDialog onClose={() => setShowSystemInfo(false)} />
      )}
    </>
  );
}

function ComputerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  );
}

const defaultSystemInfo: SystemInfoProps = {
  browser: "Unknown",
  device: "Unknown",
  os: "Unknown",
  network: "Unknown",
  memory: "Unknown",
  performance: "Unknown",
  screenResolution: "Unknown",
};

function SystemInfoDialog({ onClose }: { onClose: () => void }) {
  // Add keyboard event listener to close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Access system info from localStorage (to be set by the page component)
  const systemInfo: SystemInfoProps =
    typeof window !== "undefined"
      ? (() => {
          try {
            const savedInfo = localStorage.getItem("systemInfo");
            return savedInfo ? JSON.parse(savedInfo) : defaultSystemInfo;
          } catch {
            return defaultSystemInfo;
          }
        })()
      : defaultSystemInfo;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-black p-6 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="font-mono text-lg font-bold uppercase tracking-wide">
              SYSTEM INFORMATION
            </h2>
            <button
              onClick={onClose}
              className="border border-black bg-white px-3 py-1 font-mono text-xs hover:bg-black hover:text-white transition-colors"
            >
              CLOSE
            </button>
          </div>

          {/* System Info Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-mono text-xs text-gray-600 uppercase tracking-wide">
                BROWSER
              </span>
              <span className="font-mono text-sm">{systemInfo.browser}</span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-mono text-xs text-gray-600 uppercase tracking-wide">
                DEVICE
              </span>
              <span className="font-mono text-sm">{systemInfo.device}</span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-mono text-xs text-gray-600 uppercase tracking-wide">
                OPERATING SYSTEM
              </span>
              <span className="font-mono text-sm">{systemInfo.os}</span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-mono text-xs text-gray-600 uppercase tracking-wide">
                NETWORK
              </span>
              <span className="font-mono text-sm">{systemInfo.network}</span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-mono text-xs text-gray-600 uppercase tracking-wide">
                SCREEN RESOLUTION
              </span>
              <span className="font-mono text-sm">
                {systemInfo.screenResolution}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-mono text-xs text-gray-600 uppercase tracking-wide">
                MEMORY
              </span>
              <span className="font-mono text-sm">{systemInfo.memory}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-gray-600 uppercase tracking-wide">
                PERFORMANCE
              </span>
              <span className="font-mono text-sm">
                {systemInfo.performance}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-gray-200">
            <p className="font-mono text-xs text-gray-500 text-center">
              System information collected for debugging and optimization
              purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
