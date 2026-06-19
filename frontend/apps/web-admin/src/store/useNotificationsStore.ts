import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { NotificationFilter, NotificationItem } from "@smart-cv/ui";

interface NotificationsState {
  filter: NotificationFilter;
  notifications: NotificationItem[];
  setFilter: (filter: NotificationFilter) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const seedNotifications: NotificationItem[] = [
  {
    id: "admin-1",
    title: "2 recruiters pending verification",
    message: "Two new company verification submissions are waiting for admin review.",
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    read: false,
    tone: "warning",
  },
  {
    id: "admin-2",
    title: "AI provider updated",
    message: "Claude fallback model was changed and requires a configuration review.",
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    read: false,
    tone: "info",
  },
  {
    id: "admin-3",
    title: "Job moderation queue cleared",
    message: "All flagged jobs from the previous batch were processed successfully.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    read: true,
    tone: "success",
  },
  {
    id: "admin-4",
    title: "Payment anomaly detected",
    message: "One recruiter invoice failed twice and needs manual follow-up.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    read: true,
    tone: "danger",
  },
];

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      filter: "all",
      notifications: seedNotifications,
      setFilter: (filter) => set({ filter }),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification,
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
        })),
      deleteNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        })),
      clearAll: () => set({ notifications: [] }),
    }),
    {
      name: "web-admin-notifications",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
