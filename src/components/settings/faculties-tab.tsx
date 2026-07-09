import { useEffect, useState } from "react";
import { CheckCircle2, MoreHorizontal, Pencil, Plus, ShieldCheck, Landmark } from "lucide-react";
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { settingsStore, useSettings, type FacultyRecord } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

export function FacultiesTab() {
  const { faculties } = useSettings();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FacultyRecord | null>(null);
  const [deactivating, setDeactivating] = useState<FacultyRecord | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Faculties</CardTitle>
          <CardDescription>
            Official institution faculties. Each department belongs to exactly one faculty.
            Only Active faculties appear in dropdowns.
          </CardDescription>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="size-4" /> Add Faculty
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {faculties.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <Landmark className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No faculties added yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faculties.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="font-mono text-xs">{f.code}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        f.status === "active"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {f.status}
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
                        <DropdownMenuItem onClick={() => { setEditing(f); setOpen(true); }}>
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        {f.status === "active" ? (
                          <DropdownMenuItem onClick={() => setDeactivating(f)}>
                            <ShieldCheck className="size-4" /> Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              settingsStore.updateFaculty(f.id, { status: "active" });
                              toast.success(`${f.name} reactivated`);
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

      <FacultyDialog open={open} onOpenChange={setOpen} editing={editing} />

      <Dialog open={!!deactivating} onOpenChange={(o) => !o && setDeactivating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate faculty?</DialogTitle>
            <DialogDescription>
              Deactivating this faculty will hide it from all dropdowns.
              Existing records are not affected. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivating(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deactivating) {
                  settingsStore.updateFaculty(deactivating.id, { status: "inactive" });
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

function FacultyDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: FacultyRecord | null;
}) {
  const { faculties } = useSettings();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setCode(editing?.code ?? "");
      setActive(editing ? editing.status === "active" : true);
      setError(null);
    }
  }, [open, editing]);

  function save() {
    setError(null);
    if (!name.trim() || !code.trim()) {
      setError("Name and code are required.");
      return;
    }
    if (code.length > 6) {
      setError("Code must be 6 characters or fewer.");
      return;
    }
    const upper = code.toUpperCase();
    const dup = faculties.find((f) => f.code.toUpperCase() === upper && f.id !== editing?.id);
    if (dup) {
      setError(`Code "${upper}" already exists.`);
      return;
    }
    if (editing) {
      settingsStore.updateFaculty(editing.id, {
        name: name.trim(),
        code: upper,
        status: active ? "active" : "inactive",
      });
      toast.success("Faculty updated");
    } else {
      settingsStore.addFaculty(name.trim(), upper, active ? "active" : "inactive");
      toast.success("Faculty added");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Faculty" : "Add Faculty"}</DialogTitle>
          <DialogDescription>
            Faculties are the top-level academic unit. Each department belongs to one.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Faculty Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Faculty Code</Label>
            <Input
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. FAST"
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
          <Button onClick={save}>Save Faculty</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
