import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  History,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  QrCode,
  ShieldCheck,
  FileText,
  Building2,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  settingsStore,
  useSettings,
  type DepartmentRecord,
  type Semester,
  type LetterTemplate,
} from "@/lib/settings-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "System Settings — Attachment Admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="System Settings"
        description="Institution-wide configuration for the attachment program."
      />
      <Tabs defaultValue="period" className="w-full">
        <TabsList className="flex w-full flex-wrap h-auto justify-start">
          <TabsTrigger value="period">
            <CalendarIcon className="size-4" /> Attachment Period
          </TabsTrigger>
          <TabsTrigger value="approvals">
            <ShieldCheck className="size-4" /> Approvals
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building2 className="size-4" /> Departments
          </TabsTrigger>
          <TabsTrigger value="letter">
            <FileText className="size-4" /> Letter Template
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="size-4" /> Version History
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="size-4" /> Branding & QR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="period" className="mt-4">
          <AttachmentPeriodTab />
        </TabsContent>
        <TabsContent value="approvals" className="mt-4">
          <ApprovalsTab />
        </TabsContent>
        <TabsContent value="departments" className="mt-4">
          <DepartmentsTab />
        </TabsContent>
        <TabsContent value="letter" className="mt-4">
          <LetterTemplateTab />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistoryTab />
        </TabsContent>
        <TabsContent value="branding" className="mt-4">
          <BrandingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------- Attachment Period -------------------- */

