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
    id: "recruiter-1",
    title: "3 new matching applicants",
    message: "Backend Java Developer has three new candidates above 85% match.",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    read: false,
    tone: "success",
  },
  {
    id: "recruiter-2",
    title: "Assessment deadline today",
    message: "Candidate Nguyen Hoang An will finish the SQL assessment before 17:00.",
    createdAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    read: false,
    tone: "warning",
  },
  {
    id: "recruiter-3",
    title: "Job post awaiting review",
    message: "Senior Product Designer draft is still pending approval from your hiring manager.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    read: true,
    tone: "info",
  },
  {
    id: "recruiter-4",
    title: "Subscription renewal",
    message: "Your recruiter Pro plan will renew in 7 days.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    read: true,
    tone: "default",
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
      name: "web-recruiter-notifications",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
