// Central source-of-truth for HTU academic structure:
// Faculties → Departments → Programmes.
// All dropdowns and filters across the admin app pull from here (via the settings store).

export type ProgrammeType = "HND" | "BTech" | "BSc" | "BA" | "Bachelor";
export const PROGRAMME_TYPES: ProgrammeType[] = ["HND", "BTech", "BSc", "BA", "Bachelor"];

export type Level = 100 | 200 | 300 | 400;
export const LEVELS: Level[] = [100, 200, 300, 400];

export interface FacultyRecord {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
}

export interface DepartmentRecord {
  id: string;
  facultyId: string;
  name: string;
  code: string;
  status: "active" | "inactive";
}

export interface ProgrammeRecord {
  id: string;
  facultyId: string;
  departmentId: string;
  name: string;
  type: ProgrammeType;
  status: "active" | "inactive";
}

// -------- Seed data (HTU) --------

export const SEED_FACULTIES: FacultyRecord[] = [
  { id: "fac-bs", name: "HTU Business School", code: "BS", status: "active" },
  { id: "fac-fass", name: "Faculty of Applied Social Sciences", code: "FASS", status: "active" },
  { id: "fac-fad", name: "Faculty of Art and Design", code: "FAD", status: "active" },
  { id: "fac-fe", name: "Faculty of Engineering", code: "FE", status: "active" },
  { id: "fac-fast", name: "Faculty of Applied Sciences and Technology", code: "FAST", status: "active" },
  { id: "fac-fbne", name: "Faculty of Built and Natural Environment", code: "FBNE", status: "active" },
];

const D = (id: string, facultyId: string, name: string, code: string): DepartmentRecord => ({
  id, facultyId, name, code, status: "active",
});

export const SEED_DEPARTMENTS: DepartmentRecord[] = [
  // BS
  D("dep-af",  "fac-bs", "Accounting and Finance", "AF"),
  D("dep-lsc", "fac-bs", "Logistics and Supply Chain Management", "LSC"),
  D("dep-ms",  "fac-bs", "Management Sciences", "MS"),
  D("dep-mkt", "fac-bs", "Marketing", "MKT"),
  // FASS
  D("dep-aml", "fac-fass", "Applied Modern Languages and Communication", "AML"),
  // FAD
  D("dep-fdt", "fac-fad", "Fashion Design and Textiles", "FDT"),
  D("dep-ia",  "fac-fad", "Industrial Art", "IA"),
  // FE
  D("dep-age", "fac-fe", "Agricultural Engineering", "AGE"),
  D("dep-ce",  "fac-fe", "Civil Engineering", "CE"),
  D("dep-eee", "fac-fe", "Electrical/Electronic Engineering", "EEE"),
  D("dep-me",  "fac-fe", "Mechanical Engineering", "ME"),
  // FAST
  D("dep-ast", "fac-fast", "Agricultural Sciences and Technology", "AST"),
  D("dep-cs",  "fac-fast", "Computer Science", "CS"),
  D("dep-fst", "fac-fast", "Food Science and Technology", "FST"),
  D("dep-htm", "fac-fast", "Hospitality and Tourism Management", "HTM"),
  D("dep-mstat","fac-fast", "Mathematics and Statistics", "MSTAT"),
  // FBNE
  D("dep-are", "fac-fbne", "Architecture and Real Estate Management", "ARE"),
  D("dep-bt",  "fac-fbne", "Building Technology", "BT"),
  D("dep-es",  "fac-fbne", "Environmental Science", "ES"),
];

let __pid = 0;
const P = (departmentId: string, name: string, type: ProgrammeType): ProgrammeRecord => {
  __pid += 1;
  const dept = SEED_DEPARTMENTS.find((d) => d.id === departmentId)!;
  return {
    id: `prog-${__pid}`,
    facultyId: dept.facultyId,
    departmentId,
    name,
    type,
    status: "active",
  };
};