function AttachmentPeriodTab() {
  const { attachmentPeriod } = useSettings();
  const [academicYear, setAcademicYear] = useState(attachmentPeriod.academicYear);
  const [semester, setSemester] = useState<Semester>(attachmentPeriod.semester);
  const [startDate, setStartDate] = useState(attachmentPeriod.startDate);
  const [endDate, setEndDate] = useState(attachmentPeriod.endDate);

  function save() {
    if (!academicYear.trim()) {
      toast.error("Academic Year is required");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Start and End dates are required");
      return;
    }
    settingsStore.setAttachmentPeriod({
      academicYear: academicYear.trim(),
      semester,
      startDate,
      endDate,
    });
    toast.success("Attachment period saved");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attachment Period</CardTitle>
        <CardDescription>
          Sets the academic year, semester, and dates used across the entire system
          to scope reports, logbook records, and student data.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-2xl gap-4">
        <div className="grid gap-2">
          <Label htmlFor="ay">
            Academic Year <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ay"
            placeholder="e.g. 2024/2025"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>
            Semester <span className="text-destructive">*</span>
          </Label>
          <Select value={semester} onValueChange={(v) => setSemester(v as Semester)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="First Semester">First Semester</SelectItem>
              <SelectItem value="Second Semester">Second Semester</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="sd">Start Date</Label>
            <Input
              id="sd"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ed">End Date</Label>
            <Input
              id="ed"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="pt-2">
          <Button onClick={save}>
            <Save className="size-4" /> Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------- Approvals -------------------- */

function ApprovalsTab() {
  const [qr, setQr] = useState(true);
  const [otp, setOtp] = useState(true);
  const [manual, setManual] = useState(true);
  const [expiry, setExpiry] = useState("14");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Methods</CardTitle>
        <CardDescription>
          Configure how company supervisors confirm student placements.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-2xl gap-4">
        {[
          { label: "QR Code approval", v: qr, set: setQr, desc: "Supervisor scans QR on the letter." },
          { label: "OTP email/SMS approval", v: otp, set: setOtp, desc: "One-time code sent to the supervisor." },
          { label: "Manual admin override", v: manual, set: setManual, desc: "Admin records verbal/written confirmation." },
        ].map((r) => (
          <div key={r.label} className="flex items-start justify-between rounded-lg border p-3">
            <div>
              <div className="font-medium">{r.label}</div>
              <div className="text-xs text-muted-foreground">{r.desc}</div>
            </div>
            <Switch checked={r.v} onCheckedChange={r.set} />
          </div>
        ))}
        <div className="grid gap-2">
          <Label>Approval link expiry (days)</Label>
          <Input type="number" min="1" max="60" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
        <div>
          <Button onClick={() => toast.success("Approval settings saved")}>
            <Save className="size-4" /> Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------- Departments -------------------- */

function DepartmentsTab() {
  const { departments } = useSettings();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRecord | null>(null);
  const [deactivating, setDeactivating] = useState<DepartmentRecord | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Departments</CardTitle>
          <CardDescription>
            Official institution departments used in every department dropdown
            and filter across the system. Only Active departments appear in dropdowns.
          </CardDescription>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Add Department
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {departments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <Building2 className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No departments added yet. Add your first department to get started.
            </p>
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="size-4" /> Add Department
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.id}>
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
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(d);
                            setOpen(true);
                          }}
                        >
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
            <Button variant="outline" onClick={() => setDeactivating(null)}>
              Cancel
            </Button>
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
  const { departments } = useSettings();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset when opening
  useMemo(() => {
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
    if (code.length > 5) {
      setError("Code must be 5 characters or fewer.");
      return;
    }
    const upper = code.toUpperCase();
    const dup = departments.find(
      (d) => d.code.toUpperCase() === upper && d.id !== editing?.id,
    );
    if (dup) {
      setError(`Code "${upper}" already exists.`);
      return;
    }
    if (editing) {
      settingsStore.updateDepartment(editing.id, {
        name: name.trim(),
        code: upper,
        status: active ? "active" : "inactive",
      });
      toast.success("Department updated");
    } else {
      settingsStore.addDepartment(name.trim(), upper, active ? "active" : "inactive");
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
            Departments here power every department dropdown and filter across the system.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Department Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Department Code</Label>
            <Input
              value={code}
              maxLength={5}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save Department</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Letter Template -------------------- */

const TOKENS = [
  "{{REFERENCE_NO}}",
  "{{DATE}}",
  "{{STUDENT_NAME}}",
  "{{STUDENT_REG}}",
  "{{DEPARTMENT}}",
  "{{YEAR_OF_STUDY}}",
  "{{COMPANY_NAME}}",
  "{{ACADEMIC_SUPERVISOR}}",
  "{{START_DATE}}",
  "{{END_DATE}}",
  "{{SIGNATORY}}",
  "{{SIGNATORY_TITLE}}",
];

const SAMPLE: Record<string, string> = {
  "{{REFERENCE_NO}}": "MUST/IA/2025/0142",
  "{{DATE}}": new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  "{{STUDENT_NAME}}": "Jane Wanjiku",
  "{{STUDENT_REG}}": "CS/2021/0142",
  "{{DEPARTMENT}}": "Computer Science",
  "{{YEAR_OF_STUDY}}": "3rd Year",
  "{{COMPANY_NAME}}": "Safaricom PLC",
  "{{ACADEMIC_SUPERVISOR}}": "Dr. Peter Otieno",
  "{{START_DATE}}": "13 Jan 2025",
  "{{END_DATE}}": "18 Apr 2025",
  "{{SIGNATORY}}": "Dr. Jane Mwangi",
  "{{SIGNATORY_TITLE}}": "Director, Industrial Attachment",
};

function fillTokens(text: string) {
  return TOKENS.reduce((acc, t) => acc.split(t).join(SAMPLE[t] ?? t), text);
}

function LetterTemplateTab() {
  const { letterTemplate } = useSettings();
  const [tpl, setTpl] = useState<LetterTemplate>(letterTemplate);
  const [activeField, setActiveField] = useState<"body" | "header">("body");

  function insertToken(token: string) {
    if (activeField === "body") {
      setTpl({ ...tpl, body: tpl.body + " " + token });
    } else {
      setTpl({ ...tpl, institutionHeader: tpl.institutionHeader + " " + token });
    }
  }

  function save() {
    settingsStore.setLetterTemplate(tpl);
    toast.success("Letter template saved");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Template Editor</CardTitle>
          <CardDescription>
            Edit the letter template. Click a token to insert it into the active field.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-1.5">
            {TOKENS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => insertToken(t)}
                className="rounded-md border bg-muted px-2 py-1 font-mono text-xs hover:bg-accent"
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            <Label>Institution Header</Label>
            <Textarea
              rows={3}
              value={tpl.institutionHeader}
              onFocus={() => setActiveField("header")}
              onChange={(e) => setTpl({ ...tpl, institutionHeader: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Body</Label>
            <Textarea
              rows={14}
              value={tpl.body}
              onFocus={() => setActiveField("body")}
              onChange={(e) => setTpl({ ...tpl, body: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Signatory Name</Label>
              <Input
                value={tpl.signatory}
                onChange={(e) => setTpl({ ...tpl, signatory: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Signatory Title</Label>
              <Input
                value={tpl.signatoryTitle}
                onChange={(e) => setTpl({ ...tpl, signatoryTitle: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Button onClick={save}>
              <Save className="size-4" /> Save Template
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>Sample values are filled in for preview.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-white p-8 text-sm text-slate-900 shadow-sm">
            <div className="whitespace-pre-line text-center font-semibold leading-snug">
              {fillTokens(tpl.institutionHeader)}
            </div>
            <div className="mt-6 text-right font-mono text-xs leading-relaxed">
              <div>Ref: {SAMPLE["{{REFERENCE_NO}}"]}</div>
              <div>Date: {SAMPLE["{{DATE}}"]}</div>
            </div>
            <div className="mt-6 whitespace-pre-line leading-relaxed">
              {fillTokens(tpl.body)}
            </div>
            <div className="mt-10 flex items-end justify-between">
              <div className="flex size-20 items-center justify-center rounded border bg-slate-50 text-[10px] text-slate-500">
                QR
              </div>
              <div className="text-right text-xs text-slate-500">
                Generated by Attachment Admin
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Version History -------------------- */

function HistoryTab() {
  const { history } = useSettings();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Version History</CardTitle>
        <CardDescription>
          Every change made in System Settings is captured here and in Audit Logs.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  No changes recorded yet.
                </TableCell>
              </TableRow>
            )}
            {history.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(h.at).toLocaleString()}
                </TableCell>
                <TableCell>{h.actor}</TableCell>
                <TableCell>
                  <Badge variant="outline">{h.area}</Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{h.summary}</div>
                  {(h.oldValue || h.newValue) && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {h.oldValue && <span>From: {h.oldValue}</span>}
                      {h.oldValue && h.newValue && <span> · </span>}
                      {h.newValue && <span>To: {h.newValue}</span>}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* -------------------- Branding & QR -------------------- */

function BrandingTab() {
  const { branding } = useSettings();
  const [b, setB] = useState(branding);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding & QR</CardTitle>
        <CardDescription>Institution identity and QR approval base URL.</CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-2xl gap-4">
        <div className="grid gap-2">
          <Label>Institution Name</Label>
          <Input value={b.institutionName} onChange={(e) => setB({ ...b, institutionName: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label>Primary Color</Label>
          <div className="flex items-center gap-2">
            <Input type="color" className="h-10 w-16 p-1" value={b.primaryColor} onChange={(e) => setB({ ...b, primaryColor: e.target.value })} />
            <Input value={b.primaryColor} onChange={(e) => setB({ ...b, primaryColor: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <div className="font-medium">QR-based approvals</div>
            <div className="text-xs text-muted-foreground">Print QR codes on every letter.</div>
          </div>
          <Switch checked={b.qrEnabled} onCheckedChange={(v) => setB({ ...b, qrEnabled: v })} />
        </div>
        <div className="grid gap-2">
          <Label>QR Base URL</Label>
          <div className="flex items-center gap-2">
            <QrCode className="size-4 text-muted-foreground" />
            <Input value={b.qrBaseUrl} onChange={(e) => setB({ ...b, qrBaseUrl: e.target.value })} />
          </div>
        </div>
        <div>
          <Button
            onClick={() => {
              settingsStore.setBranding(b);
              toast.success("Branding settings saved");
            }}
          >
            <Save className="size-4" /> Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
