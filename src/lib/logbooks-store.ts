import { useSyncExternalStore } from "react";
import {
  logbooksSeed,
  type AdminNote,
  type Grade,
  type Logbook,
  type WeekEntry,
} from "./logbooks-data";

let state: Logbook[] = logbooksSeed;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function map(id: string, fn: (lb: Logbook) => Logbook) {
  state = state.map((l) => (l.id === id ? fn(l) : l));
  emit();
}

export interface EditAudit {
  id: string;
  at: string;
  actor: string;
  what: string;
  oldValue: string;
  newValue: string;
  reason: string;
}

let audits: EditAudit[] = [];
const pushAudit = (a: Omit<EditAudit, "id" | "at" | "actor">) => {
  audits = [
    {
      id: `au-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      actor: "Admin User",
      ...a,
    },
    ...audits,
  ];
};

export const logbooksStore = {
  getAll: () => state,
  get: (id: string) => state.find((l) => l.id === id) ?? null,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getAudits: () => audits,

  updateDailyNarrative(
    id: string,
    weekNumber: number,
    day: string,
    text: string,
    reason: string,
  ) {
    map(id, (lb) => ({
      ...lb,
      weeks: lb.weeks.map((w) =>
        w.weekNumber === weekNumber
          ? {
              ...w,
              daily: w.daily.map((d) => {
                if (d.day !== day) return d;
                pushAudit({
                  what: `Week ${weekNumber} ${day} narrative`,
                  oldValue: d.narrative,
                  newValue: text,
                  reason,
                });
                return { ...d, narrative: text };
              }),
            }
          : w,
      ),
    }));
  },

  updateCompanyAssessment(
    id: string,
    weekNumber: number,
    patch: Partial<WeekEntry["company"]>,
    reason: string,
  ) {
    map(id, (lb) => ({
      ...lb,
      weeks: lb.weeks.map((w) => {
        if (w.weekNumber !== weekNumber) return w;
        pushAudit({
          what: `Week ${weekNumber} company assessment`,
          oldValue: JSON.stringify(w.company),
          newValue: JSON.stringify({ ...w.company, ...patch }),
          reason,
        });
        return { ...w, company: { ...w.company, ...patch } };
      }),
    }));
  },

  updateAcademicEndorsement(
    id: string,
    weekNumber: number,
    patch: Partial<WeekEntry["academic"]>,
    reason: string,
  ) {
    map(id, (lb) => ({
      ...lb,
      weeks: lb.weeks.map((w) => {
        if (w.weekNumber !== weekNumber) return w;
        pushAudit({
          what: `Week ${weekNumber} academic endorsement`,
          oldValue: JSON.stringify(w.academic),
          newValue: JSON.stringify({ ...w.academic, ...patch }),
          reason,
        });
        return { ...w, academic: { ...w.academic, ...patch } };
      }),
    }));
  },

  setFinalGrade(id: string, grade: Grade, reason: string) {
    map(id, (lb) => {
      pushAudit({
        what: "Final grade",
        oldValue: lb.finalGrade ?? "—",
        newValue: grade,
        reason,
      });
      return { ...lb, finalGrade: grade };
    });
  },

  addAdminNote(id: string, text: string) {
    const note: AdminNote = {
      id: `an-${Date.now()}`,
      at: new Date().toISOString(),
      author: "Admin User",
      text,
    };
    map(id, (lb) => ({ ...lb, adminNotes: [note, ...lb.adminNotes] }));
  },
};

export function useLogbooks() {
  return useSyncExternalStore(
    logbooksStore.subscribe,
    logbooksStore.getAll,
    logbooksStore.getAll,
  );
}

export function useLogbook(id: string) {
  const all = useLogbooks();
  return all.find((l) => l.id === id) ?? null;
}
