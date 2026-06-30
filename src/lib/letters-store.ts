import { useSyncExternalStore } from "react";
import {
  type Application,
  type LetterStatus,
  findStudent,
  findCompany,
} from "./mock-data";
import { applicationsStore, useApplications } from "./applications-store";

export interface LetterRecord {
  applicationId: string;
  studentId: string;
  studentName: string;
  studentReg: string;
  department: string;
  companyId: string;
  companyName: string;
  companyEmail: string;
  companyAddress: string;
  referenceNumber: string;
  generatedAt: string;
  sentAt: string | null;
  lastResentAt: string | null;
  resentCount: number;
  status: LetterStatus;
  academicYear: string;
  semester: "First" | "Second";
}

interface ExtraLetterState {
  lastResentAt: string | null;
  resentCount: number;
}
let extras: Record<string, ExtraLetterState> = {};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Build a deterministic reference number from app data using a format from settings.
// Example template: KNUST/IA/{YEAR}/{DEPT}/{SEQ}
export function buildReferenceNumber(
  template: string,
  app: Application,
  index: number,
): string {
  const deptCode = app.department
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
  const year = app.academicYear.split("/")[0];
  const seq = (index + 1).toString().padStart(4, "0");
  return template
    .replace("{YEAR}", year)
    .replace("{DEPT}", deptCode)
    .replace("{SEQ}", seq);
}

export const DEFAULT_REF_TEMPLATE = "MUST/IA/{YEAR}/{DEPT}/{SEQ}";

function toRecord(app: Application, index: number): LetterRecord | null {
  if (app.letterStatus === "not_generated") return null;
  const student = findStudent(app.studentId);
  const company = findCompany(app.companyId);
  if (!student) return null;
  const ex = extras[app.id] ?? { lastResentAt: null, resentCount: 0 };
  const generatedEvent =
    app.timeline.find((t) => t.stage === "letter_generated")?.at ??
    app.dateApplied;
  const sentEvent =
    app.timeline.find((t) => t.stage === "letter_sent")?.at ?? null;
  return {
    applicationId: app.id,
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    studentReg: student.regNumber,
    department: app.department,
    companyId: app.companyId,
    companyName: app.companyName,
    companyEmail: company?.email ?? "careers@company.com",
    companyAddress: company
      ? `${company.address}, ${company.city}, ${company.county}`
      : "—",
    referenceNumber: buildReferenceNumber(DEFAULT_REF_TEMPLATE, app, index),
    generatedAt: generatedEvent,
    sentAt: sentEvent,
    lastResentAt: ex.lastResentAt,
    resentCount: ex.resentCount,
    status: app.letterStatus,
    academicYear: app.academicYear,
    semester: app.semester,
  };
}

export function deriveLetters(apps: Application[]): LetterRecord[] {
  return apps
    .map((a, i) => toRecord(a, i))
    .filter((r): r is LetterRecord => r !== null);
}

export const lettersStore = {
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  resend: (applicationIds: string[]) => {
    const now = new Date().toISOString();
    applicationIds.forEach((id) => {
      const prev = extras[id] ?? { lastResentAt: null, resentCount: 0 };
      extras = {
        ...extras,
        [id]: { lastResentAt: now, resentCount: prev.resentCount + 1 },
      };
      // If letter is generated but not yet sent, push it to "sent"
      const app = applicationsStore.get(id);
      if (app && app.letterStatus === "generated") {
        applicationsStore.update(id, { letterStatus: "sent" });
      }
    });
    emit();
  },
};

export function useLetters(): LetterRecord[] {
  const apps = useApplications();
  // subscribe to local extras
  useSyncExternalStore(
    lettersStore.subscribe,
    () => extras,
    () => extras,
  );
  return deriveLetters(apps);
}
