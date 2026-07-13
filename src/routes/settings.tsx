import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calendar as CalendarIcon,
  History,
  Palette,
  QrCode,
  ShieldCheck,
  FileText,
  Building2,
  BookOpen,
  Landmark,
  Save,
  KeyRound,
} from "lucide-react";
import { appendAuditLog } from "@/lib/audit-logs-data";
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
import { toast } from "sonner";
import {
  settingsStore,
  useSettings,
  type Semester,
  type LetterTemplate,
} from "@/lib/settings-store";
import { FacultiesTab } from "@/components/settings/faculties-tab";
import { DepartmentsTab } from "@/components/settings/departments-tab";
import { ProgrammesTab } from "@/components/settings/programmes-tab";

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
          <TabsTrigger value="faculties">
            <Landmark className="size-4" /> Faculties
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building2 className="size-4" /> Departments
          </TabsTrigger>
          <TabsTrigger value="programmes">
            <BookOpen className="size-4" /> Programmes
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
          <TabsTrigger value="account">
            <KeyRound className="size-4" /> Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="period" className="mt-4">
          <AttachmentPeriodTab />
        </TabsContent>
        <TabsContent value="approvals" className="mt-4">
          <ApprovalsTab />
        </TabsContent>
        <TabsContent value="faculties" className="mt-4">
          <FacultiesTab />
        </TabsContent>
        <TabsContent value="departments" className="mt-4">
          <DepartmentsTab />
        </TabsContent>
        <TabsContent value="programmes" className="mt-4">
          <ProgrammesTab />
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
        <TabsContent value="account" className="mt-4">
          <AccountTab />
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

/* -------------------- Letter Template -------------------- */

const TOKENS = [
  "{{STUDENT_NAME}}",
  "{{STUDENT_ID}}",
  "{{PROGRAMME}}",
  "{{PROGRAMME_TYPE}}",
  "{{LEVEL}}",
  "{{TELEPHONE}}",
  "{{COMPANY_NAME}}",
  "{{COMPANY_LOCATION}}",
  "{{START_DATE}}",
  "{{END_DATE}}",
  "{{REFERENCE_NO}}",
  "{{APPROVAL_LINK}}",
  "{{CONTACT_PHONE}}",
  "{{CONTACT_EMAIL}}",
];

const SAMPLE: Record<string, string> = {
  "{{STUDENT_NAME}}": "KWAME MENSAH",
  "{{STUDENT_ID}}": "HTU/2024/00142",
  "{{PROGRAMME}}": "Computer Science",
  "{{PROGRAMME_TYPE}}": "HND",
  "{{LEVEL}}": "200",
  "{{TELEPHONE}}": "024 123 4567",
  "{{COMPANY_NAME}}": "MTN Ghana",
  "{{COMPANY_LOCATION}}": "Accra, Ghana",
  "{{START_DATE}}": "23 May 2025",
  "{{END_DATE}}": "18 July 2025",
  "{{REFERENCE_NO}}": "HTU/IA/2025/CS/0042",
  "{{APPROVAL_LINK}}": "https://attach.htu.edu.gh/approve/abc123",
  "{{CONTACT_PHONE}}": "+233-3620-27803",
  "{{CONTACT_EMAIL}}": "industrialiaison@htu.edu.gh",
  "{{DATE}}": "06 July 2026",
  "{{ACADEMIC_SUPERVISOR}}": "Dr. Akosua Mensah",
  "{{DEPARTMENT}}": "Computer Science",
  "{{STUDENT_REG}}": "CS/2024/00142",
  "{{YEAR_OF_STUDY}}": "2nd Year",
};

function fillTokens(text: string) {
  let out = text;
  for (const [tok, val] of Object.entries(SAMPLE)) {
    out = out.split(tok).join(val);
  }
  return out.replace(/\{\{[A-Z0-9_]+\}\}/g, "[SAMPLE VALUE]");
}

const DEFAULT_TEMPLATE: LetterTemplate = {
  institutionHeader:
    "HO TECHNICAL UNIVERSITY\nCareer Placement and Counselling\nP.O. Box HP 217, Ho - Ghana\nTel: +233-3620-27803/26456 · Mobile: 024 4979211\nE-mail: industrialliaison@htu.edu.gh · Website: www.htu.edu.gh",
  salutation: "Dear Sir/Madam,",
  subject: "INDUSTRIAL ATTACHMENT FOR HND STUDENTS",
  body: `We wish to introduce {{STUDENT_NAME}}, a level {{LEVEL}} {{PROGRAMME_TYPE}} {{PROGRAMME}} student (ID No. {{STUDENT_ID}}), to you for Industrial Attachment in your organization. Industrial Attachment is mandatory for all students to enable them get hands-on experience in their area of study.

The Industrial Attachment is expected to commence from {{START_DATE}} and end on {{END_DATE}}. It would be appreciated if {{STUDENT_NAME}} is given the opportunity to work in various sections of the organization to gain the required experience.

We hope this opportunity would predispose our student to life in the industry or organization.

For further inquiries, contact us on {{CONTACT_PHONE}} or email us through: {{CONTACT_EMAIL}}.`,
  closing: "Thank you.\n\nYours faithfully,",
  ccLine: "Vice Chancellor, Pro-Vice Chancellor, Registrar",
  signatory: "JOHNSON ABOAGYE",
  signatoryTitle: "(Ag. Director, Career Placement & Counselling)",
  effectiveDate: "2025-01-01",
  version: "v1",
};

