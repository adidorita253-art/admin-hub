import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  Building2,
  GraduationCap,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  AlertTriangle,
  Plus,
  FileText,
  Mail,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Attachment Admin" },
      {
        name: "description",
        content:
          "Live overview of students, companies, applications and logbook activity for the Industrial Attachment Management System.",
      },
    ],
  }),
  component: DashboardPage,
});

type StatColor = "info" | "success" | "primary" | "warning" | "destructive" | "accent";

const stats: Array<{
  label: string;
  value: number;
  delta: string;
  color: StatColor;
  href: string;
  icon: typeof Users;
}> = [
  { label: "Total Students", value: 1284, delta: "+12% vs last semester", color: "info", href: "/students", icon: GraduationCap },
  { label: "Total Companies", value: 186, delta: "+4% vs last semester", color: "success", href: "/companies", icon: Building2 },
  { label: "Academic Supervisors", value: 42, delta: "+2 since last term", color: "primary", href: "/academic-supervisors", icon: UserCheck },
  { label: "Company Supervisors", value: 211, delta: "+18% vs last semester", color: "accent", href: "/company-supervisors", icon: Users },
  { label: "Pending Applications", value: 73, delta: "Needs review", color: "warning", href: "/applications?status=pending", icon: Clock },
  { label: "Approved Placements", value: 942, delta: "+9% vs last semester", color: "success", href: "/applications?status=approved", icon: CheckCircle2 },
  { label: "Rejected Placements", value: 56, delta: "-3% vs last semester", color: "destructive", href: "/applications?status=rejected", icon: XCircle },
  { label: "Active Logbooks", value: 812, delta: "Updated in last 14 days", color: "info", href: "/logbooks", icon: Activity },
];

const colorMap: Record<StatColor, { ring: string; icon: string; text: string }> = {
  info:        { ring: "ring-info/20",        icon: "bg-info/10 text-info",               text: "text-info" },
  success:     { ring: "ring-success/20",     icon: "bg-success/10 text-success",         text: "text-success" },
  primary:     { ring: "ring-primary/20",     icon: "bg-primary/10 text-primary",         text: "text-primary" },
  warning:     { ring: "ring-warning/30",     icon: "bg-warning/15 text-warning-foreground", text: "text-foreground" },
  destructive: { ring: "ring-destructive/20", icon: "bg-destructive/10 text-destructive", text: "text-destructive" },
  accent:      { ring: "ring-accent",         icon: "bg-accent text-accent-foreground",   text: "text-accent-foreground" },
};

const placementData = [
  { dept: "Computing", Applied: 180, Approved: 142, Rejected: 12 },
  { dept: "Engineering", Applied: 220, Approved: 175, Rejected: 18 },
  { dept: "Business", Applied: 160, Approved: 128, Rejected: 9 },
  { dept: "Health Sci.", Applied: 95, Approved: 78, Rejected: 5 },
  { dept: "Media", Applied: 70, Approved: 55, Rejected: 7 },
  { dept: "Sciences", Applied: 110, Approved: 88, Rejected: 6 },
];

const activityData = [
  { month: "Jan", Applications: 42, "Logbook Entries": 110 },
  { month: "Feb", Applications: 88, "Logbook Entries": 240 },
  { month: "Mar", Applications: 154, "Logbook Entries": 380 },
  { month: "Apr", Applications: 96, "Logbook Entries": 520 },
  { month: "May", Applications: 64, "Logbook Entries": 610 },
  { month: "Jun", Applications: 41, "Logbook Entries": 580 },
];

const alerts = [
  {
    severity: "danger" as const,
    name: "Akosua Mensah",
    issue: "Attachment ends in 4 days — logbook not marked Complete",
    action: "View Logbook",
    href: "/logbooks",
  },
  {
    severity: "warning" as const,
    name: "Kwame Asante",
    issue: "No logbook entry in the last 18 days",
    action: "View Student",
    href: "/students",
  },
  {
    severity: "warning" as const,
    name: "TechCorp Ltd approval link",
    issue: "Expired 2 days ago without response",
    action: "Resend Link",
    href: "/applications",
  },
  {
    severity: "warning" as const,
    name: "Dr. Boateng",
    issue: "12 logbook entries unreviewed for over 5 days",
    action: "View Supervisor",
    href: "/academic-supervisors",
  },
];

const recentActivity = [
  { icon: Mail, text: "John Mensah generated an application letter", time: "Today, 10:42 AM", href: "/letters" },
  { icon: CheckCircle2, text: "Innovate Africa approved Akua Owusu's placement", time: "Today, 9:18 AM", href: "/applications" },
  { icon: BookOpen, text: "Dr. Boateng reviewed 4 logbook entries", time: "Today, 8:55 AM", href: "/logbooks" },
  { icon: GraduationCap, text: "Admin created student STU-2024-0481", time: "Yesterday", href: "/students" },
  { icon: Building2, text: "Verified company: Pinnacle Engineering", time: "Yesterday", href: "/companies" },
  { icon: FileText, text: "12 new applications submitted", time: "Yesterday", href: "/applications" },
  { icon: Mail, text: "Bulk letter generated for 23 students", time: "2 days ago", href: "/letters" },
  { icon: XCircle, text: "Rejected: Quantum Labs placement (capacity full)", time: "2 days ago", href: "/applications" },
];

function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Live snapshot of placements, supervisors and logbook activity."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" /> Add Student
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" /> Add Company
            </Button>
            <Button size="sm">
              <Mail className="h-4 w-4" /> Generate Letter
            </Button>
          </>
        }
      />

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const c = colorMap[s.color];
          return (
            <Link
              key={s.label}
              to={s.href.split("?")[0]}
              className="group"
            >
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {s.label}
                    </span>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-md ring-1 ${c.icon} ${c.ring}`}>
                      <s.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                    {s.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.delta}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Alerts */}
      <Card className="border-warning/40 bg-warning/5">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <AlertTriangle className="h-5 w-5 text-warning-foreground" />
          <CardTitle className="text-base">Alerts requiring action</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            {alerts.length} unresolved
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-md border border-border bg-card p-3"
            >
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  a.severity === "danger" ? "bg-destructive" : "bg-warning"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">{a.name}</div>
                <div className="text-xs text-muted-foreground">{a.issue}</div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to={a.href}>{a.action}</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Placement statistics by department</CardTitle>
            <p className="text-xs text-muted-foreground">
              Current academic year · First semester
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={placementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="dept" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                  <Bar dataKey="Applied" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Approved" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Rejected" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly activity</CardTitle>
            <p className="text-xs text-muted-foreground">
              Applications & logbook entries this semester
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                  <Line
                    type="monotone"
                    dataKey="Applications"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Logbook Entries"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Recent activity</CardTitle>
            <p className="text-xs text-muted-foreground">
              Last 15 system events · auto-refreshes every 60s
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Live
          </Badge>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {recentActivity.map((e, i) => (
            <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <e.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-foreground">{e.text}</div>
                <div className="text-xs text-muted-foreground">{e.time}</div>
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link to={e.href}>
                  View <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
