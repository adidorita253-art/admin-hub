import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Search,
  Eye,
  FileDown,
  Pencil,
  Bell,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  academicSupervisors,
  companies,
  findAcademicSupervisor,
  findStudent,
} from "@/lib/mock-data";
import { useActiveDepartments } from "@/lib/settings-store";
import {
  deriveStatus,
  daysSinceLastSubmission,
  GRADES,
  lastSubmissionISO,
  LOGBOOK_STATUS_LABEL,
  pendingEndorsementCount,
  weeksEndorsed,
  type LogbookStatus,
} from "@/lib/logbooks-data";
import { useLogbooks } from "@/lib/logbooks-store";

export const Route = createFileRoute("/logbooks")({
  head: () => ({ meta: [{ title: "Logbooks — Attachment Admin" }] }),
  component: LogbooksPage,
});

const STATUSES: LogbookStatus[] = [
  "active",
  "overdue",
  "under_review",
  "revision_requested",
  "completed",
  "incomplete",
];

const STATUS_CLASSES: Record<LogbookStatus, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  under_review: "bg-amber-100 text-amber-800 border-amber-200",
  revision_requested: "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  incomplete: "bg-slate-200 text-slate-800 border-slate-300",
};

function fmt(d: string | null) {
  return d
    ? new Date(d).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";
}

function StatCard({
  label,
  value,
  tone,
  onClick,
}: {
  label: string;
  value: number | string;
  tone: string;
  onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={
        "cursor-pointer border-l-4 transition hover:shadow-md " + tone
      }
    >
      <CardContent className="p-4">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function LogbooksPage() {
  const logbooks = useLogbooks();
  const activeDepartments = useActiveDepartments();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [dept, setDept] = useState<string>("all");
  const [supervisor, setSupervisor] = useState<string>("all");
  const [company, setCompany] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [semester, setSemester] = useState<string>("all");
  const [grade, setGrade] = useState<string>("all");

  const rows = useMemo(() => {
    return logbooks.map((lb) => {
      const s = findStudent(lb.studentId);
      const sup = findAcademicSupervisor(s?.academicSupervisorId ?? null);
      return {
        lb,
        student: s,
        supervisor: sup,
        status: deriveStatus(lb),
        endorsed: weeksEndorsed(lb),
        last: lastSubmissionISO(lb),
        daysSince: daysSinceLastSubmission(lb),
      };
    });
  }, [logbooks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const hay = [
          r.student?.firstName,
          r.student?.lastName,
          r.student?.regNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status !== "all" && r.status !== status) return false;
      if (dept !== "all" && r.student?.department !== dept) return false;
      if (supervisor !== "all" && r.supervisor?.id !== supervisor) return false;
      if (company !== "all" && r.student?.companyName !== company) return false;
      if (year !== "all" && r.lb.academicYear !== year) return false;
      if (semester !== "all" && r.lb.semester !== semester) return false;
      if (grade !== "all" && (r.lb.finalGrade ?? "—") !== grade) return false;
      return true;
    });
  }, [rows, search, status, dept, supervisor, company, year, semester, grade]);

  const stats = useMemo(() => {
    const totalEntries = logbooks.reduce(
      (n, l) =>
        n +
        l.weeks.reduce(
          (m, w) => m + w.daily.filter((d) => d.submittedAt).length,
          0,
        ),
      0,
    );
    const pending = logbooks.reduce((n, l) => n + pendingEndorsementCount(l), 0);
    const overdue = rows.filter((r) => r.status === "overdue").length;
    const completed = rows.filter((r) => r.status === "completed").length;
    return { totalEntries, pending, overdue, completed };
  }, [logbooks, rows]);

  const notify = (name: string) => {
    toast.success(`Reminder sent to ${name}`, {
      description: "The student has been notified about the overdue logbook.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logbooks"
        description="Complete visibility over every student's weekly logbook. Admin is the only role that can edit submitted records."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Total Logbook Entries"
          value={stats.totalEntries}
          tone="border-l-blue-500"
          onClick={() => setStatus("all")}
        />
        <StatCard
          label="Pending Endorsements"
          value={stats.pending}
          tone="border-l-amber-500"
          onClick={() => setStatus("under_review")}
        />
        <StatCard
          label="Overdue Logbooks"
          value={stats.overdue}
          tone="border-l-red-500"
          onClick={() => setStatus("overdue")}
        />
        <StatCard
          label="Completed Logbooks"
          value={stats.completed}
          tone="border-l-emerald-500"
          onClick={() => setStatus("completed")}
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search student name or ID…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {LOGBOOK_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {activeDepartments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={supervisor} onValueChange={setSupervisor}>
              <SelectTrigger><SelectValue placeholder="Academic Supervisor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All supervisors</SelectItem>
                {academicSupervisors.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title} {s.firstName} {s.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue placeholder="Academic Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                <SelectItem value="2024/2025">2024/2025</SelectItem>
                <SelectItem value="2025/2026">2025/2026</SelectItem>
              </SelectContent>
            </Select>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                <SelectItem value="First">First</SelectItem>
                <SelectItem value="Second">Second</SelectItem>
              </SelectContent>
            </Select>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger><SelectValue placeholder="Final Grade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All grades</SelectItem>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
                <SelectItem value="—">Not Yet Graded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Academic Supervisor</TableHead>
                  <TableHead className="text-center">Weeks</TableHead>
                  <TableHead className="text-center">Endorsed</TableHead>
                  <TableHead>Last Submission</TableHead>
                  <TableHead>Final Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No logbooks match your filters.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((r) => {
                  const st = r.status;
                  return (
                    <TableRow key={r.lb.id}>
                      <TableCell className="font-medium">
                        {r.student?.firstName} {r.student?.lastName}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.student?.regNumber}
                      </TableCell>
                      <TableCell>{r.student?.department}</TableCell>
                      <TableCell>{r.student?.companyName ?? "—"}</TableCell>
                      <TableCell>
                        {r.supervisor
                          ? `${r.supervisor.title} ${r.supervisor.lastName}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {r.lb.totalWeeks}
                      </TableCell>
                      <TableCell className="text-center">
                        {r.endorsed}/{r.lb.totalWeeks}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{fmt(r.last)}</span>
                          {r.daysSince !== null && r.daysSince >= 7 && (
                            <span
                              className={
                                "text-xs " +
                                (r.daysSince >= 14
                                  ? "text-red-600 font-medium"
                                  : "text-amber-600")
                              }
                            >
                              {r.daysSince}d ago
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.lb.finalGrade ? (
                          <Badge variant="outline">{r.lb.finalGrade}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not Yet Graded
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_CLASSES[st]}
                        >
                          {LOGBOOK_STATUS_LABEL[st]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {st === "overdue" && r.student && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                notify(
                                  `${r.student!.firstName} ${r.student!.lastName}`,
                                )
                              }
                            >
                              <Bell className="h-3.5 w-3.5" />
                              Notify
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  to="/logbooks/$id"
                                  params={{ id: r.lb.id }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Logbook
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  to="/logbooks/$id"
                                  params={{ id: r.lb.id }}
                                  search={{ edit: true }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Record
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toast.success("PDF export queued")
                                }
                              >
                                <FileDown className="mr-2 h-4 w-4" />
                                Export as PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toast.success("Excel export queued")
                                }
                              >
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Export as Excel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5" />
        Showing {filtered.length} of {rows.length} logbooks
      </div>
    </div>
  );
}