function bumpVersion(v: string): string {
  const m = v.match(/^v(\d+)$/i);
  return m ? `v${parseInt(m[1], 10) + 1}` : "v1";
}

function LetterTemplateTab() {
  const { letterTemplate } = useSettings();
  const [tpl, setTpl] = useState<LetterTemplate>(letterTemplate);
  const [activeField, setActiveField] = useState<"body" | "subject" | "closing" | "cc">("body");

  function insertToken(token: string) {
    const map = {
      body: () => setTpl({ ...tpl, body: tpl.body + " " + token }),
      subject: () => setTpl({ ...tpl, subject: tpl.subject + " " + token }),
      closing: () => setTpl({ ...tpl, closing: tpl.closing + " " + token }),
      cc: () => setTpl({ ...tpl, ccLine: tpl.ccLine + " " + token }),
    };
    map[activeField]();
  }

  function saveAsNewVersion() {
    const next: LetterTemplate = {
      ...tpl,
      version: bumpVersion(tpl.version),
      effectiveDate: tpl.effectiveDate || new Date().toISOString().slice(0, 10),
    };
    settingsStore.setLetterTemplate(next);
    setTpl(next);
    toast.success(`Letter template saved as ${next.version}`);
  }

  function resetToDefault() {
    setTpl({ ...DEFAULT_TEMPLATE, version: tpl.version, effectiveDate: tpl.effectiveDate });
    toast.success("Reset to default (unsaved)");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle>Introduction Letter Template</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-1.5">
              <span>Current active version:</span>
              <Badge variant="secondary" className="font-mono">
                {letterTemplate.version}
              </Badge>
              <span>
                · effective {letterTemplate.effectiveDate}. Saving creates a new version with the
                effective date below.
              </span>
            </CardDescription>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              <History className="size-4" /> Reset to default
            </Button>
            <Button size="sm" onClick={saveAsNewVersion}>
              <Save className="size-4" /> Save as new version
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 rounded-md border bg-muted/40 p-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="effective-date">Effective Date</Label>
              <Input
                id="effective-date"
                type="date"
                value={tpl.effectiveDate}
                onChange={(e) => setTpl({ ...tpl, effectiveDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="change-note">Change Note (optional)</Label>
              <Input
                id="change-note"
                placeholder="e.g. Updated registrar signatory"
                value={tpl.changeNote ?? ""}
                onChange={(e) => setTpl({ ...tpl, changeNote: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Recipient Salutation</Label>
              <Input
                value={tpl.salutation}
                onChange={(e) => setTpl({ ...tpl, salutation: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Subject Line</Label>
              <Input
                value={tpl.subject}
                onFocus={() => setActiveField("subject")}
                onChange={(e) => setTpl({ ...tpl, subject: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Letter Body</Label>
            <Textarea
              rows={10}
              value={tpl.body}
              onFocus={() => setActiveField("body")}
              onChange={(e) => setTpl({ ...tpl, body: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Insert token:</Label>
            <div className="flex flex-wrap gap-1.5">
              {TOKENS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => insertToken(t)}
                  className="rounded-full border bg-muted px-2.5 py-1 font-mono text-[11px] hover:bg-accent"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Closing</Label>
              <Textarea
                rows={3}
                value={tpl.closing}
                onFocus={() => setActiveField("closing")}
                onChange={(e) => setTpl({ ...tpl, closing: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>CC Line</Label>
              <Textarea
                rows={3}
                value={tpl.ccLine}
                onFocus={() => setActiveField("cc")}
                onChange={(e) => setTpl({ ...tpl, ccLine: e.target.value })}
              />
            </div>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Preview (draft)</CardTitle>
          <CardDescription>Sample values are filled in for preview.</CardDescription>
        </CardHeader>
        <CardContent>
          <LetterPreviewDraft tpl={tpl} />
        </CardContent>
      </Card>
    </div>
  );
}

function LetterPreviewDraft({ tpl }: { tpl: LetterTemplate }) {
  const [headerLine1, ...headerRest] = tpl.institutionHeader.split("\n");
  const departmentLine = headerRest[0] ?? "";
  const contactBlock = headerRest.slice(1).join("\n");
  return (
    <div className="max-h-[900px] overflow-y-auto rounded-md border bg-slate-100 p-4">
      <div className="mx-auto max-w-[720px] rounded-md border bg-white p-10 font-serif text-[13px] leading-relaxed text-slate-900 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 pb-3">
          <div className="flex items-start gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-blue-900 bg-blue-950 text-[9px] font-bold text-yellow-400">
              HTU
            </div>
            <div className="text-lg font-bold leading-tight text-blue-950">
              {headerLine1}
            </div>
          </div>
          <div className="whitespace-pre-line text-right text-[11px] leading-snug text-slate-700">
            <div className="font-semibold text-slate-900">{departmentLine}</div>
            {contactBlock}
          </div>
        </div>
        <div className="border-t border-slate-400" />

        {/* Ref & Date */}
        <div className="mt-4 text-right text-[12px]">
          <div>
            <span className="font-semibold">Ref:</span> {SAMPLE["{{REFERENCE_NO}}"]}
          </div>
          <div>
            <span className="font-semibold">Date:</span> {SAMPLE["{{DATE}}"]}
          </div>
        </div>

        {/* Recipient */}
        <div className="mt-6 whitespace-pre-line">
          {`Registrar,\n${SAMPLE["{{COMPANY_NAME}}"]}\n${SAMPLE["{{COMPANY_LOCATION}}"]}`}
        </div>

        {/* Student ref */}
        <div className="mt-4">
          <div>
            <span className="font-semibold">NAME:</span> {SAMPLE["{{STUDENT_NAME}}"]}
          </div>
          <div>
            <span className="font-semibold">Telephone:</span> {SAMPLE["{{TELEPHONE}}"]}
          </div>
        </div>

        {/* Salutation */}
        <div className="mt-4">{fillTokens(tpl.salutation)}</div>

        {/* Subject */}
        <div className="mt-3 text-center font-bold underline">
          {fillTokens(tpl.subject)}
        </div>

        {/* Body */}
        <div className="mt-4 whitespace-pre-line">
          {fillTokens(tpl.body)}
        </div>

        {/* Closing */}
        <div className="mt-4 whitespace-pre-line">{fillTokens(tpl.closing)}</div>

        {/* Signatory */}
        <div className="mt-6">
          <div className="font-bold">{tpl.signatory}</div>
          <div className="italic text-slate-700">{tpl.signatoryTitle}</div>
        </div>

        {/* CC */}
        <div className="mt-4 text-[12px]">
          <span className="font-semibold">Cc:</span> {fillTokens(tpl.ccLine)}
        </div>

        {/* QR footer */}
        <div className="mt-6 flex items-center gap-3 rounded border border-slate-300 p-3">
          <div className="flex size-16 shrink-0 items-center justify-center rounded border border-dashed border-slate-400 bg-slate-50">
            <QrCode className="size-10 text-slate-500" />
          </div>
          <div className="text-[11px] leading-snug text-slate-600">
            To approve or reject this attachment request, scan the QR code or visit the link:{" "}
            <span className="font-mono text-blue-700">{SAMPLE["{{APPROVAL_LINK}}"]}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-[10px] text-slate-500">
          Generated by Attachment Admin System
        </div>
      </div>
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

/* -------------------- Account (Change Password) -------------------- */
function AccountTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const strength = (() => {
    let s = 0;
    if (next.length >= 8) s++;
    if (/[A-Z]/.test(next)) s++;
    if (/[0-9]/.test(next)) s++;
    if (/[^A-Za-z0-9]/.test(next)) s++;
    return s;
  })();
  const strengthLabel = ["Too short", "Weak", "Fair", "Good", "Strong"][strength];

  const submit = () => {
    if (!current) return toast.error("Enter your current password");
    if (next.length < 8) return toast.error("New password must be at least 8 characters");
    if (strength < 3) return toast.error("Password is too weak — mix upper, lower, numbers, symbols");
    if (next !== confirm) return toast.error("Passwords do not match");
    if (next === current) return toast.error("New password must be different from current");

    setSaving(true);
    setTimeout(() => {
      appendAuditLog({
        actorName: "Admin User",
        actorEmail: "admin@htu.edu.gh",
        actorRole: "Administrator",
        action: "reset_password",
        module: "auth",
        target: "Admin User",
        description: "Administrator changed their own password.",
        severity: "info",
      });
      setSaving(false);
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password updated successfully");
    }, 400);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update the password for your administrator account. You'll stay signed in on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-w-lg space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pw-current">Current password</Label>
          <Input
            id="pw-current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw-new">New password</Label>
          <Input
            id="pw-new"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          {next.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <div className="flex h-1.5 flex-1 overflow-hidden rounded bg-muted">
                <div
                  className={
                    "h-full transition-all " +
                    (strength <= 1
                      ? "w-1/4 bg-destructive"
                      : strength === 2
                        ? "w-2/4 bg-yellow-500"
                        : strength === 3
                          ? "w-3/4 bg-blue-500"
                          : "w-full bg-green-600")
                  }
                />
              </div>
              <span className="text-muted-foreground">{strengthLabel}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            At least 8 characters with a mix of upper, lower, numbers, and symbols.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw-confirm">Confirm new password</Label>
          <Input
            id="pw-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {confirm.length > 0 && confirm !== next && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={submit} disabled={saving}>
            <Save className="size-4" /> {saving ? "Updating…" : "Update password"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
