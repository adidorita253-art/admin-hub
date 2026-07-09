import { useSyncExternalStore } from "react";
import {
  SEED_DEPARTMENTS,
  SEED_FACULTIES,
  SEED_PROGRAMMES,
  type DepartmentRecord,
  type FacultyRecord,
  type ProgrammeRecord,
  type ProgrammeType,
} from "./academic-structure";

export type {
  DepartmentRecord,
  FacultyRecord,
  ProgrammeRecord,
  ProgrammeType,
} from "./academic-structure";

export type Semester = "First Semester" | "Second Semester";

export interface AttachmentPeriod {
  academicYear: string;
  semester: Semester;
  startDate: string;
  endDate: string;
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
  faculties: FacultyRecord[];
  departments: DepartmentRecord[];
  programmes: ProgrammeRecord[];
  letterTemplate: LetterTemplate;
  history: HistoryEvent[];
  branding: {
    institutionName: string;
    primaryColor: string;
    qrEnabled: boolean;
    qrBaseUrl: string;
  };
}

let state: SettingsState = {
  attachmentPeriod: {
    academicYear: "2024/2025",
    semester: "Second Semester",
    startDate: "2025-01-13",
    endDate: "2025-04-18",
  },
  faculties: [...SEED_FACULTIES],
  departments: [...SEED_DEPARTMENTS],
  programmes: [...SEED_PROGRAMMES],
  letterTemplate: {
    institutionHeader:
      "HO TECHNICAL UNIVERSITY\nCareer Placement and Counselling\nP.O. Box HP 217, Ho - Ghana\nTel: +233-3620-27803/26456 · Mobile: 024 4979211\nE-mail: industrialliaison@htu.edu.gh · Website: www.htu.edu.gh",
    salutation: "Dear Sir/Madam,",
    subject: "INDUSTRIAL ATTACHMENT FOR HND STUDENTS",
    body: `We wish to introduce {{STUDENT_NAME}}, a level {{LEVEL}} {{PROGRAMME_TYPE}} {{PROGRAMME}} student (ID No. {{STUDENT_ID}}), to you for Industrial Attachment in your organization. Industrial Attachment is mandatory for all students to enable them get hands-on experience in their area of study.

The Industrial Attachment is expected to commence from {{START_DATE}} and end on {{END_DATE}}. It would be appreciated if {{STUDENT_NAME}} is given the opportunity to work in various sections of the organization to gain the required experience.

We hope this opportunity would predispose our student to life in the industry or organization.

For further inquiries, contact us on {{CONTACT_PHONE}} or email us through: {{CONTACT_EMAIL}}.`,
    closing: "Thank you.\n\nYours faithfully,",
    ccLine: "Vice Chancellor, Pro-Vice Chancellor, Registrar",
    signatory: "JOHNSON ABOAGYE",
    signatoryTitle: "(Ag. Director, Career Placement & Counselling)",
    effectiveDate: "2025-01-01",
    version: "v1",
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
    institutionName: "Ho Technical University",
    primaryColor: "#1d4ed8",
    qrEnabled: true,
    qrBaseUrl: "https://attach.htu.edu.gh/a/",
  },
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function logHistory(area: string, summary: string, oldValue?: string, newValue?: string) {
  state = {
    ...state,
    history: [
      {
        id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

  // Faculties
  addFaculty: (name: string, code: string, status: "active" | "inactive" = "active") => {
    state = {
      ...state,
      faculties: [
        ...state.faculties,
        { id: `fac-${Date.now()}`, name, code: code.toUpperCase(), status },
      ],
    };
    logHistory("Faculties", `Added faculty ${name} (${code.toUpperCase()})`);
    emit();
  },
  updateFaculty: (id: string, patch: Partial<FacultyRecord>) => {
    const prev = state.faculties.find((f) => f.id === id);
    state = {
      ...state,
      faculties: state.faculties.map((f) =>
        f.id === id ? { ...f, ...patch, code: patch.code ? patch.code.toUpperCase() : f.code } : f,
      ),
    };
    if (prev) {
      logHistory(
        "Faculties",
        `Updated faculty ${prev.name}`,
        `${prev.name} (${prev.code}) · ${prev.status}`,
        `${patch.name ?? prev.name} (${(patch.code ?? prev.code).toUpperCase()}) · ${patch.status ?? prev.status}`,
      );
    }
    emit();
  },

  // Departments
  addDepartment: (facultyId: string, name: string, code: string, status: "active" | "inactive" = "active") => {
    state = {
      ...state,
      departments: [
        ...state.departments,
        { id: `dep-${Date.now()}`, facultyId, name, code: code.toUpperCase(), status },
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

  // Programmes
  addProgramme: (
    departmentId: string,
    name: string,
    type: ProgrammeType,
    status: "active" | "inactive" = "active",
  ) => {
    const dept = state.departments.find((d) => d.id === departmentId);
    if (!dept) return;
    state = {
      ...state,
      programmes: [
        ...state.programmes,
        {
          id: `prog-${Date.now()}`,
          facultyId: dept.facultyId,
          departmentId,
          name,
          type,
          status,
        },
      ],
    };
    logHistory("Programmes", `Added programme ${name} (${type})`);
    emit();
  },
  updateProgramme: (id: string, patch: Partial<ProgrammeRecord>) => {
    const prev = state.programmes.find((p) => p.id === id);
    state = {
      ...state,
      programmes: state.programmes.map((p) =>
        p.id === id
          ? {
              ...p,
              ...patch,
              facultyId:
                patch.departmentId
                  ? state.departments.find((d) => d.id === patch.departmentId)?.facultyId ?? p.facultyId
                  : patch.facultyId ?? p.facultyId,
            }
          : p,
      ),
    };
    if (prev) {
      logHistory(
        "Programmes",
        `Updated programme ${prev.name}`,
        `${prev.name} (${prev.type}) · ${prev.status}`,
        `${patch.name ?? prev.name} (${patch.type ?? prev.type}) · ${patch.status ?? prev.status}`,
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

export function useActiveFaculties(): FacultyRecord[] {
  const s = useSettings();
  return s.faculties.filter((f) => f.status === "active");
}
export function useActiveDepartments(facultyId?: string | null): DepartmentRecord[] {
  const s = useSettings();
  return s.departments.filter(
    (d) => d.status === "active" && (!facultyId || facultyId === "all" || d.facultyId === facultyId),
  );
}
export function useActiveProgrammes(departmentId?: string | null): ProgrammeRecord[] {
  const s = useSettings();
  return s.programmes.filter(
    (p) =>
      p.status === "active" &&
      (!departmentId || departmentId === "all" || p.departmentId === departmentId),
  );
}
