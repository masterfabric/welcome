"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
} from "react";
import NotificationBanner, {
  NotificationAction,
  NotificationItem,
} from "@/components/ui/NotificationBanner";

interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (
    message: string,
    options?: Partial<NotificationItem>
  ) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback(
    (message: string, options?: Partial<NotificationItem>): string => {
      const id = `notification-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const notification: NotificationItem = {
        id,
        message,
        variant: "default",
        duration: 5000, // 5 seconds default
        dismissible: true,
        ...options,
      };

      setNotifications((prev) => [...prev, notification]);
      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const notificationState = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}
      <NotificationBanner
        notifications={notifications}
        onDismiss={removeNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
}

interface NotificationOptions {
  duration?: number;
  dismissible?: boolean;
  waitForClose?: boolean;
  actions?: NotificationAction[];
  imageUrl?: string;
}

// Convenience hook for easy access to common notification methods
export function useNotify() {
  const { addNotification } = useNotificationContext();

  return {
    success: (message: string, options?: NotificationOptions) =>
      addNotification(message, { variant: "success", ...options }),

    error: (message: string, options?: NotificationOptions) =>
      addNotification(message, { variant: "error", ...options }),

    warning: (message: string, options?: NotificationOptions) =>
      addNotification(message, { variant: "warning", ...options }),

    info: (message: string, options?: NotificationOptions) =>
      addNotification(message, { variant: "default", ...options }),

    custom: addNotification,
  };
}
