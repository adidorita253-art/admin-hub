import { useSyncExternalStore } from "react";
import { applications as seed, type Application } from "./mock-data";

let state: Application[] = [...seed];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const applicationsStore = {
  getAll: () => state,
  get: (id: string) => state.find((a) => a.id === id) ?? null,
  update: (id: string, patch: Partial<Application>) => {
    state = state.map((a) => (a.id === id ? { ...a, ...patch } : a));
    emit();
  },
  pushTimeline: (id: string, stage: Application["stage"]) => {
    state = state.map((a) =>
      a.id === id
        ? {
            ...a,
            stage,
            timeline: [
              ...a.timeline,
              { stage, at: new Date().toISOString() },
            ],
          }
        : a,
    );
    emit();
  },
  addNote: (id: string, text: string) => {
    state = state.map((a) =>
      a.id === id
        ? {
            ...a,
            notes: [
              ...a.notes,
              {
                id: `n-${Date.now()}`,
                author: "Admin User",
                at: new Date().toISOString(),
                text,
              },
            ],
          }
        : a,
    );
    emit();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useApplications() {
  return useSyncExternalStore(
    applicationsStore.subscribe,
    applicationsStore.getAll,
    applicationsStore.getAll,
  );
}
