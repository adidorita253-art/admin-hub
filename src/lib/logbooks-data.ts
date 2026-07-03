// Logbook mock data generator. Derived from students who are on active or
// completed attachment. Frontend-only; wired to a small store in
// src/lib/logbooks-store.ts

import {
  students,
  findAcademicSupervisor,
  findCompanySupervisor,
  type Student,
} from "./mock-data";

export type Grade = "A+" | "A" | "B+" | "B" | "C+" | "C" | "D+" | "D" | "F";
export const GRADES: Grade[] = ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "F"];

export type CompanyEndorseStatus = "pending" | "endorsed" | "flagged";
export type AcademicEndorseStatus =
  | "pending"
  | "endorsed"
  | "revision_requested"
  | "flagged";

export type LogbookStatus =
  | "active"
  | "overdue"
  | "under_review"
  | "revision_requested"
  | "completed"
  | "incomplete";

export const LOGBOOK_STATUS_LABEL: Record<LogbookStatus, string> = {
  active: "Active",
  overdue: "Overdue",
  under_review: "Under Review",
  revision_requested: "Revision Requested",
  completed: "Completed",
  incomplete: "Incomplete",
};

export interface DailyEntry {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
  date: string;
  submittedAt: string | null;
  narrative: string;
  hoursWorked: number;
  attachments: { name: string; kind: "pdf" | "image" | "doc" }[];
}

export interface CompanyAssessment {
  attendance: Grade;
  discipline: Grade;
  punctuality: Grade;
  workOnSchedule: Grade;
  workUnderPressure: Grade;
  generalAptitude: Grade;
  section: string;
  comments: string;
  endorsedByName: string;
  endorsedByPosition: string;
  endorsedAt: string | null;
  status: CompanyEndorseStatus;
}

export interface AcademicEndorsement {
  status: AcademicEndorseStatus;
  comments: string;
  endorsedByName: string;
  endorsedAt: string | null;
  revisionThread: { at: string; author: string; text: string }[];
}

export interface WeekEntry {
  weekNumber: number;
  startDate: string; // Monday
  endDate: string; // Friday
  daily: DailyEntry[];
  monthlySkills: string | null; // weeks 4, 8, 12
  company: CompanyAssessment;
  academic: AcademicEndorsement;
}

export interface FinalReport {
  submittedAt: string | null;
  text: string;
  academicStatus: AcademicEndorseStatus;
  academicComments: string;
}

export interface AdminNote {
  id: string;
  at: string;
  author: string;
  text: string;
}

export interface Logbook {
  id: string;
  studentId: string;
  attachmentStart: string;
  attachmentEnd: string;
  academicYear: string;
  semester: "First" | "Second";
  totalWeeks: number;
  weeks: WeekEntry[];
  finalReport: FinalReport;
  finalGrade: Grade | null;
  adminNotes: AdminNote[];
}

// --- generators ---
const NARRATIVES = [
  "Shadowed the network operations team; documented the incident triage flow and helped tag two P3 alerts.",
  "Assisted in unit testing the account onboarding module. Wrote 4 new Jest tests and fixed a null-check bug.",
  "Attended sprint planning; picked up two frontend tickets on the customer dashboard and scoped them.",
  "Deployed a staging build with the DevOps engineer. Learnt how the CI pipeline promotes artifacts.",
  "Sat in on client call for the loan disbursement project. Took minutes and drafted the follow-up email.",
  "Reviewed pull requests with my supervisor and left two comments on error handling.",
  "Ran through the customer KYC dataset in Excel; produced a pivot summary of missing fields by region.",
  "Paired with a senior engineer to trace a production latency spike; identified a slow SQL join.",
  "Prepared a short presentation on the week's findings and delivered it in the Friday team huddle.",
];

const SKILL_REFLECTIONS = [
  "Improved my SQL comfort — CTEs and window functions no longer feel foreign. I can now write a monthly revenue rollup end-to-end.",
  "Learnt to run a proper stand-up, write meeting minutes, and follow up on action items without prompting.",
  "Sharpened my debugging: I now go log → hypothesis → smallest reproduction, instead of guessing.",
];

