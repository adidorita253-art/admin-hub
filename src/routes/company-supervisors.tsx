import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  UserCheck,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Eye,
  KeyRound,
  UserMinus,
  ArrowRightLeft,
  QrCode,
  KeySquare,
  ShieldCheck,
  Clock,
  Users,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  COMPANIES,
  companySupervisors as seed,
  students,
  type CompanySupervisor,
} from "@/lib/mock-data";
import { StatusPill, AttachmentPill } from "@/components/status-pill";

export const Route = createFileRoute("/company-supervisors")({
  head: () => ({ meta: [{ title: "Company Supervisors — Attachment Admin" }] }),
  component: CompanySupervisorsPage,
});

function CompanySupervisorsPage() {
  const [data, setData] = useState<CompanySupervisor[]>(seed);
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("all");
  const [status, setStatus] = useState("all");
  const [viewing, setViewing] = useState<CompanySupervisor | null>(null);
  const [transferring, setTransferring] = useState<CompanySupervisor | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return data.filter((s) => {
      if (company !== "all" && s.companyName !== company) return false;
      if (status !== "all" && s.status !== status) return false;
      if (!q) return true;
      return (
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q)
      );
    });
  }, [data, query, company, status]);

  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter((s) => s.status === "active").length;
    const totalStudents = data.reduce((a, s) => a + s.studentsAssigned, 0);
    const pending = data.reduce((a, s) => a + s.reviewsPending, 0);
    return { total, active, totalStudents, pending };
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Company Supervisors"
        description="Oversight of supervisors created via the company QR / OTP approval flow."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Mini icon={UserCheck} label="Supervisors" value={stats.total} />
        <Mini icon={ShieldCheck} label="Active" value={stats.active} tone="success" />
        <Mini icon={Users} label="Students Supervised" value={stats.totalStudents} />
        <Mini icon={Clock} label="Reviews Pending" value={stats.pending} tone="amber" />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or company…"
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={company} onValueChange={setCompany}>
            <SelectTrigger className="lg:w-56">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All companies</SelectItem>
              {COMPANIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="lg:w-36">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supervisor</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Approved Via</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                        {s.firstName[0]}
                        {s.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {s.firstName} {s.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium">{s.companyName}</TableCell>
                <TableCell className="text-sm">{s.jobTitle}</TableCell>
                <TableCell>
                  <ApprovedViaBadge via={s.approvedVia} />
                </TableCell>
                <TableCell className="text-sm">{s.studentsAssigned}</TableCell>
                <TableCell>
                  {s.reviewsPending > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                      {s.reviewsPending}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusPill status={s.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setViewing(s)}>
                        <Eye /> View profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTransferring(s)}>
                        <ArrowRightLeft /> Transfer students
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.success("Password reset email sent")}>
                        <KeyRound /> Reset password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setData((prev) =>
                            prev.map((x) =>
                              x.id === s.id ? { ...x, status: "inactive" } : x,
                            ),
                          );
                          toast.success("Supervisor deactivated");
                        }}
                      >
                        <UserMinus /> Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No supervisors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <ProfileDialog
        supervisor={viewing}
        onClose={() => setViewing(null)}
      />
      <TransferDialog
        supervisor={transferring}
        onClose={() => setTransferring(null)}
        all={data}
        onTransfer={(targetId) => {
          if (!transferring) return;
          const target = data.find((d) => d.id === targetId);
          setData((prev) =>
            prev.map((x) => {
              if (x.id === transferring.id)
                return { ...x, studentsAssigned: 0 };
              if (x.id === targetId)
                return {
                  ...x,
                  studentsAssigned:
                    x.studentsAssigned + transferring.studentsAssigned,
                };
              return x;
            }),
          );
          toast.success(
            `Transferred ${transferring.studentsAssigned} student(s) to ${target?.firstName} ${target?.lastName}`,
          );
          setTransferring(null);
        }}
      />
    </div>
  );
}

function ApprovedViaBadge({ via }: { via: CompanySupervisor["approvedVia"] }) {
  if (via === "qr")
    return (
      <Badge variant="outline" className="gap-1">
        <QrCode className="h-3 w-3" /> QR
      </Badge>
    );
  if (via === "otp")
    return (
      <Badge variant="outline" className="gap-1">
        <KeySquare className="h-3 w-3" /> OTP
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1">
      <ShieldCheck className="h-3 w-3" /> Manual
    </Badge>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: typeof UserCheck;
  label: string;
  value: number;
  tone?: "primary" | "amber" | "success";
}) {
  const c =
    tone === "amber"
      ? "text-amber-600 bg-amber-100 dark:bg-amber-500/15"
      : tone === "success"
        ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15"
        : "text-primary bg-primary/10";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${c}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileDialog({
  supervisor,
  onClose,
}: {
  supervisor: CompanySupervisor | null;
  onClose: () => void;
}) {
  if (!supervisor) return null;
  const myStudents = students.filter(
    (s) => s.companySupervisorId === supervisor.id,
  );
  return (
    <Dialog open={!!supervisor} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Supervisor profile</DialogTitle>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-accent text-accent-foreground">
                {supervisor.firstName[0]}
                {supervisor.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">
                {supervisor.firstName} {supervisor.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {supervisor.jobTitle} • {supervisor.companyName}
              </p>
              <div className="mt-1 flex gap-2">
                <StatusPill status={supervisor.status} />
                <ApprovedViaBadge via={supervisor.approvedVia} />
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">
              Students ({myStudents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info icon={Mail} label="Email" value={supervisor.email} />
              <Info icon={Phone} label="Phone" value={supervisor.phone} />
              <Info icon={Building2} label="Company" value={supervisor.companyName} />
              <Info
                icon={ShieldCheck}
                label="Approved at"
                value={new Date(supervisor.approvedAt).toLocaleDateString()}
              />
              <Info
                icon={Users}
                label="Students"
                value={String(supervisor.studentsAssigned)}
              />
              <Info
                icon={Clock}
                label="Reviews Pending"
                value={String(supervisor.reviewsPending)}
              />
            </div>
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Reg No.</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myStudents.map((st) => (
                    <TableRow key={st.id}>
                      <TableCell className="font-medium">
                        {st.firstName} {st.lastName}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {st.regNumber}
                      </TableCell>
                      <TableCell>
                        <AttachmentPill status={st.attachmentStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {myStudents.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        No students assigned yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border p-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function TransferDialog({
  supervisor,
  onClose,
  all,
  onTransfer,
}: {
  supervisor: CompanySupervisor | null;
  onClose: () => void;
  all: CompanySupervisor[];
  onTransfer: (id: string) => void;
}) {
  const [target, setTarget] = useState("");
  if (!supervisor) return null;
  const peers = all.filter(
    (s) =>
      s.companyName === supervisor.companyName &&
      s.id !== supervisor.id &&
      s.status === "active",
  );
  return (
    <Dialog open={!!supervisor} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Students</DialogTitle>
          <DialogDescription>
            Move all {supervisor.studentsAssigned} student(s) from{" "}
            <strong>
              {supervisor.firstName} {supervisor.lastName}
            </strong>{" "}
            to another supervisor at <strong>{supervisor.companyName}</strong>.
          </DialogDescription>
        </DialogHeader>
        {peers.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No other active supervisors at this company. Onboard a new one before
            transferring.
          </p>
        ) : (
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger>
              <SelectValue placeholder="Choose recipient supervisor" />
            </SelectTrigger>
            <SelectContent>
              {peers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} — {p.jobTitle} (
                  {p.studentsAssigned} students)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!target}
            onClick={() => onTransfer(target)}
          >
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
