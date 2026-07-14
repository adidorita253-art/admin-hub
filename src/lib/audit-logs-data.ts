// Mock audit log data. Immutable append-only in real backend.

export type AuditModule =
  | "auth"
  | "students"
  | "supervisors"
  | "companies"
  | "applications"
  | "letters"
  | "logbooks"
  | "reports"
  | "notifications"
  | "settings"
  | "system";

export type AuditActionType =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "login_failed"
  | "assign"
  | "approve"
  | "reject"
  | "export"
  | "import"
  | "reset_password"
  | "deactivate"
  | "config_change";

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditLog {
  id: string;
  at: string; // ISO
  actorName: string;
  actorEmail: string;
  actorRole: "Administrator" | "Academic Supervisor" | "Company Supervisor" | "Student" | "System";
  action: AuditActionType;
  module: AuditModule;
  target: string;
  targetId?: string;
  description: string;
  ip: string;
  userAgent: string;
  severity: AuditSeverity;
  metadata?: Record<string, string | number | boolean>;
}

export const ACTOR_ROLES = [
  "Administrator",
  "Academic Supervisor",
  "Company Supervisor",
  "Student",
  "System",
] as const;

export const AUDIT_MODULES: { value: AuditModule; label: string }[] = [
  { value: "auth", label: "Authentication" },
  { value: "students", label: "Students" },
  { value: "supervisors", label: "Supervisors" },
  { value: "companies", label: "Companies" },
  { value: "applications", label: "Applications" },
  { value: "letters", label: "Letters" },
  { value: "logbooks", label: "Logbooks" },
  { value: "reports", label: "Reports" },
  { value: "notifications", label: "Notifications" },
  { value: "settings", label: "Settings" },
  { value: "system", label: "System" },
];

export const AUDIT_ACTIONS: { value: AuditActionType; label: string }[] = [
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "login_failed", label: "Login failed" },
  { value: "assign", label: "Assign" },
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
  { value: "export", label: "Export" },
  { value: "import", label: "Import" },
  { value: "reset_password", label: "Reset password" },
  { value: "deactivate", label: "Deactivate" },
  { value: "config_change", label: "Config change" },
];

const now = Date.now();
const mins = (n: number) => new Date(now - n * 60_000).toISOString();

const auditListeners = new Set<() => void>();
export const subscribeAuditLogs = (l: () => void) => {
  auditListeners.add(l);
  return () => auditListeners.delete(l);
};
export const getAuditLogsSnapshot = () => auditLogsSnapshot;
let auditLogsSnapshot: AuditLog[] = [];

