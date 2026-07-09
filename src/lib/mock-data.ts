// Centralized mock data for Students, Academic Supervisors, Company Supervisors.
// Frontend-only; replace with backend queries when Lovable Cloud is enabled.

import {
  SEED_DEPARTMENTS,
  SEED_FACULTIES,
  SEED_PROGRAMMES,
  type Level,
  type ProgrammeType,
} from "./academic-structure";

export type Status = "active" | "inactive" | "pending";
export type Gender = "male" | "female";
export type AttachmentStatus =
  | "not_placed"
  | "applied"
  | "placed"
  | "ongoing"
  | "completed";

// Legacy DEPARTMENTS export — kept for back-compat, now sourced from HTU seed data.
export const DEPARTMENTS = SEED_DEPARTMENTS.map((d) => d.name);
export type Department = string;

export const COMPANIES = [
  "Safaricom PLC",
  "Equity Bank",
  "KPMG East Africa",
  "Microsoft ADC",
  "Twiga Foods",
  "Kenya Power",
  "Cellulant",
  "I&M Bank",
  "Andela Kenya",
  "M-KOPA",
] as const;

export interface Student {
  id: string;
  regNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  // Legacy string, kept for existing code; equals the HTU dept name.
  department: string;
  facultyId: string;
  departmentId: string;
  programmeId: string;
  programmeType: ProgrammeType;
  level: Level;
  yearOfStudy: 1 | 2 | 3 | 4;
  passportPhoto: string;
  status: Status;
  attachmentStatus: AttachmentStatus;
  academicSupervisorId: string | null;
  companySupervisorId: string | null;
  companyName: string | null;
  startDate: string | null;
  endDate: string | null;
  applicationsCount: number;
  logbookEntries: number;
  lastLogbookAt: string | null;
  createdAt: string;
}

export interface AcademicSupervisor {
  id: string;
  staffNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  facultyId: string;
  departmentId: string;
  title: "Prof." | "Dr." | "Mr." | "Mrs." | "Ms.";
  officeRoom: string;
  status: Status;
  studentsAssigned: number;
  maxLoad: number;
  reviewsPending: number;
  avgReviewHours: number;
  createdAt: string;
}

export interface CompanySupervisor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  companyName: (typeof COMPANIES)[number];
  status: Status;
  approvedVia: "qr" | "otp" | "manual";
  approvedAt: string;
  studentsAssigned: number;
  reviewsPending: number;
  createdAt: string;
}

export type CompanyStatus = "verified" | "pending" | "blacklisted";
export type CompanySize = "Startup" | "SME" | "Large" | "Multinational";

export interface Company {
  id: string;
  name: string;
  industry: string;
  size: CompanySize;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  county: string;
  contactPerson: string;
  contactJobTitle: string;
  logoText: string;
  status: CompanyStatus;
  blacklistReason?: string;
  capacity: number;
  studentsHosted: number;
  supervisorsCount: number;
  applicationsReceived: number;
  approvalRate: number;
  registeredAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  notes: string;
}

// ---------- generators ----------
const FIRST = [
  "Wanjiku", "Brian", "Aisha", "Kevin", "Naomi", "James", "Faith", "Daniel",
  "Mercy", "Peter", "Sharon", "Collins", "Achieng", "Mutiso", "Lydia",
  "Tom", "Esther", "Otieno", "Cynthia", "Mwangi", "Linet", "Joseph",
  "Halima", "George", "Stacy", "Victor", "Joy", "Eric", "Patience", "Ian",
];
const LAST = [
  "Kamau", "Otieno", "Mwangi", "Achieng", "Wekesa", "Njoroge", "Hassan",
  "Kiprop", "Mutua", "Owino", "Mbugua", "Onyango", "Karanja", "Maina",
  "Wambui", "Cheruiyot", "Abdi", "Oduor", "Kibet", "Nyambura",
];

const pick = <T,>(arr: readonly T[], i: number) => arr[i % arr.length];
const seedDate = (i: number, base = 2024) => {
  const d = new Date(base, (i * 7) % 12, ((i * 13) % 27) + 1);
  return d.toISOString();
};

