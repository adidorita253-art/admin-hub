import { useSyncExternalStore } from "react";
import { companies as seed, type Company } from "./mock-data";

let snapshot: Company[] = seed.slice();
const listeners = new Set<() => void>();
const emit = () => {
  snapshot = seed.slice();
  listeners.forEach((l) => l());
};

export const companiesStore = {
  getAll: () => snapshot,
  get: (id: string) => seed.find((c) => c.id === id) ?? null,
  add: (c: Company) => {
    seed.unshift(c);
    emit();
  },
  update: (id: string, patch: Partial<Company>) => {
    const i = seed.findIndex((c) => c.id === id);
    if (i >= 0) {
      seed[i] = { ...seed[i], ...patch };
      emit();
    }
  },
  replace: (c: Company) => {
    const i = seed.findIndex((x) => x.id === c.id);
    if (i >= 0) {
      seed[i] = c;
      emit();
    }
  },
  remove: (id: string) => {
    const i = seed.findIndex((c) => c.id === id);
    if (i >= 0) {
      seed.splice(i, 1);
      emit();
    }
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useCompanies() {
  return useSyncExternalStore(
    companiesStore.subscribe,
    companiesStore.getAll,
    companiesStore.getAll,
  );
}
