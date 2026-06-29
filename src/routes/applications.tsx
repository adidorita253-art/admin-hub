import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileText,
  Search,
  Eye,
  Calendar as CalendarIcon,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  StageBadge,
  ApprovalBadge,
  LetterBadge,
} from "@/components/application-badges";
import {
  APP_STAGES,
  DEPARTMENTS,
  findStudent,
  stageLabel,
  type AppStage,
  type ApprovalStatus,
} from "@/lib/mock-data";
import { useApplications } from "@/lib/applications-store";

export const Route = createFileRoute("/applications")({
  head: () => ({ meta: [{ title: "Applications — Attachment Admin" }] }),
  component: ApplicationsPage,
});

const APPROVALS: ApprovalStatus[] = ["pending", "approved", "rejected", "expired"];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ApplicationsPage() {
  const apps = useApplications();
  const [search, setSearch] = useState("");
  const [approval, setApproval] = useState<string>("all");
  const [stage, setStage] = useState<string>("all");
  const [dept, setDept] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [semester, setSemester] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps.filter((a) => {
      const s = findStudent(a.studentId);
      if (q) {
        const hay = [
          s?.firstName,
          s?.lastName,
          s?.regNumber,
          a.companyName,
          a.code,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (approval !== "all" && a.approvalStatus !== approval) return false;
      if (stage !== "all" && a.stage !== stage) return false;
      if (dept !== "all" && a.department !== dept) return false;
      if (year !== "all" && a.academicYear !== year) return false;
      if (semester !== "all" && a.semester !== semester) return false;
      const t = new Date(a.dateApplied).getTime();
      if (from && t < new Date(from).getTime()) return false;
      if (to && t > new Date(to).getTime() + 86400000) return false;
      return true;
    });
  }, [apps, search, approval, stage, dept, year, semester, from, to]);

  const stats = useMemo(
    () => ({
      total: apps.length,
      pending: apps.filter((a) => a.approvalStatus === "pending").length,
      approved: apps.filter((a) => a.approvalStatus === "approved").length,
      rejected: apps.filter((a) => a.approvalStatus === "rejected").length,
      expired: apps.filter((a) => a.approvalStatus === "expired").length,
    }),
    [apps],
  );

  const years = Array.from(new Set(apps.map((a) => a.academicYear)));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Applications"
        description="End-to-end pipeline from application submission to approved placement."
        actions={
          <Button variant="outline">
            <Download className="size-4" /> Export
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "Total", value: stats.total, tone: "text-foreground" },
          { label: "Pending", value: stats.pending, tone: "text-amber-600" },
          { label: "Approved", value: stats.approved, tone: "text-emerald-600" },
          { label: "Rejected", value: stats.rejected, tone: "text-rose-600" },
          { label: "Expired", value: stats.expired, tone: "text-zinc-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {s.label}
              </div>
              <div className={`mt-1 text-2xl font-bold ${s.tone}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[260px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search student, ID, company or APP code…"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={approval} onValueChange={setApproval}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Approval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Approvals</SelectItem>
                {APPROVALS.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {([...APP_STAGES, "rejected"] as AppStage[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {stageLabel[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {activeDepartments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value="First">First</SelectItem>
                <SelectItem value="Second">Second</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Date range:</span>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-[170px]"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-[170px]"
            />
            {(from || to || search || approval !== "all" || stage !== "all" ||
              dept !== "all" || year !== "all" || semester !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setApproval("all");
                  setStage("all");
                  setDept("all");
                  setYear("all");
                  setSemester("all");
                  setFrom("");
                  setTo("");
                }}
              >
                Clear filters
              </Button>
            )}
            <div className="ml-auto text-xs text-muted-foreground">
              {filtered.length} of {apps.length} applications
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead>Letter</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    No applications match the current filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((a) => {
                const s = findStudent(a.studentId);
                return (
                  <TableRow key={a.id} className="group">
                    <TableCell>
                      <div className="font-medium">
                        {s ? `${s.firstName} ${s.lastName}` : "Unknown"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a.code} · {a.department}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {s?.regNumber ?? "—"}
                    </TableCell>
                    <TableCell>{a.companyName}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {fmtDate(a.dateApplied)}
                    </TableCell>
                    <TableCell>
                      <LetterBadge status={a.letterStatus} />
                    </TableCell>
                    <TableCell>
                      <ApprovalBadge status={a.approvalStatus} />
                    </TableCell>
                    <TableCell>
                      <StageBadge stage={a.stage} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          to="/applications/$id"
                          params={{ id: a.id }}
                        >
                          <Eye className="size-4" /> View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="size-3.5" />
        Approvals are managed inside each application — there is no separate
        Approvals menu.
      </div>
    </div>
  );
}