// Academic supervisors (12) — assigned across HTU faculties.
export const academicSupervisors: AcademicSupervisor[] = Array.from(
  { length: 12 },
  (_, i) => {
    const first = pick(FIRST, i + 3);
    const last = pick(LAST, i + 5);
    const titles = ["Prof.", "Dr.", "Mr.", "Mrs.", "Ms."] as const;
    const assigned = 4 + ((i * 3) % 10);
    const dept = SEED_DEPARTMENTS[i % SEED_DEPARTMENTS.length];
    return {
      id: `as-${i + 1}`,
      staffNumber: `STF-${1200 + i}`,
      firstName: first,
      lastName: last,
      email: `${first}.${last}@htu.edu.gh`.toLowerCase(),
      phone: `+2332${(41000000 + i * 13579).toString().slice(0, 8)}`,
      department: dept.name,
      facultyId: dept.facultyId,
      departmentId: dept.id,
      title: pick(titles, i),
      officeRoom: `Block ${String.fromCharCode(65 + (i % 5))}-${100 + i}`,
      status: i === 4 ? "inactive" : "active",
      studentsAssigned: assigned,
      maxLoad: 15,
      reviewsPending: (i * 2) % 7,
      avgReviewHours: 12 + ((i * 5) % 24),
      createdAt: seedDate(i, 2023),
    };
  },
);

// Company supervisors (15)
export const companySupervisors: CompanySupervisor[] = Array.from(
  { length: 15 },
  (_, i) => {
    const first = pick(FIRST, i + 7);
    const last = pick(LAST, i + 2);
    const company = pick(COMPANIES, i);
    const jobs = [
      "Software Engineer",
      "HR Manager",
      "Operations Lead",
      "Finance Manager",
      "Engineering Manager",
      "Site Engineer",
      "Product Manager",
      "Data Analyst",
    ];
    const via = (["qr", "otp", "manual"] as const)[i % 3];
    return {
      id: `cs-${i + 1}`,
      firstName: first,
      lastName: last,
      email: `${first}.${last}@${company.split(" ")[0].toLowerCase()}.co.ke`,
      phone: `+2547${(22000000 + i * 24681).toString().slice(0, 8)}`,
      jobTitle: pick(jobs, i),
      companyName: company,
      status: i === 6 || i === 11 ? "inactive" : "active",
      approvedVia: via,
      approvedAt: seedDate(i, 2024),
      studentsAssigned: 1 + (i % 4),
      reviewsPending: (i * 3) % 5,
      createdAt: seedDate(i, 2024),
    };
  },
);

// Students (40) — each assigned to a real HTU dept & programme, with a level.
const LEVELS_POOL: Level[] = [100, 200, 300, 400];
export const students: Student[] = Array.from({ length: 40 }, (_, i) => {
  const first = pick(FIRST, i);
  const last = pick(LAST, i + 1);
  const dept = SEED_DEPARTMENTS[i % SEED_DEPARTMENTS.length];
  const deptProgrammes = SEED_PROGRAMMES.filter((p) => p.departmentId === dept.id);
  const programme = deptProgrammes[i % deptProgrammes.length];
  const level = LEVELS_POOL[i % LEVELS_POOL.length];
  const statusRoll = i % 9;
  const attachment: AttachmentStatus =
    statusRoll < 2
      ? "not_placed"
      : statusRoll < 4
        ? "applied"
        : statusRoll < 6
          ? "placed"
          : statusRoll < 8
            ? "ongoing"
            : "completed";
  const hasPlacement = attachment !== "not_placed" && attachment !== "applied";
  const acadSup = academicSupervisors[i % academicSupervisors.length];
  const compSup = companySupervisors[i % companySupervisors.length];
  return {
    id: `st-${i + 1}`,
    regNumber: `HTU/${dept.code}/${(2200 + i).toString().padStart(4, "0")}/2024`,
    firstName: first,
    lastName: last,
    email: `${first}.${last}@student.htu.edu.gh`.toLowerCase(),
    phone: `+2332${(43000000 + i * 19876).toString().slice(0, 8)}`,
    gender: i % 2 === 0 ? "female" : "male",
    department: dept.name,
    facultyId: dept.facultyId,
    departmentId: dept.id,
    programmeId: programme.id,
    programmeType: programme.type,
    level,
    yearOfStudy: (((i % 4) + 1) as 1 | 2 | 3 | 4),
    passportPhoto: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
    status: i === 14 ? "inactive" : "active",
    attachmentStatus: attachment,
    academicSupervisorId: hasPlacement ? acadSup.id : null,
    companySupervisorId: hasPlacement ? compSup.id : null,
    companyName: hasPlacement ? compSup.companyName : null,
    startDate: hasPlacement ? seedDate(i, 2026) : null,
    endDate: hasPlacement
      ? new Date(
          new Date(seedDate(i, 2026)).getTime() + 90 * 86400000,
        ).toISOString()
      : null,
    applicationsCount: 1 + (i % 6),
    logbookEntries: attachment === "ongoing" || attachment === "completed"
      ? 15 + (i % 40)
      : 0,
    lastLogbookAt:
      attachment === "ongoing" || attachment === "completed"
        ? seedDate(i + 2, 2026)
        : null,
    createdAt: seedDate(i, 2023),
  };
});

