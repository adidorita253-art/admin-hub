// Centralized mock data for Students, Academic Supervisors, Company Supervisors.
// Frontend-only; replace with backend queries when Lovable Cloud is enabled.

export type Status = "active" | "inactive" | "pending";
export type Gender = "male" | "female";
export type AttachmentStatus =
  | "not_placed"
  | "applied"
  | "placed"
  | "ongoing"
  | "completed";

export const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business Administration",
  "Accounting & Finance",
  "Communication",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

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
  department: Department;
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
  department: Department;
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
  logoText: string; // initials
  status: CompanyStatus;
  blacklistReason?: string;
  capacity: number;
  studentsHosted: number;
  supervisorsCount: number;
  applicationsReceived: number;
  approvalRate: number; // 0-100
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

// Academic supervisors (12)
export const academicSupervisors: AcademicSupervisor[] = Array.from(
  { length: 12 },
  (_, i) => {
    const first = pick(FIRST, i + 3);
    const last = pick(LAST, i + 5);
    const titles = ["Prof.", "Dr.", "Mr.", "Mrs.", "Ms."] as const;
    const assigned = 4 + ((i * 3) % 10);
    return {
      id: `as-${i + 1}`,
      staffNumber: `STF-${1200 + i}`,
      firstName: first,
      lastName: last,
      email: `${first}.${last}@uni.ac.ke`.toLowerCase(),
      phone: `+2547${(11000000 + i * 13579).toString().slice(0, 8)}`,
      department: pick(DEPARTMENTS, i),
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

// Students (40)
export const students: Student[] = Array.from({ length: 40 }, (_, i) => {
  const first = pick(FIRST, i);
  const last = pick(LAST, i + 1);
  const dept = pick(DEPARTMENTS, i);
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
    regNumber: `SCT/${211 + (i % 4)}/${(2200 + i).toString().padStart(4, "0")}/2024`,
    firstName: first,
    lastName: last,
    email: `${first}.${last}@students.uni.ac.ke`.toLowerCase(),
    phone: `+2547${(33000000 + i * 19876).toString().slice(0, 8)}`,
    gender: i % 2 === 0 ? "female" : "male",
    department: dept,
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