export function appendAuditLog(
  entry: Omit<AuditLog, "id" | "at" | "ip" | "userAgent"> & Partial<Pick<AuditLog, "ip" | "userAgent">>,
): AuditLog {
  const log: AuditLog = {
    id: `al-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    ip: entry.ip ?? "10.20.30.44",
    userAgent: entry.userAgent ?? "Chrome 128 / macOS",
    ...entry,
  };
  auditLogs.unshift(log);
  auditLogsSnapshot = auditLogs.slice();
  auditListeners.forEach((l) => l());
  return log;
}

export const auditLogs: AuditLog[] = [
  {
    id: "al-1001",
    at: mins(2),
    actorName: "Admin User",
    actorEmail: "admin@htu.edu.gh",
    actorRole: "Administrator",
    action: "assign",
    module: "students",
    target: "3 students → Dr. Akosua Mensah",
    description:
      "Bulk-assigned 3 students to academic supervisor Dr. Akosua Mensah.",
    ip: "10.20.30.44",
    userAgent: "Chrome 128 / macOS",
    severity: "info",
    metadata: { count: 3, supervisor: "Dr. Akosua Mensah" },
  },
  {
    id: "al-1002",
    at: mins(11),
    actorName: "Admin User",
    actorEmail: "admin@htu.edu.gh",
    actorRole: "Administrator",
    action: "config_change",
    module: "settings",
    target: "Letter Template",
    description:
      "Updated Introduction Letter template (v3 → v4). Effective 2026-07-06.",
    ip: "10.20.30.44",
    userAgent: "Chrome 128 / macOS",
    severity: "warning",
    metadata: { from: "v3", to: "v4" },
  },
  {
    id: "al-1003",
    at: mins(25),
    actorName: "Dr. Akosua Mensah",
    actorEmail: "amensah@htu.edu.gh",
    actorRole: "Academic Supervisor",
    action: "approve",
    module: "logbooks",
    target: "Logbook #LB-2087 (W. Otieno)",
    description: "Approved weekly logbook entry for Wanjiku Otieno.",
    ip: "196.201.11.9",
    userAgent: "Safari 17 / iOS",
    severity: "info",
  },
  {
    id: "al-1004",
    at: mins(42),
    actorName: "unknown",
    actorEmail: "root@htu.edu.gh",
    actorRole: "System",
    action: "login_failed",
    module: "auth",
    target: "root@htu.edu.gh",
    description: "Failed login attempt (5th within 10 min) — account locked.",
    ip: "41.90.176.221",
    userAgent: "curl/8.4",
    severity: "critical",
    metadata: { attempts: 5, locked: true },
  },
  {
    id: "al-1005",
    at: mins(60),
    actorName: "Admin User",
    actorEmail: "admin@htu.edu.gh",
    actorRole: "Administrator",
    action: "export",
    module: "reports",
    target: "Placement Report Q2 2026",
    description: "Exported placement report (PDF, 42 pages).",
    ip: "10.20.30.44",
    userAgent: "Chrome 128 / macOS",
    severity: "info",
  },
  {
    id: "al-1006",
    at: mins(95),
    actorName: "Admin User",
    actorEmail: "admin@htu.edu.gh",
    actorRole: "Administrator",
    action: "create",
    module: "supervisors",
    target: "Dr. Kwaku Osei",
    description: "Created academic supervisor account and sent welcome email.",
    ip: "10.20.30.44",
    userAgent: "Chrome 128 / macOS",
    severity: "info",
  },
  {
    id: "al-1007",
    at: mins(140),
    actorName: "Admin User",
    actorEmail: "admin@htu.edu.gh",
    actorRole: "Administrator",
    action: "reset_password",
    module: "students",
    target: "Brian Mwangi",
    description: "Triggered password reset for student Brian Mwangi.",
    ip: "10.20.30.44",
    userAgent: "Chrome 128 / macOS",
    severity: "warning",
  },
  {
    id: "al-1008",
    at: mins(210),
    actorName: "Aisha Achieng",
    actorEmail: "aachieng@student.htu.edu.gh",
    actorRole: "Student",
    action: "create",
    module: "applications",
    target: "Application #APP-4488",
    description: "Submitted attachment application to Safaricom PLC.",
    ip: "154.13.66.7",
    userAgent: "Chrome 128 / Android",
    severity: "info",
  },
  {
    id: "al-1009",
    at: mins(260),
    actorName: "Admin User",
    actorEmail: "admin@htu.edu.gh",
    actorRole: "Administrator",
    action: "approve",
    module: "applications",
    target: "Application #APP-4488",
    description: "Approved attachment application — introduction letter queued.",
    ip: "10.20.30.44",
    userAgent: "Chrome 128 / macOS",
    severity: "info",
  },
  {
    id: "al-1010",
    at: mins(340),
    actorName: "System",
    actorEmail: "system@htu.edu.gh",
    actorRole: "System",
    action: "config_change",
    module: "system",
    target: "Nightly backup",
    description: "Nightly database backup completed (2.4 GB, 00:04:12).",
    ip: "127.0.0.1",
    userAgent: "cron",
    severity: "info",
  },
  {
    id: "al-1011",
    at: mins(410),
    actorName: "Admin User",
    actorEmail: "admin@htu.edu.gh",
    actorRole: "Administrator",
    action: "deactivate",
    module: "students",
    target: "Otieno Kimani",
    description: "Deactivated inactive student account.",
    ip: "10.20.30.44",
    userAgent: "Chrome 128 / macOS",
    severity: "warning",
  },
  {
    id: "al-1012",
    at: mins(500),
    actorName: "Admin User",
    actorEmail: "admin@htu.edu.gh",
    actorRole: "Administrator",
    action: "import",
    module: "students",
    target: "students-batch-2026.xlsx",
    description: "Imported 128 students (0 errors) from Excel template.",
    ip: "10.20.30.44",
    userAgent: "Chrome 128 / macOS",
    severity: "info",
    metadata: { rows: 128, errors: 0 },
  },
  {
    id: "al-1013",
    at: mins(720),
    actorName: "Mr. Boateng",
    actorEmail: "boateng@safaricom.co.ke",
    actorRole: "Company Supervisor",
    action: "update",
    module: "logbooks",
    target: "Logbook #LB-2091",
    description: "Added feedback to student weekly logbook.",
    ip: "41.90.64.11",
    userAgent: "Edge 128 / Windows",
    severity: "info",
  },
  {
    id: "al-1014",
    at: mins(1_440),
    actorName: "Admin User",
    actorEmail: "admin@htu.edu.gh",
    actorRole: "Administrator",
    action: "delete",
    module: "companies",
    target: "Acme Ltd (duplicate)",
    description: "Deleted duplicate company record.",
    ip: "10.20.30.44",
    userAgent: "Chrome 128 / macOS",
    severity: "warning",
  },
  {
    id: "al-1015",
    at: mins(2_880),
    actorName: "Admin User",
    actorEmail: "admin@htu.edu.gh",
    actorRole: "Administrator",
    action: "login",
    module: "auth",
    target: "admin@htu.edu.gh",
    description: "Successful login from new device.",
    ip: "10.20.30.44",
    userAgent: "Chrome 128 / macOS",
    severity: "info",
  },
];

// Initialize snapshot after auditLogs seed array is defined.
auditLogsSnapshot = auditLogs.slice();

