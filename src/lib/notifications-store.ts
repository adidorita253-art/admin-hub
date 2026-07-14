import { useSyncExternalStore } from "react";

export type NotificationChannel = "email" | "sms" | "inapp";

export interface InboxItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  channel: NotificationChannel;
  event: string;
}

const seed: InboxItem[] = [
  { id: "n1", title: "5 applications need your review", body: "Applications for Computer Science attachment placements are waiting for approval.", time: "10 min ago", read: false, channel: "inapp", event: "applications.pending" },
  { id: "n2", title: "Bulk letter generation complete", body: "23 letters generated for the 2025/2026 first semester batch.", time: "1 hour ago", read: false, channel: "inapp", event: "letter.batch" },
  { id: "n3", title: "Company Cellulant approved 3 placements", body: "Placements confirmed for Aisha, Kevin, and Naomi.", time: "3 hours ago", read: true, channel: "inapp", event: "application.approved" },
  { id: "n4", title: "Approval link expired without response", body: "The approval link for Wanjiku Kamau at Kenya Power expired 2 days ago.", time: "Yesterday", read: false, channel: "email", event: "letter.expired" },
  { id: "n5", title: "12 logbook entries unreviewed for 5+ days", body: "Dr. Boateng has a review backlog. Consider re-assigning.", time: "Yesterday", read: true, channel: "inapp", event: "supervisor.backlog" },
];

let state: InboxItem[] = seed.slice();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const notificationsStore = {
  getAll: () => state,
  unreadCount: () => state.reduce((n, i) => (i.read ? n : n + 1), 0),
  markRead: (id: string) => {
    state = state.map((i) => (i.id === id ? { ...i, read: true } : i));
    emit();
  },
  markUnread: (id: string) => {
    state = state.map((i) => (i.id === id ? { ...i, read: false } : i));
    emit();
  },
  markAllRead: () => {
    state = state.map((i) => ({ ...i, read: true }));
    emit();
  },
  add: (item: Omit<InboxItem, "id" | "time" | "read"> & Partial<Pick<InboxItem, "read" | "time">>) => {
    state = [
      {
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: "Just now",
        read: false,
        ...item,
      },
      ...state,
    ];
    emit();
  },
  remove: (id: string) => {
    state = state.filter((i) => i.id !== id);
    emit();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useNotifications() {
  return useSyncExternalStore(
    notificationsStore.subscribe,
    notificationsStore.getAll,
    notificationsStore.getAll,
  );
}

export function useUnreadNotificationCount() {
  useSyncExternalStore(
    notificationsStore.subscribe,
    notificationsStore.getAll,
    notificationsStore.getAll,
  );
  return notificationsStore.unreadCount();
}
