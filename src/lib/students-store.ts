import { useSyncExternalStore } from "react";
import { students as seed, type Student } from "./mock-data";

// Mutate the exported mock array in place so downstream helpers
// (findStudent, applications derivations, letters, logbooks, reports)
// see the same list. We swap the snapshot reference on every change so
// React re-renders subscribers.
let snapshot: Student[] = seed.slice();
const listeners = new Set<() => void>();
const emit = () => {
  snapshot = seed.slice();
  listeners.forEach((l) => l());
};

export const studentsStore = {
  getAll: () => snapshot,
  get: (id: string) => seed.find((s) => s.id === id) ?? null,
  add: (s: Student) => {
    seed.unshift(s);
    emit();
  },
  addMany: (rows: Student[]) => {
    seed.unshift(...rows);
    emit();
  },
  update: (id: string, patch: Partial<Student>) => {
    const i = seed.findIndex((s) => s.id === id);
    if (i >= 0) {
      seed[i] = { ...seed[i], ...patch };
      emit();
    }
  },
  replace: (s: Student) => {
    const i = seed.findIndex((x) => x.id === s.id);
    if (i >= 0) {
      seed[i] = s;
      emit();
    }
  },
  remove: (id: string) => {
    const i = seed.findIndex((s) => s.id === id);
    if (i >= 0) {
      seed.splice(i, 1);
      emit();
    }
  },
  bulkUpdate: (ids: Set<string> | string[], patch: Partial<Student>) => {
    const set = ids instanceof Set ? ids : new Set(ids);
    let changed = false;
    seed.forEach((s, i) => {
      if (set.has(s.id)) {
        seed[i] = { ...s, ...patch };
        changed = true;
      }
    });
    if (changed) emit();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useStudents() {
  return useSyncExternalStore(
    studentsStore.subscribe,
    studentsStore.getAll,
    studentsStore.getAll,
  );
}