// helpers
export const findAcademicSupervisor = (id: string | null) =>
  id ? academicSupervisors.find((s) => s.id === id) ?? null : null;
export const findCompanySupervisor = (id: string | null) =>
  id ? companySupervisors.find((s) => s.id === id) ?? null : null;
export const findFacultyById = (id: string | null | undefined) =>
  id ? SEED_FACULTIES.find((f) => f.id === id) ?? null : null;
export const findDepartmentById = (id: string | null | undefined) =>
  id ? SEED_DEPARTMENTS.find((d) => d.id === id) ?? null : null;
export const findProgrammeById = (id: string | null | undefined) =>
  id ? SEED_PROGRAMMES.find((p) => p.id === id) ?? null : null;

export const attachmentLabel: Record<AttachmentStatus, string> = {
  not_placed: "Not Placed",
  applied: "Applied",
  placed: "Placed",
  ongoing: "Ongoing",
  completed: "Completed",
};

// ---------- Companies ----------
const INDUSTRIES = [
  "Telecommunications",
  "Banking & Finance",
  "Consulting",
  "Software & Cloud",
  "Agritech",
  "Energy & Utilities",
  "Fintech",
  "Banking & Finance",
  "Software Engineering",
  "Mobile Money",
];
const SIZES: CompanySize[] = ["Startup", "SME", "Large", "Multinational"];
const CITIES = [
  ["Nairobi", "Nairobi"],
  ["Mombasa", "Mombasa"],
  ["Kisumu", "Kisumu"],
  ["Nakuru", "Nakuru"],
  ["Eldoret", "Uasin Gishu"],
];

const companyMeta: { website: string; address: string }[] = [
  { website: "safaricom.co.ke", address: "Safaricom House, Waiyaki Way" },
  { website: "equitybank.co.ke", address: "Equity Centre, Upper Hill" },
  { website: "kpmg.com/ke", address: "ABC Towers, Waiyaki Way" },
  { website: "microsoft.com", address: "Dunhill Towers, Westlands" },
  { website: "twiga.com", address: "Wilson Business Park" },
  { website: "kplc.co.ke", address: "Stima Plaza, Kolobot Road" },
  { website: "cellulant.io", address: "Pinetree Plaza, Kilimani" },
  { website: "imbankgroup.com", address: "I&M Bank House, 2nd Ngong Ave" },
  { website: "andela.com", address: "Mirage Towers, Westlands" },
  { website: "m-kopa.com", address: "Park Place, Parklands" },
];