export const SEED_PROGRAMMES: ProgrammeRecord[] = [
  // BS — AF
  P("dep-af", "BSc Financial Services (Banking and Finance)", "BSc"),
  P("dep-af", "BSc Financial Services (Finance & Insurance)", "BSc"),
  P("dep-af", "BSc Accounting (Finance and Taxation)", "BSc"),
  P("dep-af", "HND Accountancy", "HND"),
  P("dep-af", "HND Banking and Finance", "HND"),
  // BS — LSC
  P("dep-lsc", "BSc Procurement and Supply Chain Management", "BSc"),
  P("dep-lsc", "HND Purchasing and Supply", "HND"),
  P("dep-lsc", "HND Secretaryship and Management Studies", "HND"),
  // BS — MS
  P("dep-ms", "Bachelor Secretaryship and Management Studies", "Bachelor"),
  P("dep-ms", "BSc Procurement and Supply Chain Management", "BSc"),
  // BS — MKT
  P("dep-mkt", "BSc Marketing with Information Technology", "BSc"),
  P("dep-mkt", "HND Marketing", "HND"),
  // FASS — AML
  P("dep-aml", "BSc Economics and Innovation", "BSc"),
  P("dep-aml", "BA Communication & Applied Media Technology", "BA"),
  // FAD — FDT
  P("dep-fdt", "BTech Fashion Design and Textiles", "BTech"),
  P("dep-fdt", "HND Fashion Design and Textiles", "HND"),
  // FAD — IA
  P("dep-ia", "BTech Industrial Art", "BTech"),
  P("dep-ia", "HND Industrial Art", "HND"),
  // FE — AGE
  P("dep-age", "BTech Agricultural and Environmental Engineering", "BTech"),
  P("dep-age", "HND Agricultural Engineering", "HND"),
  // FE — CE
  P("dep-ce", "BTech Civil Engineering", "BTech"),
  P("dep-ce", "HND Civil Engineering", "HND"),
  // FE — EEE
  P("dep-eee", "BTech Electrical/Electronic Engineering", "BTech"),
  P("dep-eee", "HND Electrical/Electronic Engineering", "HND"),
  // FE — ME
  P("dep-me", "BTech Automobile Engineering", "BTech"),
  P("dep-me", "BTech Biomedical Engineering", "BTech"),
  P("dep-me", "BTech Design and Manufacturing Engineering", "BTech"),
  P("dep-me", "HND Mechanical Engineering (Auto/Production)", "HND"),
  // FAST — AST
  P("dep-ast", "BTech Agro Enterprise Development", "BTech"),
  P("dep-ast", "HND Agro Enterprise Development", "HND"),
  // FAST — CS
  P("dep-cs", "BTech Information & Communication Technology", "BTech"),
  P("dep-cs", "BTech Computer Science", "BTech"),
  P("dep-cs", "HND Information & Communication Technology", "HND"),
  P("dep-cs", "HND Computer Science", "HND"),
  // FAST — FST
  P("dep-fst", "BTech Food Technology", "BTech"),
  P("dep-fst", "HND Food Technology", "HND"),
  // FAST — HTM
  P("dep-htm", "BTech Hospitality Management", "BTech"),
  P("dep-htm", "BTech Tourism, Leisure & Events Management", "BTech"),
  P("dep-htm", "HND Hotel, Catering & Institutional Management", "HND"),
  // FAST — MSTAT
  P("dep-mstat", "BTech Statistics & Finance", "BTech"),
  // FBNE — ARE
  P("dep-are", "BTech Facilities Management (Estate Management)", "BTech"),
  P("dep-are", "BSc Architectural Technology", "BSc"),
  // FBNE — BT
  P("dep-bt", "BTech Building Technology", "BTech"),
  P("dep-bt", "HND Building Technology", "HND"),
  // FBNE — ES
  P("dep-es", "BSc Environmental Science", "BSc"),
];

// -------- Rules --------

export function isAttachmentEligible(type: ProgrammeType | null | undefined, level: Level | null | undefined): boolean {
  if (!type || !level) return false;
  if (type === "HND" && level === 200) return true;
  if ((type === "BTech" || type === "BSc") && level === 300) return true;
  return false;
}
