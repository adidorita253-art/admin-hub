import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Search,
  Eye,
  FileDown,
  Pencil,
  FileSpreadsheet,
  X,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { exportLogbookPDF, exportLogbookExcel } from "@/lib/logbooks-export";

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
  active: "bg-sky-100 text-sky-800 border-sky-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  under_review: "bg-amber-100 text-amber-800 border-amber-200",
  revision_requested: "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
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

type SortKey =
  | "student"
  | "regNumber"
  | "department"
  | "company"
  | "supervisor"
  | "endorsed"
  | "last"
  | "grade"
  | "status";

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
  const [sortKey, setSortKey] = useState<SortKey>("last");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setDept("all");
    setSupervisor("all");
    setCompany("all");
    setYear("all");
    setSemester("all");
    setGrade("all");
    setPage(1);
  };

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
          r.student?.email,
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

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const val = (r: (typeof arr)[number]): string | number => {
        switch (sortKey) {
          case "student":
            return `${r.student?.lastName ?? ""} ${r.student?.firstName ?? ""}`;
          case "regNumber":
            return r.student?.regNumber ?? "";
          case "department":
            return r.student?.department ?? "";
          case "company":
            return r.student?.companyName ?? "";
          case "supervisor":
            return r.supervisor?.lastName ?? "";
          case "endorsed":
            return r.endorsed;
          case "last":
            return r.last ? new Date(r.last).getTime() : 0;
          case "grade":
            return r.lb.finalGrade ?? "";
          case "status":
            return r.status;
        }
      };
      const av = val(a);
      const bv = val(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );
  const startIdx = sorted.length === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIdx = Math.min(currentPage * perPage, sorted.length);

  const stats = useMemo(() => {
    const total = logbooks.length;
    const pending = logbooks.reduce((n, l) => n + pendingEndorsementCount(l), 0);
    const overdue = rows.filter((r) => r.status === "overdue").length;
    const completed = rows.filter((r) => r.status === "completed").length;
    return { total, pending, overdue, completed };
  }, [logbooks, rows]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const SortHead = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <TableHead>
      <button
        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
        onClick={() => toggleSort(k)}
      >
        {children}
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      </button>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logbooks"
        description="Complete visibility over every student's weekly logbook. Admin is the only role that can edit submitted records."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Total Logbook Records"
          value={stats.total}
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
        <CardContent className="space-y-3 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, student ID or email..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
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
            <Select value={dept} onValueChange={(v) => { setDept(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {activeDepartments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={supervisor} onValueChange={(v) => { setSupervisor(v); setPage(1); }}>
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
            <Select value={company} onValueChange={(v) => { setCompany(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={(v) => { setYear(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Academic Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                <SelectItem value="2024/2025">2024/2025</SelectItem>
                <SelectItem value="2025/2026">2025/2026</SelectItem>
              </SelectContent>
            </Select>
            <Select value={semester} onValueChange={(v) => { setSemester(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                <SelectItem value="First">First Semester</SelectItem>
                <SelectItem value="Second">Second Semester</SelectItem>
              </SelectContent>
            </Select>
            <Select value={grade} onValueChange={(v) => { setGrade(v); setPage(1); }}>
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
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3.5 w-3.5" /> Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead k="student">Student</SortHead>
                  <SortHead k="regNumber">Student ID</SortHead>
                  <SortHead k="department">Department</SortHead>
                  <SortHead k="company">Company</SortHead>
                  <SortHead k="supervisor">Academic Supervisor</SortHead>
                  <TableHead className="text-center">Weeks</TableHead>
                  <SortHead k="endorsed">Endorsed</SortHead>
                  <SortHead k="last">Last Submission</SortHead>
                  <SortHead k="grade">Final Grade</SortHead>
                  <SortHead k="status">Status</SortHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No logbook records found for the selected filters. Try
                      adjusting your search or filters.
                    </TableCell>
                  </TableRow>
                )}
                {pageRows.map((r) => {
                  const st = r.status;
                  return (
                    <TableRow key={r.lb.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={r.student?.passportPhoto} />
                            <AvatarFallback>
                              {r.student?.firstName?.[0]}
                              {r.student?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {r.student?.firstName} {r.student?.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <Link
                          to="/students"
                          className="text-primary hover:underline"
                        >
                          {r.student?.regNumber}
                        </Link>
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
                          {r.daysSince !== null && r.daysSince >= 14 && (
                            <span
                              className={
                                "text-xs " +
                                (r.daysSince >= 21
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" />
          Showing {startIdx}–{endIdx} of {sorted.length} students
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Select
              value={String(perPage)}
              onValueChange={(v) => {
                setPerPage(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Prev
            </Button>
            <span>
              Page {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