export const companies: Company[] = COMPANIES.map((name, i) => {
  const supForCo = companySupervisors.filter((s) => s.companyName === name);
  const studentsHere = students.filter((s) => s.companyName === name);
  const [city, county] = CITIES[i % CITIES.length];
  const meta = companyMeta[i];
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  const status: CompanyStatus =
    i === 5 ? "blacklisted" : i === 8 ? "pending" : "verified";
  const contact = supForCo[0];
  return {
    id: `co-${i + 1}`,
    name,
    industry: INDUSTRIES[i % INDUSTRIES.length],
    size: SIZES[i % SIZES.length],
    email: `careers@${meta.website}`,
    phone: `+254700${(100000 + i * 7919).toString().slice(0, 6)}`,
    website: `https://www.${meta.website}`,
    address: meta.address,
    city,
    county,
    contactPerson: contact
      ? `${contact.firstName} ${contact.lastName}`
      : "HR Department",
    contactJobTitle: contact?.jobTitle ?? "HR Manager",
    logoText: initials,
    status,
    blacklistReason:
      status === "blacklisted"
        ? "Repeated late stipend payments and unsafe working conditions reported by 3 students."
        : undefined,
    capacity: 5 + (i % 4) * 5,
    studentsHosted: studentsHere.length,
    supervisorsCount: supForCo.length,
    applicationsReceived: 8 + i * 3,
    approvalRate: 55 + ((i * 7) % 40),
    registeredAt: seedDate(i, 2022),
    verifiedAt: status === "verified" ? seedDate(i, 2023) : null,
    verifiedBy: status === "verified" ? "Admin User" : null,
    notes:
      status === "verified"
        ? "Long-standing partner. Consistently provides quality mentorship."
        : status === "pending"
          ? "Awaiting verification of business registration documents."
          : "Suspended pending investigation.",
  };
});

export const findCompanyByName = (name: string | null) =>
  name ? companies.find((c) => c.name === name) ?? null : null;

/* ---------------- Applications ---------------- */

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";
export type LetterStatus =
  | "not_generated"
  | "generated"
  | "sent"
  | "viewed"
  | "approved"
  | "rejected"
  | "expired";
export type AppStage =
  | "applied"
  | "letter_generated"
  | "letter_sent"
  | "company_viewed"
  | "awaiting_response"
  | "approved"
  | "rejected";

export const APP_STAGES: AppStage[] = [
  "applied",
  "letter_generated",
  "letter_sent",
  "company_viewed",
  "awaiting_response",
  "approved",
];

export const stageLabel: Record<AppStage, string> = {
  applied: "Applied",
  letter_generated: "Letter Generated",
  letter_sent: "Letter Sent",
  company_viewed: "Company Viewed",
  awaiting_response: "Awaiting Response",
  approved: "Approved",
  rejected: "Rejected",
};

export const approvalLabel: Record<ApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
};

export const letterLabel: Record<LetterStatus, string> = {
  not_generated: "Not Generated",
  generated: "Generated",
  sent: "Sent",
  viewed: "Viewed",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
};

export interface OtpEvent {
  at: string;
  type: "requested" | "verified";
}

export interface AppNote {
  id: string;
  author: string;
  at: string;
  text: string;
}

export interface Application {
  id: string;
  code: string;
  studentId: string;
  companyId: string;
  companyName: string;
  department: string;
  academicYear: string;
  semester: "First" | "Second";
  dateApplied: string;
  letterStatus: LetterStatus;
  approvalStatus: ApprovalStatus;
  stage: AppStage;
  academicSupervisorId: string | null;
  qrLinkId: string;
  qrLinkExpiresAt: string;
  qrLinkRevoked: boolean;
  qrLinkRevokedReason?: string;
  companyResponseMessage?: string;
  companyRespondedAt?: string;
  rejectionReason?: string;
  manualOverrideReason?: string;
  otpEvents: OtpEvent[];
  timeline: { stage: AppStage; at: string }[];
  notes: AppNote[];
  letterPdfUrl: string;
}