const SECTIONS = [
  "Software Engineering",
  "Network Operations",
  "Data & Analytics",
  "Product",
  "Finance Ops",
  "Human Resources",
];

const pick = <T,>(arr: readonly T[], i: number) => arr[i % arr.length];

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function mondayOf(iso: string) {
  const d = new Date(iso);
  const day = d.getDay(); // 0 Sun..6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function buildWeek(
  weekNumber: number,
  monday: string,
  student: Student,
  seed: number,
  weeksCompleted: number,
): WeekEntry {
  const isPast = weekNumber <= weeksCompleted;
  const isCurrent = weekNumber === weeksCompleted + 1;
  const days: DailyEntry["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const daily: DailyEntry[] = days.map((day, di) => {
    const date = addDays(monday, di);
    const submitted = isPast || (isCurrent && di < 3);
    return {
      day,
      date,
      submittedAt: submitted ? addDays(date, 0) : null,
      narrative: submitted ? pick(NARRATIVES, seed + weekNumber + di) : "",
      hoursWorked: submitted ? 6 + ((seed + di) % 3) : 0,
      attachments:
        submitted && di === 2
          ? [{ name: `week${weekNumber}-notes.pdf`, kind: "pdf" }]
          : [],
    };
  });

  const compSup = findCompanySupervisor(student.companySupervisorId);
  const acadSup = findAcademicSupervisor(student.academicSupervisorId);

  // Endorsement rolling — older weeks fully endorsed, recent ones partial.
  let companyStatus: CompanyEndorseStatus = "pending";
  let academicStatus: AcademicEndorseStatus = "pending";
  if (isPast) {
    const gap = weeksCompleted - weekNumber;
    if (gap >= 2) {
      companyStatus = "endorsed";
      academicStatus = "endorsed";
    } else if (gap === 1) {
      companyStatus = "endorsed";
      academicStatus = seed % 3 === 0 ? "revision_requested" : "endorsed";
    } else {
      companyStatus = seed % 4 === 0 ? "pending" : "endorsed";
      academicStatus = "pending";
    }
  }

  const g = (offset: number): Grade => GRADES[(seed + offset) % 4]; // A+..B
  const company: CompanyAssessment = {
    attendance: g(1),
    discipline: g(2),
    punctuality: g(3),
    workOnSchedule: g(4),
    workUnderPressure: g(5),
    generalAptitude: g(6),
    section: pick(SECTIONS, seed + weekNumber),
    comments:
      companyStatus === "endorsed"
        ? "Attentive and eager. Contributed meaningfully to the week's deliverables."
        : "",
    endorsedByName: compSup ? `${compSup.firstName} ${compSup.lastName}` : "—",
    endorsedByPosition: compSup?.jobTitle ?? "Supervisor",
    endorsedAt: companyStatus === "endorsed" ? addDays(monday, 5) : null,
    status: companyStatus,
  };

  const academic: AcademicEndorsement = {
    status: academicStatus,
    comments:
      academicStatus === "endorsed"
        ? "Good week. Continue documenting technical decisions."
        : academicStatus === "revision_requested"
          ? "Please expand Thursday's entry — describe the debugging steps in more detail."
          : "",
    endorsedByName: acadSup ? `${acadSup.title} ${acadSup.lastName}` : "—",
    endorsedAt:
      academicStatus === "endorsed" || academicStatus === "revision_requested"
        ? addDays(monday, 6)
        : null,
    revisionThread:
      academicStatus === "revision_requested"
        ? [
            {
              at: addDays(monday, 6),
              author: acadSup
                ? `${acadSup.title} ${acadSup.lastName}`
                : "Supervisor",
              text: "Please expand Thursday's entry.",
            },
          ]
        : [],
  };

  return {
    weekNumber,
    startDate: monday,
    endDate: addDays(monday, 4),
    daily,
    monthlySkills:
      weekNumber % 4 === 0 && isPast
        ? pick(SKILL_REFLECTIONS, seed + weekNumber)
        : null,
    company,
    academic,
  };
}

