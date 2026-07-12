import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  X,
  AlertTriangle,
  CheckCircle2,
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  academicSupervisors,
  findAcademicSupervisor,
  findCompanySupervisor,
  findDepartmentById,
  findFacultyById,
  findProgrammeById,
  students as seedStudents,
  type Student,
} from "@/lib/mock-data";
import { AttachmentPill, StatusPill } from "@/components/status-pill";
import {
  useActiveDepartments,
  useActiveFaculties,
  useActiveProgrammes,
  useSettings,
} from "@/lib/settings-store";
import { LEVELS, isAttachmentEligible, type Level } from "@/lib/academic-structure";
import { appendAuditLog } from "@/lib/audit-logs-data";
import { ImportWizard } from "@/components/import-wizard";

export const Route = createFileRoute("/students")({
  head: () => ({ meta: [{ title: "Students — Attachment Admin" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    add: s.add === 1 || s.add === "1" || s.add === true ? 1 : undefined,
    view: typeof s.view === "string" && s.view.length > 0 ? s.view : undefined,
  }),
  component: StudentsPage,
});


const PAGE_SIZE = 25;

function StudentsPage() {
  const faculties = useActiveFaculties();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [data, setData] = useState<Student[]>(seedStudents);

  const [query, setQuery] = useState("");
  const [facultyId, setFacultyId] = useState("all");
  const [deptId, setDeptId] = useState("all");
  const [progId, setProgId] = useState("all");
  const [level, setLevel] = useState<string>("all");
  const [attachment, setAttachment] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const cascadeDepartments = useActiveDepartments(facultyId);
  const cascadeProgrammes = useActiveProgrammes(deptId);

  useEffect(() => {
    if (deptId !== "all" && !cascadeDepartments.find((d) => d.id === deptId)) setDeptId("all");
  }, [cascadeDepartments, deptId]);
  useEffect(() => {
    if (progId !== "all" && !cascadeProgrammes.find((p) => p.id === progId)) setProgId("all");
  }, [cascadeProgrammes, progId]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
  const [viewing, setViewing] = useState<Student | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (search.add) {
      setAddOpen(true);
      navigate({ search: { add: undefined, view: search.view }, replace: true });
    }
  }, [search.add, search.view, navigate]);
  useEffect(() => {
    if (search.view) {
      const s = seedStudents.find((x) => x.id === search.view);
      if (s) {
        setViewing(s);
        navigate({ search: { add: search.add, view: undefined }, replace: true });
      }
    }
  }, [search.view, search.add, navigate]);

  const [importOpen, setImportOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<Student | null>(null);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((s) => {
      if (facultyId !== "all" && s.facultyId !== facultyId) return false;
      if (deptId !== "all" && s.departmentId !== deptId) return false;
      if (progId !== "all" && s.programmeId !== progId) return false;
      if (level !== "all" && String(s.level) !== level) return false;
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
  }, [data, query, facultyId, deptId, progId, level, attachment, status]);

  useEffect(() => { setPage(1); }, [query, facultyId, deptId, progId, level, attachment, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((s) => selected.has(s.id));
  const anySelected = selected.size > 0;

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((s) => next.delete(s.id));
      else pageRows.forEach((s) => next.add(s.id));
      return next;
    });
    setSelectAllAcrossPages(false);
  };
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectAllAcrossPages(false);
      return next;
    });

  const selectAllFiltered = () => {
    setSelected(new Set(filtered.map((s) => s.id)));
    setSelectAllAcrossPages(true);
  };
  const clearSelection = () => {
    setSelected(new Set());
    setSelectAllAcrossPages(false);
  };

  const clearFilters = () => {
    setQuery("");
    setFacultyId("all");
    setDeptId("all");
    setProgId("all");
    setLevel("all");
    setAttachment("all");
    setStatus("all");
  };

  const bulkDeactivate = () => {
    setData((prev) =>
      prev.map((s) => (selected.has(s.id) ? { ...s, status: "inactive" as const } : s)),
    );
    toast.success(`Deactivated ${selected.size} student(s)`);
    clearSelection();
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

  const selectedStudents = data.filter((s) => selected.has(s.id));

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
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, reg number or email…"
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
              <Select value={facultyId} onValueChange={(v) => { setFacultyId(v); setDeptId("all"); setProgId("all"); }}>
                <SelectTrigger><SelectValue placeholder="All Faculties" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Faculties</SelectItem>
                  {faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={deptId} onValueChange={(v) => { setDeptId(v); setProgId("all"); }}>
                <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {cascadeDepartments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={progId} onValueChange={setProgId}>
                <SelectTrigger><SelectValue placeholder="All Programmes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programmes</SelectItem>
                  {cascadeProgrammes.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue placeholder="All Levels" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {LEVELS.map((l) => <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending Setup</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={attachment} onValueChange={setAttachment}>
                <SelectTrigger><SelectValue placeholder="All Attachment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Attachment</SelectItem>
                  <SelectItem value="not_placed">Not Placed</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="placed">Placed</SelectItem>
                  <SelectItem value="ongoing">On Attachment</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {anySelected && (
        <div className="sticky top-14 z-20 rounded-md border bg-primary/5 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="font-medium">
              {selected.size} student{selected.size === 1 ? "" : "s"} selected
            </span>
            <Separator orientation="vertical" className="h-4" />
            <Button size="sm" onClick={() => setBulkAssignOpen(true)}>
              <UserCog /> Assign Supervisor
            </Button>
            <Button size="sm" variant="outline" onClick={bulkDeactivate}>
              <UserMinus /> Deactivate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success(`Exported ${selected.size} student(s)`)}
            >
              <Download /> Export Selected
            </Button>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={clearSelection}>
              <X className="h-4 w-4" /> Clear
            </Button>
          </div>
          {allOnPageSelected && !selectAllAcrossPages && filtered.length > pageRows.length && (
            <div className="flex flex-wrap items-center gap-2 border-t bg-background/60 px-3 py-2 text-xs">
              <span>
                All {pageRows.length} students on this page are selected.
              </span>
              <Button size="sm" variant="link" className="h-auto p-0" onClick={selectAllFiltered}>
                Select all {filtered.length} students
              </Button>
            </div>
          )}
          {selectAllAcrossPages && (
            <div className="border-t bg-background/60 px-3 py-2 text-xs">
              All {selected.size} matching students are selected across all pages.
            </div>
          )}
        </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allOnPageSelected}
                  onCheckedChange={togglePage}
                  aria-label="Select all on page"
                />
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Attachment</TableHead>
              <TableHead>Supervisor</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((s) => {
              const sup = findAcademicSupervisor(s.academicSupervisorId);
              const fac = findFacultyById(s.facultyId);
              const prog = findProgrammeById(s.programmeId);
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(s.id)}
                      onCheckedChange={() => toggleOne(s.id)}
                      aria-label={`Select ${s.firstName} ${s.lastName}`}
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
                  <TableCell className="font-mono text-xs">{s.regNumber}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fac?.code ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{s.department}</TableCell>
                  <TableCell className="text-xs">
                    {prog ? (
                      <span>
                        <Badge variant="outline" className="mr-1 text-[10px]">{prog.type}</Badge>
                        {prog.name.replace(/^(HND |BTech |BSc |BA |Bachelor )/, "")}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{s.level}</TableCell>
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
                        <DropdownMenuItem onClick={() => setEditing(s)}>
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAssignFor(s)}>
                          <UserCog /> Assign supervisor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success("Password reset email sent")}>
                          <KeyRound /> Reset password
                        </DropdownMenuItem>
                        {s.status === "pending" && (
                          <DropdownMenuItem onClick={() => toast.success(`Setup invitation resent to ${s.email}`)}>
                            <Mail /> Resend Setup Invitation
                          </DropdownMenuItem>
                        )}
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
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="py-10 text-center text-muted-foreground">
                  No students match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {pageRows.length ? (page - 1) * PAGE_SIZE + 1 : 0}
            –{(page - 1) * PAGE_SIZE + pageRows.length} of {filtered.length} students
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      <StudentProfileDialog
        student={viewing}
        onClose={() => setViewing(null)}
      />
      <StudentFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(s) => {
          setData((prev) => [s, ...prev]);
          toast.success("Student created — welcome email sent");
        }}
      />
      <StudentFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        editing={editing ?? undefined}
        onSave={(s) => {
          setData((prev) => prev.map((x) => (x.id === s.id ? s : x)));
          setEditing(null);
          toast.success("Student updated");
        }}
      />
      <ImportWizard
        open={importOpen}
        onOpenChange={setImportOpen}
        entity="students"
        title="Import Students"
        templateFilename="HTU_IAMS_Student_Import_Template.xlsx"
        templateColumns={[
          "First Name","Last Name","Student ID","Email","Faculty","Department","Programme","Level","Phone","Programme Type",
        ]}
        sampleRow={[
          "Ama","Boateng","CS/2024/001","ama.boateng@example.com","Faculty of Applied Sciences and Technology","Computer Science","BSc Computer Science","200","0244000000","BSc",
        ]}
        previewColumns={["Name","Student ID","Department","Level"]}
        onConfirm={(count) => {
          const now = new Date().toISOString();
          const stub: Student[] = Array.from({ length: count }).map((_, i) => ({
            id: `imp-stu-${Date.now()}-${i}`,
            regNumber: `IMP/${Date.now().toString().slice(-4)}/${String(i + 1).padStart(3, "0")}`,
            firstName: `Imported${i + 1}`,
            lastName: "Student",
            email: `imported${i + 1}.${Date.now()}@htu.edu.gh`,
            phone: "",
            gender: "male",
            department: "Computer Science",
            facultyId: "fac-fast",
            departmentId: "dep-cs",
            programmeId: "prog-bsc-cs",
            programmeType: "BSc",
            level: 200,
            yearOfStudy: 2,
            passportPhoto: "",
            status: "pending",
            attachmentStatus: "not_placed",
            academicSupervisorId: null,
            companySupervisorId: null,
            companyName: null,
            startDate: null,
            endDate: null,
            applicationsCount: 0,
            logbookEntries: 0,
            lastLogbookAt: null,
            createdAt: now,
          }));
          setData((prev) => [...stub, ...prev]);
          toast.success(`${count} students imported successfully. They will receive a setup invitation email.`);
          appendAuditLog({
            actorName: "Admin User",
            actorEmail: "admin@htu.edu.gh",
            actorRole: "Administrator",
            action: "import",
            module: "students",
            target: `${count} students`,
            description: `Imported ${count} students via bulk upload (pending setup).`,
            severity: "info",
            metadata: { count },
          });
        }}
      />
      <AssignSupervisorDialog
        student={assignFor}
        onClose={() => setAssignFor(null)}
        onAssign={(supId) => {
          if (!assignFor) return;
          setData((prev) =>
            prev.map((x) =>
              x.id === assignFor.id ? { ...x, academicSupervisorId: supId } : x,
            ),
          );
          const sup = findAcademicSupervisor(supId);
          if (sup) {
            appendAuditLog({
              actorName: "Admin User",
              actorEmail: "admin@htu.edu.gh",
              actorRole: "Administrator",
              action: "assign",
              module: "students",
              target: `${assignFor.firstName} ${assignFor.lastName} → ${sup.title} ${sup.lastName}`,
              description: `Assigned ${assignFor.firstName} ${assignFor.lastName} to ${sup.title} ${sup.firstName} ${sup.lastName}.`,
              severity: "info",
            });
          }
          toast.success(`Assigned to ${sup?.title} ${sup?.lastName}`);
          setAssignFor(null);
        }}
      />
      <BulkAssignSupervisorDialog
        open={bulkAssignOpen}
        onOpenChange={setBulkAssignOpen}
        students={selectedStudents}
        onAssign={(supId) => {
          setData((prev) =>
            prev.map((x) =>
              selected.has(x.id) ? { ...x, academicSupervisorId: supId } : x,
            ),
          );
          const sup = findAcademicSupervisor(supId);
          const count = selected.size;
          if (sup) {
            appendAuditLog({
              actorName: "Admin User",
              actorEmail: "admin@htu.edu.gh",
              actorRole: "Administrator",
              action: "assign",
              module: "students",
              target: `${count} students → ${sup.title} ${sup.lastName}`,
              description: `Admin bulk-assigned ${count} students to ${sup.title} ${sup.firstName} ${sup.lastName}. Students: ${selectedStudents.map((s) => `${s.firstName} ${s.lastName}`).join(", ")}.`,
              severity: "info",
              metadata: { count, supervisor: `${sup.title} ${sup.firstName} ${sup.lastName}` },
            });
          }
          toast.success(
            `${count} student${count === 1 ? "" : "s"} successfully assigned to ${sup?.title} ${sup?.lastName}`,
          );
          clearSelection();
          setBulkAssignOpen(false);
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

function EligibilityBadge({ programmeType, level }: { programmeType?: string; level?: Level }) {
  const eligible = isAttachmentEligible(programmeType as never, level ?? null);
  return (
    <Badge
      variant="outline"
      className={
        eligible
          ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-muted text-muted-foreground"
      }
    >
      {eligible ? "Eligible for Attachment" : "Not Yet Eligible"}
    </Badge>
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
  const fac = findFacultyById(student.facultyId);
  const prog = findProgrammeById(student.programmeId);
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
              <div className="mt-1 flex flex-wrap gap-2">
                <StatusPill status={student.status} />
                <AttachmentPill status={student.attachmentStatus} />
                <EligibilityBadge programmeType={student.programmeType} level={student.level} />
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
              <InfoBlock icon={Mail} label="Email" value={student.email} />
              <InfoBlock icon={Phone} label="Phone" value={student.phone} />
              <InfoBlock icon={GraduationCap} label="Faculty" value={fac?.name ?? "—"} />
              <InfoBlock icon={Building2} label="Department" value={student.department} />
              <InfoBlock
                icon={BookOpen}
                label="Programme"
                value={prog ? `${prog.type} • ${prog.name}` : "—"}
              />
              <InfoBlock
                icon={GraduationCap}
                label="Level / Year"
                value={`Level ${student.level} • Y${student.yearOfStudy}`}
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

function StudentFormDialog({
  open,
  onOpenChange,
  editing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: Student;
  onSave: (s: Student) => void;
}) {
  const { faculties, departments, programmes } = useSettings();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    regNumber: "",
    email: "",
    phone: "",
    facultyId: "",
    departmentId: "",
    programmeId: "",
    level: 100 as Level,
    yearOfStudy: "1",
    gender: "female" as "female" | "male",
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          firstName: editing.firstName,
          lastName: editing.lastName,
          regNumber: editing.regNumber,
          email: editing.email,
          phone: editing.phone,
          facultyId: editing.facultyId,
          departmentId: editing.departmentId,
          programmeId: editing.programmeId,
          level: editing.level,
          yearOfStudy: String(editing.yearOfStudy),
          gender: editing.gender,
        });
      } else {
        setForm({
          firstName: "", lastName: "", regNumber: "", email: "", phone: "",
          facultyId: "", departmentId: "", programmeId: "",
          level: 100, yearOfStudy: "1", gender: "female",
        });
      }
    }
  }, [open, editing]);

  const facultyDepts = departments.filter(
    (d) => d.facultyId === form.facultyId && (d.status === "active" || d.id === editing?.departmentId),
  );
  const deptProgrammes = programmes.filter(
    (p) => p.departmentId === form.departmentId && (p.status === "active" || p.id === editing?.programmeId),
  );
  const selectedProgramme = programmes.find((p) => p.id === form.programmeId);

  const submit = () => {
    if (!form.firstName || !form.lastName || !form.regNumber || !form.email) {
      toast.error("Fill in all required fields");
      return;
    }
    if (!form.facultyId || !form.departmentId || !form.programmeId) {
      toast.error("Faculty, department, and programme are required");
      return;
    }
    const dept = departments.find((d) => d.id === form.departmentId)!;
    const prog = programmes.find((p) => p.id === form.programmeId)!;
    const base: Student = editing ?? {
      id: `st-new-${Date.now()}`,
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
      regNumber: form.regNumber,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      gender: form.gender,
      department: dept.name,
      facultyId: form.facultyId,
      departmentId: form.departmentId,
      programmeId: form.programmeId,
      programmeType: prog.type,
      level: form.level,
      yearOfStudy: Number(form.yearOfStudy) as 1 | 2 | 3 | 4,
    };
    const s: Student = {
      ...base,
      regNumber: form.regNumber,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      gender: form.gender,
      department: dept.name,
      facultyId: form.facultyId,
      departmentId: form.departmentId,
      programmeId: form.programmeId,
      programmeType: prog.type,
      level: form.level,
      yearOfStudy: Number(form.yearOfStudy) as 1 | 2 | 3 | 4,
    };
    onSave(s);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Student" : "Add Student"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the student's record." : "Creates the account and emails a temporary password."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          <Field label="First name *">
            <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Last name *">
            <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
          <Field label="Student ID *">
            <Input
              value={form.regNumber}
              onChange={(e) => setForm({ ...form, regNumber: e.target.value })}
              placeholder="HTU/CS/0001/2024"
            />
          </Field>
          <Field label="Email *">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Gender">
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as "male" | "female" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Faculty *">
            <Select
              value={form.facultyId}
              onValueChange={(v) => setForm({ ...form, facultyId: v, departmentId: "", programmeId: "" })}
            >
              <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
              <SelectContent>
                {faculties.filter((f) => f.status === "active").map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Department *">
            <Select
              value={form.departmentId}
              onValueChange={(v) => {
                const dept = departments.find((d) => d.id === v);
                setForm({
                  ...form,
                  departmentId: v,
                  facultyId: dept?.facultyId ?? form.facultyId,
                  programmeId: "",
                });
              }}
              disabled={!form.facultyId}
            >
              <SelectTrigger><SelectValue placeholder={form.facultyId ? "Select department" : "Select faculty first"} /></SelectTrigger>
              <SelectContent>
                {facultyDepts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Programme *">
            <Select
              value={form.programmeId}
              onValueChange={(v) => setForm({ ...form, programmeId: v })}
              disabled={!form.departmentId}
            >
              <SelectTrigger><SelectValue placeholder={form.departmentId ? "Select programme" : "Select department first"} /></SelectTrigger>
              <SelectContent>
                {deptProgrammes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>[{p.type}] {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Level *">
            <Select value={String(form.level)} onValueChange={(v) => setForm({ ...form, level: Number(v) as Level })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => <SelectItem key={l} value={String(l)}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Year of study">
            <Select value={form.yearOfStudy} onValueChange={(v) => setForm({ ...form, yearOfStudy: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <EligibilityBadge programmeType={selectedProgramme?.type} level={form.level} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{editing ? "Save changes" : "Create student"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}


/* -------- Single-student Assign Supervisor with Recommended / Other Faculties -------- */

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (student) { setSup(""); setSearch(""); setConfirmOpen(false); }
  }, [student]);

  if (!student) return null;
  const fac = findFacultyById(student.facultyId);

  const active = academicSupervisors.filter((a) => a.status === "active");
  const q = search.trim().toLowerCase();
  const matches = (a: typeof active[number]) =>
    !q ||
    a.firstName.toLowerCase().includes(q) ||
    a.lastName.toLowerCase().includes(q) ||
    a.department.toLowerCase().includes(q);
  const recommended = active.filter((a) => a.facultyId === student.facultyId && matches(a));
  const others = active.filter((a) => a.facultyId !== student.facultyId && matches(a));
  const picked = academicSupervisors.find((a) => a.id === sup);

  return (
    <Dialog open={!!student} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Academic Supervisor</DialogTitle>
          <DialogDescription>
            Assigning supervisor for {student.firstName} {student.lastName} ({student.department} — Level {student.level}).
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search supervisors…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-h-72 space-y-3 overflow-y-auto">
          <SupervisorGroup
            heading={`RECOMMENDED (${fac?.name ?? "same faculty"})`}
            list={recommended}
            selectedId={sup}
            onSelect={setSup}
            emptyLabel="No same-faculty supervisors available."
          />
          <SupervisorGroup
            heading="OTHER FACULTIES"
            list={others}
            selectedId={sup}
            onSelect={setSup}
            emptyLabel="No other supervisors match."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!sup} onClick={() => setConfirmOpen(true)}>Assign</Button>
        </DialogFooter>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Confirm assignment"
          message={
            picked
              ? `Assign ${picked.title} ${picked.firstName} ${picked.lastName} to ${student.firstName} ${student.lastName}?`
              : ""
          }
          confirmLabel="Confirm Assignment"
          onConfirm={() => { onAssign(sup); setConfirmOpen(false); }}
        />
      </DialogContent>
    </Dialog>
  );
}

function SupervisorGroup({
  heading,
  list,
  selectedId,
  onSelect,
  emptyLabel,
}: {
  heading: string;
  list: typeof academicSupervisors;
  selectedId: string;
  onSelect: (id: string) => void;
  emptyLabel: string;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {heading}
      </div>
      <div className="rounded-md border">
        {list.length === 0 ? (
          <div className="p-3 text-center text-xs text-muted-foreground">{emptyLabel}</div>
        ) : (
          list.map((a) => {
            const overloaded = a.studentsAssigned >= 20;
            const active = selectedId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelect(a.id)}
                className={`flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/60 ${
                  active ? "bg-primary/10" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {a.title} {a.firstName} {a.lastName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {a.department} • {a.studentsAssigned} students
                  </div>
                </div>
                {overloaded && (
                  <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    <AlertTriangle className="mr-1 h-3 w-3" /> High load
                  </Badge>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function BulkAssignSupervisorDialog({
  open,
  onOpenChange,
  students,
  onAssign,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  students: Student[];
  onAssign: (supId: string) => void;
}) {
  const [sup, setSup] = useState<string>("");
  const [search, setSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) { setSup(""); setSearch(""); setConfirmOpen(false); }
  }, [open]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return academicSupervisors
      .filter((a) => a.status === "active")
      .filter((a) => {
        if (!q) return true;
        return (
          a.firstName.toLowerCase().includes(q) ||
          a.lastName.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          a.staffNumber.toLowerCase().includes(q)
        );
      });
  }, [search]);

  const alreadyAssignedCount = students.filter((s) => s.academicSupervisorId).length;
  const picked = academicSupervisors.find((a) => a.id === sup);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Academic Supervisor</DialogTitle>
          <DialogDescription>
            Assigning supervisor to {students.length} selected student{students.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">Selected Students:</div>
          <div className="max-h-40 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm">
            <ul className="space-y-1">
              {students.slice(0, 20).map((s) => {
                const prog = findProgrammeById(s.programmeId);
                const dept = findDepartmentById(s.departmentId);
                return (
                  <li key={s.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="font-medium">{s.firstName} {s.lastName}</span>
                    <span className="text-muted-foreground text-xs">
                      — {dept?.name ?? s.department} — Level {s.level}
                      {prog ? ` (${prog.type})` : ""}
                    </span>
                  </li>
                );
              })}
              {students.length > 20 && (
                <li className="pl-3.5 text-xs text-muted-foreground">+ {students.length - 20} more</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Select Academic Supervisor</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search and select a supervisor…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Admin can assign any supervisor to any student — there is no faculty restriction.
          </p>
          <div className="max-h-56 overflow-y-auto rounded-md border">
            {list.map((a) => {
              const active = sup === a.id;
              const overloaded = a.studentsAssigned >= 20;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSup(a.id)}
                  className={`flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/60 ${
                    active ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {a.title} {a.firstName} {a.lastName}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {a.department} • {a.studentsAssigned} students
                    </div>
                  </div>
                  {overloaded && (
                    <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                      <AlertTriangle className="mr-1 h-3 w-3" /> High load
                    </Badge>
                  )}
                </button>
              );
            })}
            {list.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">No supervisors match.</div>
            )}
          </div>
        </div>

        {alreadyAssignedCount > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <strong>Note:</strong> {alreadyAssignedCount} of these students already have a supervisor assigned.
              Proceeding will replace their current supervisor with the new one.
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!sup || students.length === 0}
            onClick={() => setConfirmOpen(true)}
          >
            Assign to All ({students.length})
          </Button>
        </DialogFooter>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Confirm bulk assignment"
          message={
            picked
              ? `Assign ${picked.title} ${picked.firstName} ${picked.lastName} to ${students.length} student${students.length === 1 ? "" : "s"}? This cannot be undone without reassigning each student individually.`
              : ""
          }
          confirmLabel="Confirm Assignment"
          onConfirm={() => { onAssign(sup); setConfirmOpen(false); }}
        />
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