const STAGE_ROLL: { stage: AppStage; approval: ApprovalStatus; letter: LetterStatus }[] = [
  { stage: "applied", approval: "pending", letter: "not_generated" },
  { stage: "letter_generated", approval: "pending", letter: "generated" },
  { stage: "letter_sent", approval: "pending", letter: "sent" },
  { stage: "company_viewed", approval: "pending", letter: "viewed" },
  { stage: "awaiting_response", approval: "pending", letter: "viewed" },
  { stage: "approved", approval: "approved", letter: "approved" },
  { stage: "rejected", approval: "rejected", letter: "rejected" },
  { stage: "awaiting_response", approval: "expired", letter: "expired" },
];

const ACADEMIC_YEARS = ["2024/2025", "2025/2026"] as const;

export const applications: Application[] = Array.from({ length: 28 }, (_, i) => {
  const student = students[i % students.length];
  const company = companies[i % companies.length];
  const roll = STAGE_ROLL[i % STAGE_ROLL.length];
  const dateApplied = seedDate(i + 1, 2026);
  const t0 = new Date(dateApplied).getTime();
  const day = 86400000;
  const stageIdx = APP_STAGES.indexOf(
    roll.stage === "rejected" ? "awaiting_response" : roll.stage,
  );
  const fullTimeline: { stage: AppStage; at: string }[] = [
    { stage: "applied", at: new Date(t0).toISOString() },
    { stage: "letter_generated", at: new Date(t0 + 1 * day).toISOString() },
    { stage: "letter_sent", at: new Date(t0 + 2 * day).toISOString() },
    { stage: "company_viewed", at: new Date(t0 + 4 * day).toISOString() },
    { stage: "awaiting_response", at: new Date(t0 + 4 * day).toISOString() },
    { stage: roll.stage, at: new Date(t0 + 7 * day).toISOString() },
  ];
  const timeline = fullTimeline.slice(
    0,
    Math.max(1, stageIdx + (roll.approval === "pending" ? 1 : 2)),
  );
  return {
    id: `app-${i + 1}`,
    code: `APP-2026-${(i + 1).toString().padStart(4, "0")}`,
    studentId: student.id,
    companyId: company.id,
    companyName: company.name,
    department: student.department,
    academicYear: ACADEMIC_YEARS[i % 2],
    semester: i % 2 === 0 ? "First" : "Second",
    dateApplied,
    letterStatus: roll.letter,
    approvalStatus: roll.approval,
    stage: roll.stage,
    academicSupervisorId:
      i % 5 === 0 ? null : academicSupervisors[i % academicSupervisors.length].id,
    qrLinkId: `QR-${(1000 + i).toString(36).toUpperCase()}`,
    qrLinkExpiresAt: new Date(t0 + 14 * day).toISOString(),
    qrLinkRevoked: false,
    companyResponseMessage:
      roll.approval === "approved"
        ? "Confirmed. The student may report on the agreed start date."
        : roll.approval === "rejected"
          ? "Capacity for this intake has been fully allocated."
          : undefined,
    companyRespondedAt:
      roll.approval === "approved" || roll.approval === "rejected"
        ? new Date(t0 + 7 * day).toISOString()
        : undefined,
    rejectionReason:
      roll.approval === "rejected" ? "Capacity full for this intake" : undefined,
    otpEvents:
      roll.stage === "company_viewed" ||
      roll.stage === "awaiting_response" ||
      roll.approval === "approved" ||
      roll.approval === "rejected"
        ? [
            { at: new Date(t0 + 3 * day).toISOString(), type: "requested" },
            { at: new Date(t0 + 3 * day + 600000).toISOString(), type: "verified" },
          ]
        : [],
    timeline,
    notes:
      i % 4 === 0
        ? [
            {
              id: `n-${i}-1`,
              author: "Admin User",
              at: new Date(t0 + 2 * day).toISOString(),
              text: "Followed up with company HR via phone.",
            },
          ]
        : [],
    letterPdfUrl: "#",
  };
});

export const findStudent = (id: string) =>
  students.find((s) => s.id === id) ?? null;
export const findCompany = (id: string) =>
  companies.find((c) => c.id === id) ?? null;
export const findApplication = (id: string) =>
  applications.find((a) => a.id === id) ?? null;
