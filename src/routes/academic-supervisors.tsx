import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  UserCheck,
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Eye,
  Pencil,
  KeyRound,
  UserMinus,
  Users,
  Clock,
  GraduationCap,
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  DEPARTMENTS,
  academicSupervisors as seed,
  students,
  type AcademicSupervisor,
} from "@/lib/mock-data";
import { StatusPill, AttachmentPill } from "@/components/status-pill";
import { useActiveDepartments } from "@/lib/settings-store";

export const Route = createFileRoute("/academic-supervisors")({
  head: () => ({ meta: [{ title: "Academic Supervisors — Attachment Admin" }] }),
  component: AcademicSupervisorsPage,
});

function AcademicSupervisorsPage() {
  const activeDepartments = useActiveDepartments();
  const [data, setData] = useState<AcademicSupervisor[]>(seed);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [viewing, setViewing] = useState<AcademicSupervisor | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return data.filter((s) => {
      if (dept !== "all" && s.department !== dept) return false;
      if (status !== "all" && s.status !== status) return false;
      if (!q) return true;
      return (
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.staffNumber.toLowerCase().includes(q)
      );
    });
  }, [data, query, dept, status]);

  const stats = useMemo(() => {
    const totalStudents = data.reduce((a, s) => a + s.studentsAssigned, 0);
    const pending = data.reduce((a, s) => a + s.reviewsPending, 0);
    const overloaded = data.filter((s) => s.studentsAssigned >= s.maxLoad).length;
    return { total: data.length, totalStudents, pending, overloaded };
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Academic Supervisors"
        description="Manage faculty supervisors, their workload and student assignments."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus /> Add Supervisor
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Mini icon={UserCheck} label="Supervisors" value={stats.total} />
        <Mini icon={Users} label="Students Assigned" value={stats.totalStudents} />
        <Mini
          icon={Clock}
          label="Reviews Pending"
          value={stats.pending}
          tone="amber"
        />
        <Mini
          icon={GraduationCap}
          label="At Max Load"
          value={stats.overloaded}
          tone="destructive"
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, staff number or email…"
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="lg:w-56">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {activeDepartments.map((d) => (
                <SelectItem key={d.id} value={d.name}>
                  {d.name}
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
              <TableHead>Staff No.</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Workload</TableHead>
              <TableHead>Reviews Pending</TableHead>
              <TableHead>Avg Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => {
              const pct = Math.min(100, (s.studentsAssigned / s.maxLoad) * 100);
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {s.firstName[0]}
                          {s.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {s.title} {s.firstName} {s.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.staffNumber}</TableCell>
                  <TableCell className="text-sm">{s.department}</TableCell>
                  <TableCell className="w-48">
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-1.5" />
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {s.studentsAssigned}/{s.maxLoad}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.reviewsPending > 0 ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                        {s.reviewsPending}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{s.avgReviewHours}h</TableCell>
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
                        <DropdownMenuItem onClick={() => toast.info("Edit form")}>
                          <Pencil /> Edit
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
              );
            })}
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

      <SupervisorProfileDialog
        supervisor={viewing}
        onClose={() => setViewing(null)}
      />
      <AddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(s) => {
          setData((prev) => [s, ...prev]);
          toast.success("Supervisor created — welcome email sent");
        }}
      />
    </div>
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
  tone?: "primary" | "amber" | "destructive";
}) {
  const c =
    tone === "amber"
      ? "text-amber-600 bg-amber-100 dark:bg-amber-500/15"
      : tone === "destructive"
        ? "text-destructive bg-destructive/10"
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

function SupervisorProfileDialog({
  supervisor,
  onClose,
}: {
  supervisor: AcademicSupervisor | null;
  onClose: () => void;
}) {
  if (!supervisor) return null;
  const myStudents = students.filter(
    (s) => s.academicSupervisorId === supervisor.id,
  );
  return (
    <Dialog open={!!supervisor} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Supervisor profile</DialogTitle>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary">
                {supervisor.firstName[0]}
                {supervisor.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">
                {supervisor.title} {supervisor.firstName} {supervisor.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {supervisor.department} • {supervisor.officeRoom}
              </p>
              <div className="mt-1">
                <StatusPill status={supervisor.status} />
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">
              Assigned Students ({myStudents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat icon={Mail} label="Email" value={supervisor.email} />
              <Stat icon={Phone} label="Phone" value={supervisor.phone} />
              <Stat
                icon={Users}
                label="Workload"
                value={`${supervisor.studentsAssigned} of ${supervisor.maxLoad} students`}
              />
              <Stat
                icon={Clock}
                label="Average Review Time"
                value={`${supervisor.avgReviewHours} hours`}
              />
              <Stat
                icon={Clock}
                label="Reviews Pending"
                value={String(supervisor.reviewsPending)}
              />
              <Stat
                icon={Building2}
                label="Joined"
                value={new Date(supervisor.createdAt).toLocaleDateString()}
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
                    <TableHead>Attachment</TableHead>
                    <TableHead className="w-10" />
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
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toast.info("Reassignment flow")}
                        >
                          Reassign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {myStudents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
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

function Stat({
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

function AddDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (s: AcademicSupervisor) => void;
}) {
  const [form, setForm] = useState({
    title: "Dr." as AcademicSupervisor["title"],
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    staffNumber: "",
    department: DEPARTMENTS[0] as string,
    officeRoom: "",
    maxLoad: "15",
  });
  const submit = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.staffNumber) {
      toast.error("Fill in all required fields");
      return;
    }
    const s: AcademicSupervisor = {
      id: `as-new-${Date.now()}`,
      staffNumber: form.staffNumber,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      title: form.title,
      department: form.department as AcademicSupervisor["department"],
      officeRoom: form.officeRoom,
      status: "active",
      studentsAssigned: 0,
      maxLoad: Number(form.maxLoad),
      reviewsPending: 0,
      avgReviewHours: 0,
      createdAt: new Date().toISOString(),
    };
    onCreated(s);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Academic Supervisor</DialogTitle>
          <DialogDescription>
            Creates the account and emails a welcome message with a temporary
            password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Select
              value={form.title}
              onValueChange={(v) =>
                setForm({ ...form, title: v as AcademicSupervisor["title"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Prof.", "Dr.", "Mr.", "Mrs.", "Ms."].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Staff number *</Label>
            <Input
              value={form.staffNumber}
              onChange={(e) => setForm({ ...form, staffNumber: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">First name *</Label>
            <Input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Last name *</Label>
            <Input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Department</Label>
            <Select
              value={form.department}
              onValueChange={(v) => setForm({ ...form, department: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Office room</Label>
            <Input
              value={form.officeRoom}
              onChange={(e) => setForm({ ...form, officeRoom: e.target.value })}
              placeholder="Block A-101"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Max student load</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={form.maxLoad}
              onChange={(e) => setForm({ ...form, maxLoad: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Create supervisor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