function buildLogbook(student: Student, seed: number): Logbook {
  const totalWeeks = 12;
  const startISO = student.startDate ?? new Date().toISOString();
  const endISO = student.endDate ?? addDays(startISO, 12 * 7);
  const isCompleted = student.attachmentStatus === "completed";
  // completed => 12 weeks fully done. ongoing => 5..11 weeks done, with a
  // small number overdue so alerts have real data.
  const overdueSeed = seed % 7 === 0;
  const weeksCompleted = isCompleted
    ? 12
    : overdueSeed
      ? 4
      : 5 + (seed % 7);

  const firstMonday = mondayOf(startISO);
  const weeks: WeekEntry[] = Array.from({ length: totalWeeks }, (_, i) =>
    buildWeek(i + 1, addDays(firstMonday, i * 7), student, seed, weeksCompleted),
  );

  const finalReport: FinalReport = {
    submittedAt: isCompleted ? addDays(firstMonday, 12 * 7) : null,
    text: isCompleted
      ? "This attachment gave me end-to-end exposure to a real engineering workflow, from sprint planning to production monitoring. My most valuable growth was in writing SQL against messy operational data and in communicating trade-offs during code review."
      : "",
    academicStatus: isCompleted ? "endorsed" : "pending",
    academicComments: isCompleted
      ? "Comprehensive report. Reflection on trade-offs is particularly strong."
      : "",
  };

  return {
    id: `lb-${student.id}`,
    studentId: student.id,
    attachmentStart: startISO,
    attachmentEnd: endISO,
    academicYear: "2025/2026",
    semester: "Second",
    totalWeeks,
    weeks,
    finalReport,
    finalGrade: isCompleted ? (GRADES[seed % 6] as Grade) : null,
    adminNotes: [],
  };
}

export const logbooksSeed: Logbook[] = students
  .filter(
    (s) =>
      s.attachmentStatus === "ongoing" || s.attachmentStatus === "completed",
  )
  .map((s, i) => buildLogbook(s, i + 1));

// --- derived helpers ---
export function weeksEndorsed(lb: Logbook): number {
  return lb.weeks.filter(
    (w) => w.company.status === "endorsed" && w.academic.status === "endorsed",
  ).length;
}

export function lastSubmissionISO(lb: Logbook): string | null {
  let latest: string | null = null;
  for (const w of lb.weeks) {
    for (const d of w.daily) {
      if (d.submittedAt && (!latest || d.submittedAt > latest)) {
        latest = d.submittedAt;
      }
    }
  }
  return latest;
}

export function daysSinceLastSubmission(lb: Logbook): number | null {
  const last = lastSubmissionISO(lb);
  if (!last) return null;
  return Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
}

export function pendingEndorsementCount(lb: Logbook): number {
  return lb.weeks.filter(
    (w) =>
      w.daily.some((d) => d.submittedAt) &&
      (w.company.status === "pending" || w.academic.status === "pending"),
  ).length;
}

export function deriveStatus(lb: Logbook): LogbookStatus {
  const finalDone =
    lb.finalReport.academicStatus === "endorsed" && lb.finalGrade !== null;
  const allEndorsed = weeksEndorsed(lb) === lb.totalWeeks;
  if (finalDone && allEndorsed) return "completed";
  const now = Date.now();
  const ended = new Date(lb.attachmentEnd).getTime() < now;
  if (ended && (!finalDone || !allEndorsed)) return "incomplete";
  const days = daysSinceLastSubmission(lb);
  if (days !== null && days >= 14) return "overdue";
  if (lb.weeks.some((w) => w.academic.status === "revision_requested"))
    return "revision_requested";
  if (pendingEndorsementCount(lb) > 0) return "under_review";
  return "active";
}
