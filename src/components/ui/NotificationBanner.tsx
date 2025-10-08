"use client";

import { useEffect, useState } from "react";
import TextBadge from "./TextBadge";

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "success" | "warning" | "error";
}

export interface NotificationItem {
  id: string;
  message: string;
  variant?: "default" | "success" | "warning" | "error";
  duration?: number;
  dismissible?: boolean;
  waitForClose?: boolean; // Wait for user to close manually
  actions?: NotificationAction[]; // Max 2 actions
  imageUrl?: string; // Optional image
}

interface NotificationBannerProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  className?: string;
}

export default function NotificationBanner({
  notifications,
  onDismiss,
  className = "",
}: NotificationBannerProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>(
    []
  );
  const [dismissibleNotifications, setDismissibleNotifications] = useState<
    string[]
  >([]);

  useEffect(() => {
    // Add new notifications to visible list
    notifications.forEach((notification) => {
      if (!visibleNotifications.includes(notification.id)) {
        setVisibleNotifications((prev) => [...prev, notification.id]);

        // Handle dismissible state based on initial setting
        if (notification.dismissible === true) {
          setDismissibleNotifications((prev) => [...prev, notification.id]);
        }

        // Auto dismiss if duration is set and not waiting for manual close
        if (
          notification.duration &&
          notification.duration > 0 &&
          !notification.waitForClose
        ) {
          setTimeout(() => {
            handleDismiss(notification.id);
          }, notification.duration);
        }

        // Make dismissible after duration if initially false
        if (
          notification.dismissible === false &&
          notification.duration &&
          notification.duration > 0
        ) {
          setTimeout(() => {
            setDismissibleNotifications((prev) => [...prev, notification.id]);
          }, notification.duration);
        }
      }
    });
  }, [notifications, visibleNotifications]);

  const handleDismiss = (id: string) => {
    setVisibleNotifications((prev) =>
      prev.filter((visibleId) => visibleId !== id)
    );
    setDismissibleNotifications((prev) =>
      prev.filter((visibleId) => visibleId !== id)
    );
    onDismiss(id);
  };

  const handleActionClick = (
    action: NotificationAction,
    notificationId: string
  ) => {
    action.onClick();
    // Optionally dismiss notification after action
    handleDismiss(notificationId);
  };

  const getVariantClasses = (
    variant: NotificationItem["variant"] = "default"
  ) => {
    const classes = {
      default: "border-black bg-white text-black",
      success: "border-green-600 bg-green-50 text-green-800",
      warning: "border-yellow-500 bg-yellow-50 text-yellow-800",
      error: "border-red-600 bg-red-50 text-red-800",
    };
    return classes[variant];
  };

  const getBadgeVariant = (
    variant: NotificationItem["variant"] = "default"
  ) => {
    return variant === "default" ? "muted" : variant;
  };

  const getActionVariantClasses = (
    variant: NotificationAction["variant"] = "default"
  ) => {
    const classes = {
      default:
        "border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white",
      success:
        "border-green-600 text-green-600 hover:bg-green-600 hover:text-white",
      warning:
        "border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white",
      error: "border-red-600 text-red-600 hover:bg-red-600 hover:text-white",
    };
    return classes[variant];
  };

  const getCloseButtonVariantClasses = (
    variant: NotificationItem["variant"] = "default"
  ) => {
    const classes = {
      default: "hover:bg-black hover:text-white",
      success: "hover:bg-green-600 hover:text-white",
      warning: "hover:bg-yellow-500 hover:text-white",
      error: "hover:bg-red-600 hover:text-white",
    };
    return classes[variant];
  };

  if (notifications.length === 0) return null;

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-[9999] 
        pointer-events-none
        flex flex-col gap-3 
        max-w-sm w-full
        ${className}
      `}
    >
      {notifications.map((notification) => {
        const isVisible = visibleNotifications.includes(notification.id);
        const isDismissible = dismissibleNotifications.includes(
          notification.id
        );
        const actions = notification.actions?.slice(0, 2) || []; // Max 2 actions

        return (
          <div
            key={notification.id}
            className={`
              pointer-events-auto
              transform transition-all duration-300 ease-in-out
              ${
                isVisible
                  ? "translate-x-0 opacity-100 scale-100"
                  : "translate-x-full opacity-0 scale-95"
              }
              border font-mono text-sm
              p-4 shadow-lg backdrop-blur-sm
              ${getVariantClasses(notification.variant)}
            `}
          >
            <div className="flex items-start gap-3">
              {/* Optional Image */}
              {notification.imageUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={notification.imageUrl}
                    alt="Notification"
                    className="w-12 h-12 object-cover border border-current rounded"
                    onError={(e) => {
                      // Hide image if it fails to load
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Badge and Close Button Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <TextBadge
                    variant={getBadgeVariant(notification.variant)}
                    className="text-xs"
                  >
                    {(notification.variant || "info").toUpperCase()}
                    {!isDismissible && " • LOCKED"}
                  </TextBadge>

                  {isDismissible && (
                    <button
                      onClick={() => handleDismiss(notification.id)}
                      className={`
                        w-5 h-5 flex items-center justify-center
                        text-current opacity-60 hover:opacity-100
                        transition-all duration-200
                        font-mono text-xs font-bold
                        border border-current
                        flex-shrink-0
                        ${getCloseButtonVariantClasses(notification.variant)}
                      `}
                      aria-label="Dismiss notification"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Message */}
                <div className="text-sm leading-relaxed break-words mb-3">
                  {notification.message}
                </div>

                {/* Action Buttons */}
                {actions.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          handleActionClick(action, notification.id)
                        }
                        className={`
                          px-3 py-1 text-xs font-mono font-medium
                          border transition-colors duration-200
                          ${getActionVariantClasses(action.variant)}
                        `}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
