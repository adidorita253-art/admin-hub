import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  academicSupervisors,
  findDepartmentById,
  findFacultyById,
  findProgrammeById,
  type Student,
} from "@/lib/mock-data";

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

export function SupervisorGroup({
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

/** Single-student assign supervisor dialog. Shared by Students page and Application Detail page. */
export function AssignSupervisorDialog({
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
  const [override, setOverride] = useState(false);

  useEffect(() => {
    if (student) {
      setSup("");
      setSearch("");
      setConfirmOpen(false);
      setOverride(false);
    }
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
  const sameFaculty = active.filter((a) => a.facultyId === student.facultyId && matches(a));
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
            heading={`Supervisors — ${fac?.name ?? "same faculty"}`}
            list={sameFaculty}
            selectedId={sup}
            onSelect={setSup}
            emptyLabel={`No supervisors found in ${fac?.name ?? "this faculty"}. Use the override option below to assign from another faculty.`}
          />

          <div>
            <button
              type="button"
              onClick={() => setOverride((v) => !v)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {override ? "▾" : "▸"} Assign supervisor from a different faculty (Override)
            </button>
            {override && (
              <div className="mt-2">
                <SupervisorGroup
                  heading="Other Faculties (Override)"
                  list={others}
                  selectedId={sup}
                  onSelect={setSup}
                  emptyLabel="No other supervisors match."
                />
              </div>
            )}
          </div>
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

/** Bulk assign supervisor dialog for multiple students. */
export function BulkAssignSupervisorDialog({
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
  const [override, setOverride] = useState(false);

  useEffect(() => {
    if (open) {
      setSup("");
      setSearch("");
      setConfirmOpen(false);
      setOverride(false);
    }
  }, [open]);

  const facultyIds = Array.from(new Set(students.map((s) => s.facultyId).filter(Boolean)));
  const mixedFaculties = facultyIds.length > 1;
  const sharedFacultyId = facultyIds.length === 1 ? facultyIds[0] : null;
  const sharedFaculty = sharedFacultyId ? findFacultyById(sharedFacultyId) : null;

  const q = search.trim().toLowerCase();
  const matchesSearch = (a: typeof academicSupervisors[number]) =>
    !q ||
    a.firstName.toLowerCase().includes(q) ||
    a.lastName.toLowerCase().includes(q) ||
    a.department.toLowerCase().includes(q) ||
    a.staffNumber.toLowerCase().includes(q);

  const activeSups = academicSupervisors.filter((a) => a.status === "active");
  const sameFaculty = useMemo(
    () => (sharedFacultyId ? activeSups.filter((a) => a.facultyId === sharedFacultyId && matchesSearch(a)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sharedFacultyId, search, activeSups],
  );
  const otherFaculty = useMemo(
    () => (sharedFacultyId ? activeSups.filter((a) => a.facultyId !== sharedFacultyId && matchesSearch(a)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sharedFacultyId, search, activeSups],
  );

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
                const sFac = findFacultyById(s.facultyId);
                return (
                  <li key={s.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="font-medium">{s.firstName} {s.lastName}</span>
                    <span className="text-muted-foreground text-xs">
                      — {sFac?.name ?? ""} · {dept?.name ?? s.department} · Level {s.level}
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

        {mixedFaculties ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <strong>Selected students are from different faculties.</strong> For accurate
              assignment, please select students from the same faculty and assign separately.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-xs">Select Academic Supervisor</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search supervisors…"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Showing supervisors from {sharedFaculty?.name ?? "the selected students' faculty"}.
            </p>

            <div className="max-h-56 space-y-3 overflow-y-auto">
              <SupervisorGroup
                heading={`Supervisors — ${sharedFaculty?.name ?? "same faculty"}`}
                list={sameFaculty}
                selectedId={sup}
                onSelect={setSup}
                emptyLabel={`No supervisors found in ${sharedFaculty?.name ?? "this faculty"}. Add supervisors to this faculty first or use the override option below.`}
              />

              <div>
                <button
                  type="button"
                  onClick={() => setOverride((v) => !v)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {override ? "▾" : "▸"} Assign from a different faculty (Override)
                </button>
                {override && (
                  <div className="mt-2">
                    <SupervisorGroup
                      heading="Other Faculties (Override)"
                      list={otherFaculty}
                      selectedId={sup}
                      onSelect={setSup}
                      emptyLabel="No other supervisors match."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {alreadyAssignedCount > 0 && !mixedFaculties && (
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
            disabled={!sup || students.length === 0 || mixedFaculties}
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
