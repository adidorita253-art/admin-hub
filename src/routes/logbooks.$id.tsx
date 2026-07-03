import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  BookOpen,
  Download,
  FileSpreadsheet,
  Pencil,
  Save,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquareWarning,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { findStudent, findAcademicSupervisor } from "@/lib/mock-data";
import {
  GRADES,
  LOGBOOK_STATUS_LABEL,
  deriveStatus,
  weeksEndorsed,
  type AcademicEndorseStatus,
  type CompanyEndorseStatus,
  type Grade,
  type WeekEntry,
} from "@/lib/logbooks-data";
import { logbooksStore, useLogbook } from "@/lib/logbooks-store";

export const Route = createFileRoute("/logbooks/$id")({
  validateSearch: z.object({ edit: z.boolean().optional() }),
  head: () => ({ meta: [{ title: "Logbook Detail — Attachment Admin" }] }),
  component: LogbookDetailPage,
  notFoundComponent: () => (
    <div className="p-6 text-sm text-muted-foreground">Logbook not found.</div>
  ),
});

function fmt(d: string | null) {
  return d
    ? new Date(d).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";
}
function fmtRange(a: string, b: string) {
  const A = new Date(a);
  const B = new Date(b);
  const sameM = A.getMonth() === B.getMonth();
  return `${A.getDate()} ${A.toLocaleString(undefined, { month: "short" })} – ${B.getDate()} ${
    sameM ? "" : B.toLocaleString(undefined, { month: "short" }) + " "
  }${B.getFullYear()}`;
}

function CompanyBadge({ s }: { s: CompanyEndorseStatus }) {
  const map: Record<CompanyEndorseStatus, { c: string; t: string; I: typeof CheckCircle2 }> = {
    endorsed: { c: "bg-emerald-100 text-emerald-800 border-emerald-200", t: "Endorsed", I: CheckCircle2 },
    pending: { c: "bg-amber-100 text-amber-800 border-amber-200", t: "Awaiting", I: Clock },
    flagged: { c: "bg-red-100 text-red-800 border-red-200", t: "Flagged", I: AlertTriangle },
  };
  const { c, t, I } = map[s];
  return (
    <Badge variant="outline" className={c}>
      <I className="mr-1 h-3 w-3" /> Company: {t}
    </Badge>
  );
}
function AcademicBadge({ s }: { s: AcademicEndorseStatus }) {
  const map: Record<AcademicEndorseStatus, { c: string; t: string; I: typeof CheckCircle2 }> = {
    endorsed: { c: "bg-emerald-100 text-emerald-800 border-emerald-200", t: "Endorsed", I: CheckCircle2 },
    pending: { c: "bg-amber-100 text-amber-800 border-amber-200", t: "Awaiting", I: Clock },
    revision_requested: { c: "bg-orange-100 text-orange-800 border-orange-200", t: "Revision Requested", I: MessageSquareWarning },
    flagged: { c: "bg-red-100 text-red-800 border-red-200", t: "Flagged", I: AlertTriangle },
  };
  const { c, t, I } = map[s];
  return (
    <Badge variant="outline" className={c}>
      <I className="mr-1 h-3 w-3" /> Academic: {t}
    </Badge>
  );
}

