import { useEffect, useState } from "react";
import { Building2, CheckCircle2, MoreHorizontal, Pencil, Plus, ShieldCheck } from "lucide-react";
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
import { settingsStore, useSettings, type DepartmentRecord } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

export function DepartmentsTab() {
  const { departments, faculties } = useSettings();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRecord | null>(null);
  const [deactivating, setDeactivating] = useState<DepartmentRecord | null>(null);
  const [filterFaculty, setFilterFaculty] = useState<string>("all");

  const visible = departments.filter((d) => filterFaculty === "all" || d.facultyId === filterFaculty);
  const facultyName = (id: string) => faculties.find((f) => f.id === id)?.name ?? "—";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Departments</CardTitle>
          <CardDescription>
            Departments belong to a faculty and power every department dropdown across the system.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterFaculty} onValueChange={setFilterFaculty}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All faculties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All faculties</SelectItem>
              {faculties.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="size-4" /> Add Department
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <Building2 className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No departments in this faculty yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-sm text-muted-foreground">{facultyName(d.facultyId)}</TableCell>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="font-mono text-xs">{d.code}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        d.status === "active"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {d.status}
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
                        <DropdownMenuItem onClick={() => { setEditing(d); setOpen(true); }}>
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        {d.status === "active" ? (
                          <DropdownMenuItem onClick={() => setDeactivating(d)}>
                            <ShieldCheck className="size-4" /> Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              settingsStore.updateDepartment(d.id, { status: "active" });
                              toast.success(`${d.name} reactivated`);
                            }}
                          >
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

      <DepartmentDialog open={open} onOpenChange={setOpen} editing={editing} />

      <Dialog open={!!deactivating} onOpenChange={(o) => !o && setDeactivating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate department?</DialogTitle>
            <DialogDescription>
              Deactivating this department will hide it from all dropdowns.
              Existing student records will not be affected. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivating(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deactivating) {
                  settingsStore.updateDepartment(deactivating.id, { status: "inactive" });
                  toast.success(`${deactivating.name} deactivated`);
                  setDeactivating(null);
                }
              }}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function DepartmentDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: DepartmentRecord | null;
}) {
  const { departments, faculties } = useSettings();
  const [facultyId, setFacultyId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFacultyId(editing?.facultyId ?? faculties[0]?.id ?? "");
      setName(editing?.name ?? "");
      setCode(editing?.code ?? "");
      setActive(editing ? editing.status === "active" : true);
      setError(null);
    }
  }, [open, editing, faculties]);

  function save() {
    setError(null);
    if (!facultyId) { setError("Faculty is required."); return; }
    if (!name.trim() || !code.trim()) { setError("Name and code are required."); return; }
    if (code.length > 6) { setError("Code must be 6 characters or fewer."); return; }
    const upper = code.toUpperCase();
    const dup = departments.find((d) => d.code.toUpperCase() === upper && d.id !== editing?.id);
    if (dup) { setError(`Code "${upper}" already exists.`); return; }

    if (editing) {
      settingsStore.updateDepartment(editing.id, {
        facultyId,
        name: name.trim(),
        code: upper,
        status: active ? "active" : "inactive",
      });
      toast.success("Department updated");
    } else {
      settingsStore.addDepartment(facultyId, name.trim(), upper, active ? "active" : "inactive");
      toast.success("Department added");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Department" : "Add Department"}</DialogTitle>
          <DialogDescription>
            Departments belong to a faculty and appear in every department dropdown.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Faculty</Label>
            <Select value={facultyId} onValueChange={setFacultyId}>
              <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
              <SelectContent>
                {faculties.filter((f) => f.status === "active" || f.id === editing?.facultyId).map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Department Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Department Code</Label>
            <Input
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. CS"
            />
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
          <Button onClick={save}>Save Department</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
