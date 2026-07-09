import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, MoreHorizontal, Pencil, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  settingsStore, useSettings, type ProgrammeRecord, type ProgrammeType,
} from "@/lib/settings-store";
import { PROGRAMME_TYPES } from "@/lib/academic-structure";
import { cn } from "@/lib/utils";

export function ProgrammesTab() {
  const { programmes, departments, faculties } = useSettings();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProgrammeRecord | null>(null);

  const [filterFaculty, setFilterFaculty] = useState<string>("all");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const facultyDepartments = useMemo(
    () => departments.filter((d) => filterFaculty === "all" || d.facultyId === filterFaculty),
    [departments, filterFaculty],
  );

  useEffect(() => {
    if (filterDept !== "all" && !facultyDepartments.find((d) => d.id === filterDept)) {
      setFilterDept("all");
    }
  }, [facultyDepartments, filterDept]);

  const visible = programmes.filter((p) => {
    if (filterFaculty !== "all" && p.facultyId !== filterFaculty) return false;
    if (filterDept !== "all" && p.departmentId !== filterDept) return false;
    if (filterType !== "all" && p.type !== filterType) return false;
    return true;
  });

  const facultyName = (id: string) => faculties.find((f) => f.id === id)?.name ?? "—";
  const departmentName = (id: string) => departments.find((d) => d.id === id)?.name ?? "—";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>Programmes</CardTitle>
            <CardDescription>
              Every programme belongs to a department. Attachment eligibility is derived
              from a programme's type and the student's level.
            </CardDescription>
          </div>
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="size-4" /> Add Programme
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterFaculty} onValueChange={(v) => { setFilterFaculty(v); setFilterDept("all"); }}>
            <SelectTrigger className="w-56"><SelectValue placeholder="All Faculties" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculties</SelectItem>
              {faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-56"><SelectValue placeholder="All Departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {facultyDepartments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PROGRAMME_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <BookOpen className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No programmes match your filters.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Programme Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm text-muted-foreground">{facultyName(p.facultyId)}</TableCell>
                  <TableCell className="text-sm">{departmentName(p.departmentId)}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        p.status === "active"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(p); setOpen(true); }}>
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        {p.status === "active" ? (
                          <DropdownMenuItem onClick={() => {
                            settingsStore.updateProgramme(p.id, { status: "inactive" });
                            toast.success(`${p.name} deactivated`);
                          }}>
                            <ShieldCheck className="size-4" /> Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => {
                            settingsStore.updateProgramme(p.id, { status: "active" });
                            toast.success(`${p.name} reactivated`);
                          }}>
                            <CheckCircle2 className="size-4" /> Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ProgrammeDialog open={open} onOpenChange={setOpen} editing={editing} />
    </Card>
  );
}

function ProgrammeDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: ProgrammeRecord | null;
}) {
  const { faculties, departments } = useSettings();
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<ProgrammeType>("BSc");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFacultyId(editing?.facultyId ?? faculties[0]?.id ?? "");
      setDepartmentId(editing?.departmentId ?? "");
      setName(editing?.name ?? "");
      setType(editing?.type ?? "BSc");
      setActive(editing ? editing.status === "active" : true);
      setError(null);
    }
  }, [open, editing, faculties]);

  const facultyDepts = departments.filter(
    (d) => d.facultyId === facultyId && (d.status === "active" || d.id === editing?.departmentId),
  );

  function save() {
    setError(null);
    if (!facultyId || !departmentId) { setError("Faculty and department are required."); return; }
    if (!name.trim()) { setError("Programme name is required."); return; }

    if (editing) {
      settingsStore.updateProgramme(editing.id, {
        facultyId, departmentId, name: name.trim(), type,
        status: active ? "active" : "inactive",
      });
      toast.success("Programme updated");
    } else {
      settingsStore.addProgramme(departmentId, name.trim(), type, active ? "active" : "inactive");
      toast.success("Programme added");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Programme" : "Add Programme"}</DialogTitle>
          <DialogDescription>
            Assign the programme to a faculty and department; pick its type.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Faculty</Label>
            <Select value={facultyId} onValueChange={(v) => { setFacultyId(v); setDepartmentId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
              <SelectContent>
                {faculties.filter((f) => f.status === "active" || f.id === editing?.facultyId).map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId} disabled={!facultyId}>
              <SelectTrigger><SelectValue placeholder={facultyId ? "Select department" : "Select faculty first"} /></SelectTrigger>
              <SelectContent>
                {facultyDepts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Programme Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BSc Computer Science" />
          </div>
          <div className="grid gap-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ProgrammeType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROGRAMME_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">Status</div>
              <div className="text-xs text-muted-foreground">
                {active ? "Active — appears in dropdowns." : "Inactive — hidden from dropdowns."}
              </div>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save Programme</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
