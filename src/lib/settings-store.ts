import { useSyncExternalStore } from "react";
import { DEPARTMENTS } from "./mock-data";

export type Semester = "First Semester" | "Second Semester";

export interface AttachmentPeriod {
  academicYear: string;
  semester: Semester;
  startDate: string;
  endDate: string;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
}

export interface LetterTemplate {
  institutionHeader: string;
  salutation: string;
  subject: string;
  body: string;
  closing: string;
  ccLine: string;
  signatory: string;
  signatoryTitle: string;
  effectiveDate: string;
  version: string;
  changeNote?: string;
}

export interface HistoryEvent {
  id: string;
  at: string;
  actor: string;
  area: string;
  summary: string;
  oldValue?: string;
  newValue?: string;
}

export interface SettingsState {
  attachmentPeriod: AttachmentPeriod;
  departments: DepartmentRecord[];
  letterTemplate: LetterTemplate;
  history: HistoryEvent[];
  branding: {
    institutionName: string;
    primaryColor: string;
    qrEnabled: boolean;
    qrBaseUrl: string;
  };
}

const DEFAULT_DEPTS: DepartmentRecord[] = [
  { name: "Computer Science", code: "CS" },
  { name: "Information Technology", code: "IT" },
  { name: "Engineering", code: "ENG" },
  { name: "Accounting", code: "ACC" },
  { name: "Hospitality Management", code: "HOS" },
  { name: "Art and Design", code: "ART" },
  { name: "Business Administration", code: "BUS" },
  ...DEPARTMENTS.filter(
    (d) =>
      ![
        "Computer Science",
        "Information Technology",
        "Business Administration",
      ].includes(d),
  ).map((d) => ({
    name: d,
    code: d
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 5),
  })),
].map((d, i) => ({
  id: `dept-${i + 1}`,
  name: d.name,
  code: d.code,
  status: "active" as const,
}));

let state: SettingsState = {
  attachmentPeriod: {
    academicYear: "2024/2025",
    semester: "Second Semester",
    startDate: "2025-01-13",
    endDate: "2025-04-18",
  },
  departments: DEFAULT_DEPTS,
  letterTemplate: {
    institutionHeader:
      "MERU UNIVERSITY OF SCIENCE AND TECHNOLOGY\nP.O. Box 972-60200, Meru, Kenya\nTel: +254 700 000 000 · Email: registrar@must.ac.ke",
    body: `Dear {{COMPANY_NAME}},

This letter introduces {{STUDENT_NAME}} (Reg. No: {{STUDENT_REG}}), a {{YEAR_OF_STUDY}} student in the Department of {{DEPARTMENT}} at our institution. The student is required to undertake an Industrial Attachment from {{START_DATE}} to {{END_DATE}}.

We kindly request you to consider {{STUDENT_NAME}} for placement at {{COMPANY_NAME}}. The student will be supervised by {{ACADEMIC_SUPERVISOR}} from our institution.

To confirm acceptance, please scan the QR code on this letter or visit the approval link sent to your official email.

Yours faithfully,

{{SIGNATORY}}
{{SIGNATORY_TITLE}}`,
    signatory: "Dr. Jane Mwangi",
    signatoryTitle: "Director, Industrial Attachment",
  },
  history: [
    {
      id: "h-1",
      at: new Date(Date.now() - 86400000 * 3).toISOString(),
      actor: "Admin User",
      area: "Attachment Period",
      summary: "Set attachment period dates",
    },
  ],
  branding: {
    institutionName: "Meru University of Science and Technology",
    primaryColor: "#1d4ed8",
    qrEnabled: true,
    qrBaseUrl: "https://approve.must.ac.ke/a/",
  },
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function logHistory(area: string, summary: string, oldValue?: string, newValue?: string) {
  state = {
    ...state,
    history: [
      {
        id: `h-${Date.now()}`,
        at: new Date().toISOString(),
        actor: "Admin User",
        area,
        summary,
        oldValue,
        newValue,
      },
      ...state.history,
    ],
  };
}

export const settingsStore = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  setAttachmentPeriod: (p: AttachmentPeriod) => {
    const prev = state.attachmentPeriod;
    state = { ...state, attachmentPeriod: p };
    logHistory(
      "Attachment Period",
      "Updated attachment period",
      `${prev.academicYear} ${prev.semester} · ${prev.startDate} → ${prev.endDate}`,
      `${p.academicYear} ${p.semester} · ${p.startDate} → ${p.endDate}`,
    );
    emit();
  },
  addDepartment: (name: string, code: string, status: "active" | "inactive" = "active") => {
    state = {
      ...state,
      departments: [
        ...state.departments,
        { id: `dept-${Date.now()}`, name, code: code.toUpperCase(), status },
      ],
    };
    logHistory("Departments", `Added department ${name} (${code.toUpperCase()})`);
    emit();
  },
  updateDepartment: (id: string, patch: Partial<DepartmentRecord>) => {
    const prev = state.departments.find((d) => d.id === id);
    state = {
      ...state,
      departments: state.departments.map((d) =>
        d.id === id ? { ...d, ...patch, code: patch.code ? patch.code.toUpperCase() : d.code } : d,
      ),
    };
    if (prev) {
      logHistory(
        "Departments",
        `Updated department ${prev.name}`,
        `${prev.name} (${prev.code}) · ${prev.status}`,
        `${patch.name ?? prev.name} (${(patch.code ?? prev.code).toUpperCase()}) · ${patch.status ?? prev.status}`,
      );
    }
    emit();
  },
  setLetterTemplate: (t: LetterTemplate) => {
    state = { ...state, letterTemplate: t };
    logHistory("Letter Template", "Updated letter template");
    emit();
  },
  setBranding: (b: SettingsState["branding"]) => {
    state = { ...state, branding: b };
    logHistory("Branding & QR", "Updated branding settings");
    emit();
  },
};

export function useSettings(): SettingsState {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.get, settingsStore.get);
}

export function useActiveDepartments(): DepartmentRecord[] {
  const s = useSettings();
  return s.departments.filter((d) => d.status === "active");
}