function LogbookDetailPage() {
  const { id } = Route.useParams();
  const { edit } = Route.useSearch();
  const navigate = useNavigate();
  const lb = useLogbook(id);
  const [editMode, setEditMode] = useState(!!edit);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  if (!lb) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/logbooks"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
        </Button>
        <p>Logbook not found.</p>
      </div>
    );
  }

  const student = findStudent(lb.studentId);
  const sup = findAcademicSupervisor(student?.academicSupervisorId ?? null);
  const endorsed = weeksEndorsed(lb);
  const pct = Math.round((endorsed / lb.totalWeeks) * 100);
  const status = deriveStatus(lb);
  const currentWeek =
    lb.weeks.find((w) => w.daily.some((d) => !d.submittedAt))?.weekNumber ??
    lb.totalWeeks;

  const toggleEdit = () => {
    const next = !editMode;
    setEditMode(next);
    navigate({
      to: "/logbooks/$id",
      params: { id },
      search: next ? { edit: true } : {},
    });
  };

  const audits = logbooksStore.getAudits();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/logbooks"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Logbooks</Link>
      </Button>

      <PageHeader
        title={`${student?.firstName} ${student?.lastName} — Logbook`}
        description={`${student?.regNumber} · ${student?.department}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => toast.success("PDF export queued")}>
              <Download className="mr-1 h-4 w-4" /> Export PDF
            </Button>
            <Button variant="outline" onClick={() => toast.success("Excel export queued")}>
              <FileSpreadsheet className="mr-1 h-4 w-4" /> Export Excel
            </Button>
            {!editMode ? (
              <Button onClick={toggleEdit}>
                <Pencil className="mr-1 h-4 w-4" /> Edit Record
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={toggleEdit}>
                  <X className="mr-1 h-4 w-4" /> Exit Edit
                </Button>
                <Button onClick={() => setSaveConfirmOpen(true)}>
                  <Save className="mr-1 h-4 w-4" /> Save Changes
                </Button>
              </>
            )}
          </div>
        }
      />

      {editMode && (
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>
            <div className="font-semibold">You are editing a submitted record.</div>
            All changes are logged and cannot be undone without a database restore.
          </div>
        </div>
      )}

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-4">
          <Info label="Company" value={student?.companyName ?? "—"} />
          <Info
            label="Academic Supervisor"
            value={sup ? `${sup.title} ${sup.firstName} ${sup.lastName}` : "—"}
          />
          <Info label="Attachment Start" value={fmt(lb.attachmentStart)} />
          <Info label="Attachment End" value={fmt(lb.attachmentEnd)} />
          <Info label="Current Week" value={`Week ${currentWeek} of ${lb.totalWeeks}`} />
          <Info
            label="Weeks Fully Endorsed"
            value={`${endorsed} of ${lb.totalWeeks}`}
          />
          <Info
            label="Final Grade"
            value={lb.finalGrade ?? "Not Yet Graded"}
          />
          <Info label="Status" value={LOGBOOK_STATUS_LABEL[status]} />
          <div className="md:col-span-4">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Completion</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} />
          </div>
        </CardContent>
      </Card>

      {/* Portfolio */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">The Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="font-medium">
              {student?.firstName} {student?.lastName} · {student?.companyName}
            </div>
            <div className="text-xs text-muted-foreground">
              {fmt(lb.attachmentStart)} – {fmt(lb.attachmentEnd)} · {endorsed} of{" "}
              {lb.totalWeeks} weeks fully endorsed
            </div>
          </div>

          {lb.weeks.map((w) => (
            <WeekBlock
              key={w.weekNumber}
              week={w}
              logbookId={lb.id}
              editable={editMode}
            />
          ))}
        </CardContent>
      </Card>

      {/* Final Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Final Attachment Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {lb.finalReport.submittedAt ? "Submitted" : "Not Submitted"}
            </Badge>
            <AcademicBadge s={lb.finalReport.academicStatus} />
          </div>
          {lb.finalReport.text ? (
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {lb.finalReport.text}
            </p>
          ) : (
            <p className="text-muted-foreground">No report submitted yet.</p>
          )}
          {lb.finalReport.academicComments && (
            <div className="rounded-md border bg-muted/40 p-3">
              <div className="text-xs font-medium text-muted-foreground">
                Supervisor comments
              </div>
              <div>{lb.finalReport.academicComments}</div>
            </div>
          )}

          <Separator />
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs">Final Grade</Label>
              <div className="mt-1">
                {editMode ? (
                  <FinalGradeEditor
                    id={lb.id}
                    current={lb.finalGrade}
                  />
                ) : (
                  <span className="text-sm">
                    {lb.finalGrade ?? "Not Yet Graded"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin notes */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <StickyNote className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">
            Admin Notes <span className="text-xs font-normal text-muted-foreground">(not visible to student or supervisor)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add an internal note…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button
              onClick={() => {
                if (!noteText.trim()) return;
                logbooksStore.addAdminNote(lb.id, noteText.trim());
                setNoteText("");
                toast.success("Note added");
              }}
            >
              Add
            </Button>
          </div>
          {lb.adminNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admin notes yet.</p>
          ) : (
            <ul className="space-y-2">
              {lb.adminNotes.map((n) => (
                <li key={n.id} className="rounded-md border p-3 text-sm">
                  <div className="text-xs text-muted-foreground">
                    {n.author} · {new Date(n.at).toLocaleString()}
                  </div>
                  <div>{n.text}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Audit trail */}
      {audits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Admin Edits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {audits.slice(0, 10).map((a) => (
                <li key={a.id} className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">
                    {a.actor} · {new Date(a.at).toLocaleString()}
                  </div>
                  <div className="font-medium">{a.what}</div>
                  <div className="text-xs">Reason: {a.reason}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Dialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm changes</DialogTitle>
            <DialogDescription>
              These changes are permanent and will be logged. Confirm?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setSaveConfirmOpen(false);
                toast.success("Changes saved and logged");
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function FinalGradeEditor({
  id,
  current,
}: {
  id: string;
  current: Grade | null;
}) {
  const [g, setG] = useState<Grade | "">(current ?? "");
  const [reason, setReason] = useState("");
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select value={g || undefined} onValueChange={(v) => setG(v as Grade)}>
        <SelectTrigger className="w-32"><SelectValue placeholder="Grade" /></SelectTrigger>
        <SelectContent>
          {GRADES.map((x) => (
            <SelectItem key={x} value={x}>{x}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-56"
      />
      <Button
        size="sm"
        onClick={() => {
          if (!g || !reason.trim()) {
            toast.error("Grade and reason required");
            return;
          }
          logbooksStore.setFinalGrade(id, g as Grade, reason.trim());
          toast.success("Final grade updated");
          setReason("");
        }}
      >
        Set
      </Button>
    </div>
  );
}

function WeekBlock({
  week,
  logbookId,
  editable,
}: {
  week: WeekEntry;
  logbookId: string;
  editable: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-md border">
        <CollapsibleTrigger className="flex w-full flex-col gap-2 p-3 text-left hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">
              Week {week.weekNumber} · {fmtRange(week.startDate, week.endDate)}
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              <CompanyBadge s={week.company.status} />
              <AcademicBadge s={week.academic.status} />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {open ? "Hide" : "Expand"}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 border-t p-3">
          {/* Daily entries */}
          <div>
            <div className="mb-2 text-sm font-medium">Daily Entries</div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
              {week.daily.map((d) => (
                <DailyCard
                  key={d.day}
                  day={d}
                  weekNumber={week.weekNumber}
                  logbookId={logbookId}
                  editable={editable}
                />
              ))}
            </div>
          </div>

          {week.monthlySkills !== null && (
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="text-sm font-medium">
                Monthly Skills Reflection
              </div>
              <p className="mt-1 text-sm">
                {week.monthlySkills ||
                  "Awaiting the student's monthly reflection."}
              </p>
            </div>
          )}

          {/* Company assessment */}
          <CompanyAssessmentPanel
            week={week}
            logbookId={logbookId}
            editable={editable}
          />
          {/* Academic endorsement */}
          <AcademicEndorsementPanel
            week={week}
            logbookId={logbookId}
            editable={editable}
          />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function DailyCard({
  day,
  weekNumber,
  logbookId,
  editable,
}: {
  day: WeekEntry["daily"][number];
  weekNumber: number;
  logbookId: string;
  editable: boolean;
}) {
  const [text, setText] = useState(day.narrative);
  const [reason, setReason] = useState("");
  return (
    <div className="flex flex-col gap-2 rounded-md border p-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium">
          {day.day} · {new Date(day.date).toLocaleDateString()}
        </span>
        <span className="text-muted-foreground">
          {day.submittedAt ? new Date(day.submittedAt).toLocaleTimeString() : "—"}
        </span>
      </div>
      {editable ? (
        <>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
          />
          <Input
            placeholder="Reason for edit"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => {
              if (!reason.trim()) {
                toast.error("Reason is required");
                return;
              }
              logbooksStore.updateDailyNarrative(
                logbookId,
                weekNumber,
                day.day,
                text,
                reason.trim(),
              );
              setReason("");
              toast.success("Entry updated and logged");
            }}
          >
            Save entry
          </Button>
        </>
      ) : (
        <p className="whitespace-pre-line">
          {day.narrative || (
            <span className="italic text-muted-foreground">Not submitted</span>
          )}
        </p>
      )}
      <div className="text-muted-foreground">Hours: {day.hoursWorked}</div>
      {day.attachments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {day.attachments.map((a) => (
            <span
              key={a.name}
              className="rounded bg-primary/10 px-2 py-0.5 text-primary"
            >
              📎 {a.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyAssessmentPanel({
  week,
  logbookId,
  editable,
}: {
  week: WeekEntry;
  logbookId: string;
  editable: boolean;
}) {
  const [c, setC] = useState(week.company);
  const [reason, setReason] = useState("");
  const rows: [keyof typeof c, string][] = [
    ["attendance", "Attendance"],
    ["discipline", "Discipline"],
    ["punctuality", "Punctuality"],
    ["workOnSchedule", "Work on Schedule"],
    ["workUnderPressure", "Work under Pressure"],
    ["generalAptitude", "General Aptitude"],
  ];
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="mb-2 text-sm font-medium">
        Company Supervisor Weekly Assessment
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {rows.map(([k, label]) => (
          <div key={k}>
            <Label className="text-xs">{label}</Label>
            {editable ? (
              <Select
                value={c[k] as Grade}
                onValueChange={(v) => setC({ ...c, [k]: v as Grade })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm">{c[k] as string}</div>
            )}
          </div>
        ))}
        <div className="md:col-span-3">
          <Label className="text-xs">Section / Department</Label>
          {editable ? (
            <Input
              value={c.section}
              onChange={(e) => setC({ ...c, section: e.target.value })}
            />
          ) : (
            <div className="text-sm">{c.section}</div>
          )}
        </div>
        <div className="md:col-span-3">
          <Label className="text-xs">Comments</Label>
          {editable ? (
            <Textarea
              value={c.comments}
              onChange={(e) => setC({ ...c, comments: e.target.value })}
              rows={2}
            />
          ) : (
            <p className="text-sm">{c.comments || "—"}</p>
          )}
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Endorsed by: {c.endorsedByName}, {c.endorsedByPosition} ·{" "}
        {c.endorsedAt ? fmt(c.endorsedAt) : "Not endorsed"}
      </div>
      {editable && (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <Input
            placeholder="Reason"
            className="w-64"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => {
              if (!reason.trim()) {
                toast.error("Reason required");
                return;
              }
              logbooksStore.updateCompanyAssessment(
                logbookId,
                week.weekNumber,
                c,
                reason.trim(),
              );
              setReason("");
              toast.success("Assessment updated");
            }}
          >
            Save assessment
          </Button>
        </div>
      )}
    </div>
  );
}

function AcademicEndorsementPanel({
  week,
  logbookId,
  editable,
}: {
  week: WeekEntry;
  logbookId: string;
  editable: boolean;
}) {
  const [a, setA] = useState(week.academic);
  const [reason, setReason] = useState("");
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="mb-2 text-sm font-medium">
        Academic Supervisor Endorsement
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <div>
          <Label className="text-xs">Status</Label>
          {editable ? (
            <Select
              value={a.status}
              onValueChange={(v) =>
                setA({ ...a, status: v as AcademicEndorseStatus })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="endorsed">Endorsed</SelectItem>
                <SelectItem value="revision_requested">
                  Revision Requested
                </SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm capitalize">
              {a.status.replace("_", " ")}
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Feedback / Comments</Label>
          {editable ? (
            <Textarea
              value={a.comments}
              onChange={(e) => setA({ ...a, comments: e.target.value })}
              rows={2}
            />
          ) : (
            <p className="text-sm">{a.comments || "—"}</p>
          )}
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {a.endorsedByName} · {a.endorsedAt ? fmt(a.endorsedAt) : "Not endorsed"}
      </div>
      {a.revisionThread.length > 0 && (
        <div className="mt-2 space-y-1 rounded border-l-2 border-orange-300 bg-orange-50 p-2 text-xs">
          <div className="font-medium text-orange-800">Revision history</div>
          {a.revisionThread.map((r, i) => (
            <div key={i}>
              <span className="font-medium">{r.author}</span> ·{" "}
              {new Date(r.at).toLocaleDateString()} — {r.text}
            </div>
          ))}
        </div>
      )}
      {editable && (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <Input
            placeholder="Reason"
            className="w-64"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => {
              if (!reason.trim()) {
                toast.error("Reason required");
                return;
              }
              logbooksStore.updateAcademicEndorsement(
                logbookId,
                week.weekNumber,
                a,
                reason.trim(),
              );
              setReason("");
              toast.success("Endorsement updated");
            }}
          >
            Save endorsement
          </Button>
        </div>
      )}
    </div>
  );
}
