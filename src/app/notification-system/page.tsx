"use client";

import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import TextButton from "@/components/ui/TextButton";
import TextCard from "@/components/ui/TextCard";
import { useNotify } from "@/context/NotificationContext";

export default function NotificationSystemPreview() {
  const [message, setMessage] = useState(
    "Welcome to the enhanced notification system!"
  );
  const [imageUrl, setImageUrl] = useState(
    "https://www.masterfabric.co/assets/masterfabric-logo.svg"
  );
  const notify = useNotify();

  // Basic Notifications
  const showSuccessNotification = () => {
    notify.success(message, { duration: 4000 });
  };

  const showErrorNotification = () => {
    notify.error(message, { duration: 5000 });
  };

  const showWarningNotification = () => {
    notify.warning(message, { duration: 4000 });
  };

  const showInfoNotification = () => {
    notify.info(message, { duration: 6000 });
  };

  // Wait for Close Feature
  const showWaitForCloseNotification = () => {
    notify.warning(
      "This notification waits for manual close - no auto-dismiss!",
      {
        waitForClose: true,
        dismissible: true,
      }
    );
  };

  const showNonDismissibleWaitForClose = () => {
    notify.error("Critical alert! Must wait 10 seconds before dismissible", {
      waitForClose: true,
      dismissible: false,
      duration: 10000, // After 10 seconds, it becomes dismissible
    });

    // Make it dismissible after 10 seconds
    setTimeout(() => {
      notify.warning("Now you can close the previous notification!", {
        duration: 3000,
      });
    }, 10000);
  };

  // Action Buttons Feature
  const showNotificationWithActions = () => {
    notify.success(
      "File uploaded successfully! What would you like to do next?",
      {
        duration: 0, // Persistent until action taken
        actions: [
          {
            label: "View File",
            onClick: () => {
              notify.info("Opening file viewer...", { duration: 2000 });
            },
            variant: "success",
          },
          {
            label: "Share",
            onClick: () => {
              notify.info("Opening share dialog...", { duration: 2000 });
            },
            variant: "default",
          },
        ],
      }
    );
  };

  const showErrorWithActions = () => {
    notify.error("Failed to save changes. Connection lost.", {
      waitForClose: true,
      actions: [
        {
          label: "Retry",
          onClick: () => {
            notify.warning("Retrying save operation...", { duration: 3000 });
          },
          variant: "warning",
        },
        {
          label: "Save Local",
          onClick: () => {
            notify.success("Saved to local storage!", { duration: 2000 });
          },
          variant: "success",
        },
      ],
    });
  };

  // Image Feature
  const showNotificationWithImage = () => {
    notify.info(message, {
      duration: 8000,
      imageUrl: imageUrl || undefined,
      actions: [
        {
          label: "Like",
          onClick: () => notify.success("Liked! ❤️", { duration: 2000 }),
          variant: "success",
        },
      ],
    });
  };

  const showUserNotificationWithImage = () => {
    notify.success("John Doe mentioned you in a comment", {
      duration: 0,
      imageUrl: "https://www.masterfabric.co/assets/masterfabric-logo.svg",
      actions: [
        {
          label: "Reply",
          onClick: () =>
            notify.info("Opening reply dialog...", { duration: 2000 }),
          variant: "default",
        },
        {
          label: "View",
          onClick: () =>
            notify.info("Opening comment thread...", { duration: 2000 }),
          variant: "success",
        },
      ],
    });
  };

  // Complex Examples
  const showComplexNotification = () => {
    notify.warning("System maintenance in 5 minutes", {
      waitForClose: true,
      imageUrl: "https://www.masterfabric.co/assets/masterfabric-logo.svg",
      actions: [
        {
          label: "Postpone",
          onClick: () => {
            notify.success("Maintenance postponed by 30 minutes", {
              duration: 3000,
            });
          },
          variant: "warning",
        },
        {
          label: "Proceed",
          onClick: () => {
            notify.error("Maintenance started. System going offline...", {
              duration: 5000,
              waitForClose: true,
            });
          },
          variant: "error",
        },
      ],
    });
  };

  const showMultipleNotifications = () => {
    notify.success("Processing started...", { duration: 2000 });

    setTimeout(() => {
      notify.warning("Processing 50% complete...", {
        duration: 2000,
        imageUrl: "https://www.masterfabric.co/assets/masterfabric-logo.svg",
      });
    }, 1000);

    setTimeout(() => {
      notify.success("Processing completed!", {
        duration: 5000,
        imageUrl: "https://www.masterfabric.co/assets/masterfabric-logo.svg",
        actions: [
          {
            label: "View Results",
            onClick: () =>
              notify.info("Opening results...", { duration: 2000 }),
            variant: "success",
          },
        ],
      });
    }, 3000);
  };

  return (
    <PageLayout>
      <div className="container mx-auto p-6 max-w-5xl">
        <TextCard title="🔔 Notification System Preview" className="mb-8">
          <p className="mb-4">
            Test the enhanced dynamic notification system with new features:
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside opacity-75">
            <li>
              <strong>Wait for Close:</strong> Notifications that require manual
              dismissal
            </li>
            <li>
              <strong>Action Buttons:</strong> Up to 2 interactive buttons per
              notification
            </li>
            <li>
              <strong>Images:</strong> Optional images in notifications
            </li>
            <li>
              <strong>Enhanced Timing:</strong> Better control over auto-dismiss
              behavior
            </li>
          </ul>
        </TextCard>

        {/* Custom Message Input */}
        <TextCard title="✏️ Custom Message & Image" className="mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Notification Message:
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 border border-black font-mono text-sm resize-vertical min-h-[80px]"
                placeholder="Enter your notification message here..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Image URL (optional):
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full p-3 border border-black font-mono text-sm"
                placeholder="https://example.com/image.jpg"
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                <button
                  onClick={() =>
                    setImageUrl(
                      "https://www.masterfabric.co/assets/masterfabric-logo.svg"
                    )
                  }
                  className="px-2 py-1 text-xs border border-gray-400 hover:bg-gray-100"
                >
                  MasterFabric Logo
                </button>
                <button
                  onClick={() => setImageUrl("")}
                  className="px-2 py-1 text-xs border border-gray-400 hover:bg-gray-100"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </TextCard>

        {/* Basic Notifications */}
        <TextCard title="📌 Basic Notifications" className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TextButton variant="success" onClick={showSuccessNotification}>
              Success
            </TextButton>
            <TextButton variant="error" onClick={showErrorNotification}>
              Error
            </TextButton>
            <TextButton variant="warning" onClick={showWarningNotification}>
              Warning
            </TextButton>
            <TextButton variant="default" onClick={showInfoNotification}>
              Info
            </TextButton>
          </div>
        </TextCard>

        {/* Wait for Close Feature */}
        <TextCard title="⏱️ Wait for Close Feature" className="mb-6">
          <div className="space-y-3">
            <p className="text-sm opacity-75 mb-4">
              Notifications that don't auto-dismiss and require manual action:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextButton
                variant="warning"
                onClick={showWaitForCloseNotification}
                className="w-full"
              >
                Manual Close Required
              </TextButton>
              <TextButton
                variant="error"
                onClick={showNonDismissibleWaitForClose}
                className="w-full"
              >
                Timed Non-Dismissible
              </TextButton>
            </div>
          </div>
        </TextCard>

        {/* Action Buttons Feature */}
        <TextCard title="🎯 Action Buttons Feature" className="mb-6">
          <div className="space-y-3">
            <p className="text-sm opacity-75 mb-4">
              Notifications with interactive action buttons (max 2):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextButton
                variant="success"
                onClick={showNotificationWithActions}
                className="w-full"
              >
                Success with Actions
              </TextButton>
              <TextButton
                variant="error"
                onClick={showErrorWithActions}
                className="w-full"
              >
                Error with Actions
              </TextButton>
            </div>
          </div>
        </TextCard>

        {/* Image Feature */}
        <TextCard title="🖼️ Image Feature" className="mb-6">
          <div className="space-y-3">
            <p className="text-sm opacity-75 mb-4">
              Notifications with optional images:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextButton
                variant="default"
                onClick={showNotificationWithImage}
                className="w-full"
              >
                Custom Image
              </TextButton>
              <TextButton
                variant="success"
                onClick={showUserNotificationWithImage}
                className="w-full"
              >
                User Mention
              </TextButton>
            </div>
          </div>
        </TextCard>

        {/* Complex Examples */}
        <TextCard title="🚀 Complex Examples" className="mb-6">
          <div className="space-y-3">
            <p className="text-sm opacity-75 mb-4">
              Advanced combinations of all features:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextButton
                variant="warning"
                onClick={showComplexNotification}
                className="w-full"
              >
                System Maintenance
              </TextButton>
              <TextButton
                variant="default"
                onClick={showMultipleNotifications}
                className="w-full"
              >
                Progress Sequence
              </TextButton>
            </div>
          </div>
        </TextCard>

        {/* Feature Summary */}
        <TextCard title="✨ All Features" variant="muted">
          <div className="text-sm space-y-2">
            <p>
              <strong>✅ Fixed Positioning:</strong> Bottom-right corner, always
              visible
            </p>
            <p>
              <strong>🎨 Variant Support:</strong> Success, Error, Warning, Info
              styles
            </p>
            <p>
              <strong>⏱️ Auto-Dismiss:</strong> Configurable duration (default 5
              seconds)
            </p>
            <p>
              <strong>🔒 Wait for Close:</strong> Force manual dismissal, ignore
              auto-timing
            </p>
            <p>
              <strong>🎭 Manual Dismiss:</strong> Click × button to close
              manually
            </p>
            <p>
              <strong>🎯 Action Buttons:</strong> Up to 2 interactive buttons
              per notification
            </p>
            <p>
              <strong>🖼️ Images:</strong> Optional images with error handling
            </p>
            <p>
              <strong>🔄 Smooth Animations:</strong> Slide-in/out transitions
            </p>
            <p>
              <strong>📚 Stacking:</strong> Multiple notifications stack
              vertically
            </p>
            <p>
              <strong>📱 Responsive:</strong> Works on all screen sizes
            </p>
            <p>
              <strong>🎪 Global Context:</strong> Available throughout the app
            </p>
          </div>
        </TextCard>
      </div>
    </PageLayout>
  );
}
