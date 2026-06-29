import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  GraduationCap,
  Plus,
  Upload,
  Download,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  KeyRound,
  UserMinus,
  UserCog,
  Mail,
  Phone,
  Calendar,
  Building2,
  FileText,
  BookOpen,
  StickyNote,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  DEPARTMENTS,
  academicSupervisors,
  findAcademicSupervisor,
  findCompanySupervisor,
  students as seedStudents,
  type Student,
} from "@/lib/mock-data";
import { AttachmentPill, StatusPill } from "@/components/status-pill";

export const Route = createFileRoute("/students")({
  head: () => ({ meta: [{ title: "Students — Attachment Admin" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  const [data, setData] = useState<Student[]>(seedStudents);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState<string>("all");
  const [attachment, setAttachment] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<Student | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((s) => {
      if (dept !== "all" && s.department !== dept) return false;
      if (attachment !== "all" && s.attachmentStatus !== attachment) return false;
      if (status !== "all" && s.status !== status) return false;
      if (!q) return true;
      return (
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.regNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    });
  }, [data, query, dept, attachment, status]);

  const allSelected =
    filtered.length > 0 && filtered.every((s) => selected.has(s.id));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) filtered.forEach((s) => next.delete(s.id));
      else filtered.forEach((s) => next.add(s.id));
      return next;
    });
  };
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const bulkDeactivate = () => {
    setData((prev) =>
      prev.map((s) =>
        selected.has(s.id) ? { ...s, status: "inactive" as const } : s,
      ),
    );
    toast.success(`Deactivated ${selected.size} student(s)`);
    setSelected(new Set());
  };

  const stats = useMemo(
    () => ({
      total: data.length,
      ongoing: data.filter((s) => s.attachmentStatus === "ongoing").length,
      placed: data.filter((s) => s.attachmentStatus === "placed").length,
      unplaced: data.filter(
        (s) => s.attachmentStatus === "not_placed" || s.attachmentStatus === "applied",
      ).length,
    }),
    [data],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Students"
        description="Manage student records, placements and supervisor assignments."
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload /> Import
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.success("Exported students.xlsx")}
            >
              <Download /> Export
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus /> Add Student
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={stats.total} />
        <StatCard label="On Attachment" value={stats.ongoing} accent="amber" />
        <StatCard label="Placed (Pending Start)" value={stats.placed} accent="indigo" />
        <StatCard label="Unplaced" value={stats.unplaced} accent="muted" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, reg number or email…"
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
            <Select value={attachment} onValueChange={setAttachment}>
              <SelectTrigger className="lg:w-44">
                <SelectValue placeholder="Attachment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="not_placed">Not placed</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
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
          </div>

          {selected.size > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <span className="font-medium">{selected.size} selected</span>
              <Separator orientation="vertical" className="h-4" />
              <Button size="sm" variant="ghost" onClick={() => toast.info("Bulk assign supervisor")}>
                <UserCog /> Assign supervisor
              </Button>
              <Button size="sm" variant="ghost" onClick={bulkDeactivate}>
                <UserMinus /> Deactivate
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toast.success("Exported selection")}
              >
                <Download /> Export
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Reg No.</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Attachment</TableHead>
              <TableHead>Supervisor</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => {
              const sup = findAcademicSupervisor(s.academicSupervisorId);
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(s.id)}
                      onCheckedChange={() => toggleOne(s.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={s.passportPhoto} alt="" />
                        <AvatarFallback>
                          {s.firstName[0]}
                          {s.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {s.firstName} {s.lastName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {s.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {s.regNumber}
                  </TableCell>
                  <TableCell className="text-sm">{s.department}</TableCell>
                  <TableCell>Y{s.yearOfStudy}</TableCell>
                  <TableCell>
                    <AttachmentPill status={s.attachmentStatus} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {sup ? `${sup.title} ${sup.lastName}` : (
                      <span className="text-muted-foreground">—</span>
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
                        <DropdownMenuItem onClick={() => toast.info("Edit form")}>
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAssignFor(s)}>
                          <UserCog /> Assign supervisor
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
                            toast.success("Student deactivated");
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
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  No students match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {filtered.length} of {data.length} students
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </Card>

      <StudentProfileDialog
        student={viewing}
        onClose={() => setViewing(null)}
      />
      <AddStudentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(s) => {
          setData((prev) => [s, ...prev]);
          toast.success("Student created — welcome email sent");
        }}
      />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <AssignSupervisorDialog
        student={assignFor}
        onClose={() => setAssignFor(null)}
        onAssign={(supId) => {
          if (!assignFor) return;
          setData((prev) =>
            prev.map((x) =>
              x.id === assignFor.id
                ? { ...x, academicSupervisorId: supId }
                : x,
            ),
          );
          const sup = findAcademicSupervisor(supId);
          toast.success(`Assigned to ${sup?.title} ${sup?.lastName}`);
          setAssignFor(null);
        }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "primary",
}: {
  label: string;
  value: number;
  accent?: "primary" | "amber" | "indigo" | "muted";
}) {
  const tone =
    accent === "amber"
      ? "text-amber-600"
      : accent === "indigo"
        ? "text-indigo-600"
        : accent === "muted"
          ? "text-muted-foreground"
          : "text-primary";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function StudentProfileDialog({
  student,
  onClose,
}: {
  student: Student | null;
  onClose: () => void;
}) {
  if (!student) return null;
  const acad = findAcademicSupervisor(student.academicSupervisorId);
  const comp = findCompanySupervisor(student.companySupervisorId);
  return (
    <Dialog open={!!student} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Student profile</DialogTitle>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.passportPhoto} />
              <AvatarFallback>
                {student.firstName[0]}
                {student.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold">
                {student.firstName} {student.lastName}
              </h2>
              <p className="font-mono text-xs text-muted-foreground">
                {student.regNumber}
              </p>
              <div className="mt-1 flex gap-2">
                <StatusPill status={student.status} />
                <AttachmentPill status={student.attachmentStatus} />
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="application">
              <FileText className="mr-1" /> Application
            </TabsTrigger>
            <TabsTrigger value="letters">
              <Mail className="mr-1" /> Letters
            </TabsTrigger>
            <TabsTrigger value="logbook">
              <BookOpen className="mr-1" /> Logbook
            </TabsTrigger>
            <TabsTrigger value="notes">
              <StickyNote className="mr-1" /> Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBlock
                icon={Mail}
                label="Email"
                value={student.email}
              />
              <InfoBlock icon={Phone} label="Phone" value={student.phone} />
              <InfoBlock
                icon={GraduationCap}
                label="Department / Year"
                value={`${student.department} • Y${student.yearOfStudy}`}
              />
              <InfoBlock
                icon={Calendar}
                label="Joined"
                value={new Date(student.createdAt).toLocaleDateString()}
              />
              <InfoBlock
                icon={Building2}
                label="Company"
                value={student.companyName ?? "—"}
              />
              <InfoBlock
                icon={Calendar}
                label="Attachment period"
                value={
                  student.startDate
                    ? `${new Date(student.startDate).toLocaleDateString()} → ${new Date(
                        student.endDate!,
                      ).toLocaleDateString()}`
                    : "—"
                }
              />
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <SupervisorCard
                heading="Academic Supervisor"
                name={acad ? `${acad.title} ${acad.firstName} ${acad.lastName}` : null}
                meta={acad?.email}
              />
              <SupervisorCard
                heading="Company Supervisor"
                name={comp ? `${comp.firstName} ${comp.lastName}` : null}
                meta={comp ? `${comp.jobTitle} • ${comp.companyName}` : undefined}
              />
            </div>
          </TabsContent>

          <TabsContent value="application" className="mt-4">
            <Card>
              <CardContent className="p-4 text-sm">
                <p className="text-muted-foreground">
                  {student.applicationsCount} application(s) submitted. Latest
                  application targets <strong>{student.companyName ?? "—"}</strong>.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="letters" className="mt-4">
            <Card>
              <CardContent className="space-y-2 p-4 text-sm">
                <Row label="Introduction Letter" value="Issued 12 Mar 2026" />
                <Row label="Insurance Cover" value="Issued 12 Mar 2026" />
                <Row label="Completion Letter" value={student.attachmentStatus === "completed" ? "Issued" : "Pending"} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logbook" className="mt-4">
            <Card>
              <CardContent className="p-4 text-sm">
                <p>
                  <strong>{student.logbookEntries}</strong> entries •{" "}
                  {student.lastLogbookAt
                    ? `last entry ${new Date(student.lastLogbookAt).toLocaleDateString()}`
                    : "no entries yet"}
                  .
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardContent className="space-y-2 p-4 text-sm">
                <p className="text-muted-foreground">
                  Internal notes about this student. Only admins and supervisors
                  can see this section.
                </p>
                <textarea
                  className="min-h-24 w-full rounded-md border bg-background p-2 text-sm"
                  placeholder="Add a note…"
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => toast.success("Note saved")}>
                    Save note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border bg-card p-3">
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SupervisorCard({
  heading,
  name,
  meta,
}: {
  heading: string;
  name: string | null;
  meta?: string;
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {heading}
      </p>
      {name ? (
        <>
          <p className="mt-1 font-medium">{name}</p>
          {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
        </>
      ) : (
        <p className="mt-1 text-sm italic text-muted-foreground">
          Not assigned
        </p>
      )}
    </div>
  );
}

function AddStudentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (s: Student) => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    regNumber: "",
    email: "",
    phone: "",
    department: DEPARTMENTS[0] as string,
    yearOfStudy: "1",
    gender: "female" as "female" | "male",
  });
  const submit = () => {
    if (!form.firstName || !form.lastName || !form.regNumber || !form.email) {
      toast.error("Fill in all required fields");
      return;
    }
    const s: Student = {
      id: `st-new-${Date.now()}`,
      regNumber: form.regNumber,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      gender: form.gender,
      department: form.department as Student["department"],
      yearOfStudy: Number(form.yearOfStudy) as 1 | 2 | 3 | 4,
      passportPhoto: `https://i.pravatar.cc/150?u=${form.email}`,
      status: "active",
      attachmentStatus: "not_placed",
      academicSupervisorId: null,
      companySupervisorId: null,
      companyName: null,
      startDate: null,
      endDate: null,
      applicationsCount: 0,
      logbookEntries: 0,
      lastLogbookAt: null,
      createdAt: new Date().toISOString(),
    };
    onCreated(s);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
          <DialogDescription>
            Creates the account and emails a temporary password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name *">
            <Input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </Field>
          <Field label="Last name *">
            <Input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </Field>
          <Field label="Reg number *">
            <Input
              value={form.regNumber}
              onChange={(e) => setForm({ ...form, regNumber: e.target.value })}
              placeholder="SCT/211/0001/2024"
            />
          </Field>
          <Field label="Email *">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Gender">
            <Select
              value={form.gender}
              onValueChange={(v) => setForm({ ...form, gender: v as "male" | "female" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Department">
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
          </Field>
          <Field label="Year of study">
            <Select
              value={form.yearOfStudy}
              onValueChange={(v) => setForm({ ...form, yearOfStudy: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    Year {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Create student</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx) using the provided template. Rows are
            validated before import.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-dashed p-8 text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm">Drop your file here or click to browse</p>
          <p className="text-xs text-muted-foreground">.xlsx, max 5 MB</p>
        </div>
        <Button
          variant="link"
          className="justify-start px-0"
          onClick={() => toast.success("Template downloaded")}
        >
          <Download /> Download template
        </Button>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              toast.success("Imported 0 students (preview mode)");
              onOpenChange(false);
            }}
          >
            Validate & Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignSupervisorDialog({
  student,
  onClose,
  onAssign,
}: {
  student: Student | null;
  onClose: () => void;
  onAssign: (supId: string) => void;
}) {
  const [sup, setSup] = useState<string>("");
  if (!student) return null;
  return (
    <Dialog open={!!student} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Academic Supervisor</DialogTitle>
          <DialogDescription>
            Assigning supervisor for {student.firstName} {student.lastName} ({student.department}).
          </DialogDescription>
        </DialogHeader>
        <Select value={sup} onValueChange={setSup}>
          <SelectTrigger>
            <SelectValue placeholder="Select a supervisor" />
          </SelectTrigger>
          <SelectContent>
            {academicSupervisors
              .filter((a) => a.status === "active")
              .map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.title} {a.firstName} {a.lastName} — {a.department} (
                  {a.studentsAssigned}/{a.maxLoad})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!sup} onClick={() => onAssign(sup)}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
