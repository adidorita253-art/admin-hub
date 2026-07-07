import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  BookOpen,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  DEPARTMENTS,
  academicSupervisors,
  companies,
  students,
  applications,
} from "@/lib/mock-data";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics — Attachment Admin" }] }),
  component: ReportsPage,
});

const YEARS = ["2025/2026", "2024/2025", "2023/2024"];
const SEMESTERS = ["All", "First", "Second"] as const;

function ReportsPage() {
  const [year, setYear] = useState(YEARS[0]);
  const [semester, setSemester] = useState<(typeof SEMESTERS)[number]>("All");
  const [dept, setDept] = useState<string>("All");

  const filtered = useMemo(() => {
    return applications.filter(
      (a) =>
        a.academicYear === year &&
        (semester === "All" || a.semester === semester) &&
        (dept === "All" || a.department === dept),
    );
  }, [year, semester, dept]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const approved = filtered.filter((a) => a.approvalStatus === "approved").length;
    const rejected = filtered.filter((a) => a.approvalStatus === "rejected").length;
    const pending = filtered.filter((a) => a.approvalStatus === "pending").length;
    const rate = total ? Math.round((approved / total) * 100) : 0;
    const placedStudents = students.filter(
      (s) => s.attachmentStatus === "ongoing" || s.attachmentStatus === "completed",
    ).length;
    const avgLogbook =
      Math.round(
        (students.reduce((s, x) => s + x.logbookEntries, 0) / students.length) * 10,
      ) / 10;
    return { total, approved, rejected, pending, rate, placedStudents, avgLogbook };
  }, [filtered]);

  const deptStats = useMemo(
    () =>
      DEPARTMENTS.map((d) => {
        const apps = filtered.filter((a) => a.department === d);
        const approved = apps.filter((a) => a.approvalStatus === "approved").length;
        const rejected = apps.filter((a) => a.approvalStatus === "rejected").length;
        return {
          dept: d.replace(/ & /g, " &\n").split(" ").slice(0, 2).join(" "),
          fullDept: d,
          Applied: apps.length,
          Approved: approved,
          Rejected: rejected,
          rate: apps.length ? Math.round((approved / apps.length) * 100) : 0,
        };
      }),
    [filtered],
  );

  const companyPerf = useMemo(
    () =>
      companies
        .map((c) => ({
          ...c,
          retention: Math.min(
            100,
            Math.round(c.approvalRate * 0.8 + (c.studentsHosted / (c.capacity || 1)) * 20),
          ),
          utilisation: c.capacity ? Math.round((c.studentsHosted / c.capacity) * 100) : 0,
        }))
        .sort((a, b) => b.approvalRate - a.approvalRate)
        .slice(0, 8),
    [],
  );

  const supervisorLoad = useMemo(
    () =>
      academicSupervisors
        .map((s) => ({
          ...s,
          loadPct: Math.round((s.studentsAssigned / s.maxLoad) * 100),
        }))
        .sort((a, b) => b.loadPct - a.loadPct),
    [],
  );

  const trend = [
    { month: "Sep", Applications: 42, Approvals: 30, Logbooks: 60 },
    { month: "Oct", Applications: 88, Approvals: 65, Logbooks: 180 },
    { month: "Nov", Applications: 154, Approvals: 118, Logbooks: 320 },
    { month: "Dec", Applications: 96, Approvals: 78, Logbooks: 420 },
    { month: "Jan", Applications: 64, Approvals: 51, Logbooks: 480 },
    { month: "Feb", Applications: 41, Approvals: 34, Logbooks: 460 },
  ];

  const statusPie = [
    { name: "Approved", value: kpis.approved, color: "var(--chart-2)" },
    { name: "Pending", value: kpis.pending, color: "var(--chart-1)" },
    { name: "Rejected", value: kpis.rejected, color: "var(--chart-4)" },
  ];

  const handleExport = (kind: "excel" | "pdf") => {
    toast.success(
      `${kind === "excel" ? "Excel" : "PDF"} export queued`,
      { description: `Report — ${year} · ${semester} · ${dept}. You'll get a download link shortly.` },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports & Analytics"
        description="Deep analytics across placements, companies, supervisors and logbook activity."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
              <FileSpreadsheet className="h-4 w-4" /> Export Excel
            </Button>
            <Button size="sm" onClick={() => handleExport("pdf")}>
              <FileText className="h-4 w-4" /> Export PDF
            </Button>
          </>
        }
      />

      {/* Filter bar */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" /> Filters:
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Academic Year</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Semester</label>
            <Select value={semester} onValueChange={(v) => setSemester(v as typeof SEMESTERS[number])}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Department</label>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="h-9 w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            Showing <Badge variant="secondary">{filtered.length}</Badge> applications
          </div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Placement Rate"
          value={`${kpis.rate}%`}
          delta="+6% vs last year"
          up
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="Placed Students"
          value={kpis.placedStudents.toString()}
          delta={`of ${students.length} total`}
          icon={Users}
          tone="info"
        />
        <KpiCard
          label="Pending Approvals"
          value={kpis.pending.toString()}
          delta="Needs review"
          icon={Clock}
          tone="warning"
        />
        <KpiCard
          label="Avg Logbook Entries"
          value={kpis.avgLogbook.toString()}
          delta="-2 vs last semester"
          icon={BookOpen}
          tone="destructive"
          down
        />
      </div>

      <Tabs defaultValue="placements">
        <TabsList>
          <TabsTrigger value="placements">Placements</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="supervisors">Supervisors</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Placements */}
        <TabsContent value="placements" className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Placements by Department</CardTitle>
              <p className="text-xs text-muted-foreground">
                Applied vs Approved vs Rejected · current filter
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="dept" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                    <Bar dataKey="Applied" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Approved" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Rejected" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approval Status</CardTitle>
              <p className="text-xs text-muted-foreground">Distribution across filter</p>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {statusPie.map((s) => <Cell key={s.name} fill={s.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Departmental Placement Rate</CardTitle>
              <p className="text-xs text-muted-foreground">
                Approved / Applied per department · sorted by rate
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {[...deptStats]
                  .sort((a, b) => b.rate - a.rate)
                  .map((d) => (
                    <div key={d.fullDept} className="grid gap-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{d.fullDept}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {d.Approved}/{d.Applied} ({d.rate}%)
                        </span>
                      </div>
                      <Progress value={d.rate} />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Companies */}
        <TabsContent value="companies" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Company Performance</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Approval rate, retention, and capacity utilisation
                </p>
              </div>
              <Badge variant="outline"><Building2 className="mr-1 h-3 w-3" /> Top 8</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead className="text-right">Applications</TableHead>
                    <TableHead className="text-right">Hosted</TableHead>
                    <TableHead className="w-[180px]">Approval Rate</TableHead>
                    <TableHead className="w-[180px]">Capacity Utilisation</TableHead>
                    <TableHead className="text-right">Retention</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyPerf.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.industry}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.applicationsReceived}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.studentsHosted}/{c.capacity}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={c.approvalRate} className="h-2" />
                          <span className="w-10 text-right text-xs tabular-nums">{c.approvalRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={c.utilisation} className="h-2" />
                          <span className="w-10 text-right text-xs tabular-nums">{c.utilisation}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={c.retention >= 80 ? "default" : c.retention >= 60 ? "secondary" : "destructive"}>
                          {c.retention}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supervisors */}
        <TabsContent value="supervisors" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Supervisor Workload & Review Time</CardTitle>
              <p className="text-xs text-muted-foreground">
                Students assigned vs max load · average review-time benchmark
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Assigned</TableHead>
                    <TableHead className="w-[180px]">Load</TableHead>
                    <TableHead className="text-right">Pending Reviews</TableHead>
                    <TableHead className="text-right">Avg Review Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supervisorLoad.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.title} {s.firstName} {s.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.department}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.studentsAssigned}/{s.maxLoad}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={s.loadPct}
                            className={`h-2 ${s.loadPct >= 90 ? "[&>div]:bg-destructive" : ""}`}
                          />
                          <span className="w-10 text-right text-xs tabular-nums">{s.loadPct}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={s.reviewsPending > 4 ? "destructive" : "secondary"}>
                          {s.reviewsPending}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {s.avgReviewHours}h
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Multi-Semester Trend</CardTitle>
              <p className="text-xs text-muted-foreground">
                Applications, approvals and logbook entries over the last 6 months
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                    <Line type="monotone" dataKey="Applications" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Approvals" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Logbooks" stroke="var(--chart-4)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Saved reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saved Reports</CardTitle>
          <p className="text-xs text-muted-foreground">One-click regenerate or download</p>
        </CardHeader>
        <CardContent className="grid gap-2">
          {[
            { name: "End-of-semester placement report", when: "Generated 2 days ago", size: "1.2 MB" },
            { name: "Company retention benchmark", when: "Generated last week", size: "820 KB" },
            { name: "Supervisor review-time audit", when: "Generated 3 weeks ago", size: "540 KB" },
          ].map((r) => (
            <div
              key={r.name}
              className="flex items-center gap-3 rounded-md border border-border bg-card p-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.when} · {r.size}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleExport("pdf")}>
                <Download className="h-4 w-4" /> Download
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
} as const;

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone,
  up,
  down,
}: {
  label: string;
  value: string;
  delta: string;
  icon: typeof Users;
  tone: "success" | "info" | "warning" | "destructive";
  up?: boolean;
  down?: boolean;
}) {
  const toneClass = {
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <div className={`flex h-9 w-9 items-center justify-center rounded-md ${toneClass}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="text-3xl font-bold tabular-nums tracking-tight">{value}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {up && <TrendingUp className="h-3.5 w-3.5 text-success" />}
          {down && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
          {delta}
        </div>
      </CardContent>
    </Card>
  );
}
