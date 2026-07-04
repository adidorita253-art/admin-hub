import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  BookOpen,
  Download,
  FileSpreadsheet,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquareWarning,
  StickyNote,
  Lock,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  RATING3,
  RATING4,
  deriveStatus,
  weeksEndorsed,
  type AcademicEndorseStatus,
  type AcademicEndorsement,
  type CompanyAssessment,
  type CompanyEndorseStatus,
  type Grade,
  type Rating3,
  type Rating4,
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
function fmtDateTime(d: string | null) {
  return d ? new Date(d).toLocaleString() : "—";
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
  const [noteText, setNoteText] = useState("");
  const firstEditRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (edit && firstEditRef.current) {
      firstEditRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      firstEditRef.current.classList.add("ring-2", "ring-amber-400");
      const t = setTimeout(() => {
        firstEditRef.current?.classList.remove("ring-2", "ring-amber-400");
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [edit, lb?.id]);

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

  const audits = logbooksStore.getAudits();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/logbooks"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Logbooks</Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={student?.passportPhoto} />
            <AvatarFallback>
              {student?.firstName?.[0]}
              {student?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <PageHeader
              title={`${student?.firstName} ${student?.lastName}`}
              description={`${student?.regNumber} · ${student?.department} · Year ${student?.yearOfStudy}`}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast.success("PDF export queued", { description: `Logbook_${student?.firstName}_${student?.regNumber}.pdf` })}>
            <Download className="mr-1 h-4 w-4" /> Export as PDF
          </Button>
          <Button variant="outline" onClick={() => toast.success("Excel export queued", { description: `Logbook_${student?.firstName}_${student?.regNumber}.xlsx` })}>
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Export as Excel
          </Button>
          <Button
            variant="outline"
            className="border-amber-500 text-amber-700 hover:bg-amber-50"
            onClick={() => {
              navigate({ to: "/logbooks/$id", params: { id }, search: { edit: true } });
              firstEditRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <Pencil className="mr-1 h-4 w-4" /> Edit Record
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Company: {student?.companyName ?? "—"}</Badge>
        <Badge variant="outline">
          Academic Supervisor:{" "}
          {sup ? `${sup.title} ${sup.firstName} ${sup.lastName}` : "—"}
        </Badge>
        <Badge variant="outline">
          Attachment: {fmt(lb.attachmentStart)} – {fmt(lb.attachmentEnd)}
        </Badge>
        <Badge variant="outline">Status: {LOGBOOK_STATUS_LABEL[status]}</Badge>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-4">
          <Info label="Current Week" value={`Week ${currentWeek} of ${lb.totalWeeks}`} />
          <Info label="Weeks Fully Endorsed" value={`${endorsed} of ${lb.totalWeeks}`} />
          <Info label="Final Grade" value={lb.finalGrade ?? "Not Yet Graded"} />
          <Info label="Academic Year" value={`${lb.academicYear} · ${lb.semester}`} />
          <div className="md:col-span-4">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Completion</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">
            📁 {student?.firstName} {student?.lastName} — {student?.companyName ?? "—"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="text-xs text-muted-foreground">
              Attachment Period: {fmt(lb.attachmentStart)} – {fmt(lb.attachmentEnd)}
            </div>
            <div className="text-xs text-muted-foreground">
              {endorsed} of {lb.totalWeeks} weeks fully endorsed
            </div>
          </div>

          {lb.weeks.map((w, i) => (
            <WeekBlock
              key={w.weekNumber}
              week={w}
              logbookId={lb.id}
              firstEditRef={i === 0 ? firstEditRef : undefined}
            />
          ))}
        </CardContent>
      </Card>

      {/* Final Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📄 Final Attachment Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {lb.finalReport.submittedAt
                ? `Submitted ${fmt(lb.finalReport.submittedAt)}`
                : "Not Yet Submitted"}
            </Badge>
            <AcademicBadge s={lb.finalReport.academicStatus} />
          </div>
          {lb.finalReport.text ? (
            <div className="rounded-md border bg-muted/20 p-3">
              <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> Student's own work — read only
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {lb.finalReport.text}
              </p>
            </div>
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
        </CardContent>
      </Card>

      {/* Final Grade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🎓 Final Grade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {lb.finalGrade ? (
            <FinalGradeSection
              id={lb.id}
              current={lb.finalGrade}
              submittedBy={
                sup ? `${sup.title} ${sup.firstName} ${sup.lastName}` : "—"
              }
              submittedAt={lb.finalReport.submittedAt}
              comments={lb.finalReport.academicComments}
            />
          ) : (
            <>
              <div>Grade: <span className="text-muted-foreground">Not Yet Graded</span></div>
              <div className="text-xs text-muted-foreground">
                Admin cannot assign a first-time grade — the academic
                supervisor must submit it first.
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Admin notes */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <StickyNote className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">
            Admin Notes{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (not visible to student or supervisor)
            </span>
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

/* -------- Week block -------- */

function WeekBlock({
  week,
  logbookId,
  firstEditRef,
}: {
  week: WeekEntry;
  logbookId: string;
  firstEditRef?: React.RefObject<HTMLDivElement | null>;
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
          {/* Daily entries — locked */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              Daily Entries
              <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                <Lock className="h-3 w-3" /> Student entry — read only
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
              {week.daily.map((d) => (
                <DailyCard key={d.day} day={d} />
              ))}
            </div>
          </div>

          {week.monthlySkills !== null && (
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                📊 Monthly Skills Reflection — Month {week.weekNumber / 4}
                <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  <Lock className="h-3 w-3" /> Student entry — read only
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm">
                {week.monthlySkills ||
                  "Awaiting the student's monthly reflection."}
              </p>
            </div>
          )}

          <div ref={firstEditRef}>
            <CompanyAssessmentPanel week={week} logbookId={logbookId} />
          </div>
          <AcademicEndorsementPanel week={week} logbookId={logbookId} />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function DailyCard({ day }: { day: WeekEntry["daily"][number] }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border p-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium">
          📅 {day.day} · {new Date(day.date).toLocaleDateString()}
        </span>
        <span className="text-muted-foreground">
          {day.submittedAt
            ? new Date(day.submittedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </span>
      </div>
      <p className="whitespace-pre-line">
        {day.narrative || (
          <span className="italic text-muted-foreground">Not submitted</span>
        )}
      </p>
      <div className="text-muted-foreground">Hours Worked: {day.hoursWorked}</div>
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
      <div className="mt-auto inline-flex items-center gap-1 pt-1 text-[10px] text-muted-foreground">
        <Lock className="h-3 w-3" /> Locked
      </div>
    </div>
  );
}

/* -------- Company assessment (edit-in-place with confirm) -------- */

function CompanyAssessmentPanel({
  week,
  logbookId,
}: {
  week: WeekEntry;
  logbookId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CompanyAssessment>(week.company);
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const start = () => {
    setDraft(week.company);
    setReason("");
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const tryCommit = () => {
    if (!reason.trim()) {
      toast.error("Reason for edit is required");
      return;
    }
    setConfirmOpen(true);
  };
  const commit = () => {
    logbooksStore.updateCompanyAssessment(
      logbookId,
      week.weekNumber,
      draft,
      reason.trim(),
    );
    setConfirmOpen(false);
    setEditing(false);
    toast.success("Assessment updated and logged");
  };

  const r4Rows: { key: keyof CompanyAssessment; label: string }[] = useMemo(
    () => [
      { key: "attendance", label: "Attendance" },
      { key: "discipline", label: "Discipline" },
      { key: "punctuality", label: "Punctuality" },
    ],
    [],
  );
  const r3Rows: { key: keyof CompanyAssessment; label: string }[] = useMemo(
    () => [
      { key: "workOnSchedule", label: "Ability to complete work on schedule" },
      { key: "workUnderPressure", label: "Ability to work under pressure" },
      { key: "generalAptitude", label: "General Aptitude" },
    ],
    [],
  );

  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">
          🏢 Workplace Supervisor Weekly Assessment
        </div>
        {!editing && (
          <Button size="sm" variant="outline" onClick={start}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit Assessment
          </Button>
        )}
      </div>

      {editing && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
          <span>
            You are editing a submitted company assessment. This action is
            permanent and will be logged.
          </span>
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-3">
        {r4Rows.map(({ key, label }) => (
          <div key={key}>
            <Label className="text-xs">{label}</Label>
            {editing ? (
              <Select
                value={draft[key] as Rating4}
                onValueChange={(v) =>
                  setDraft({ ...draft, [key]: v as Rating4 })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RATING4.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm">{week.company[key] as string}</div>
            )}
          </div>
        ))}
        {r3Rows.map(({ key, label }) => (
          <div key={key}>
            <Label className="text-xs">{label}</Label>
            {editing ? (
              <Select
                value={draft[key] as Rating3}
                onValueChange={(v) =>
                  setDraft({ ...draft, [key]: v as Rating3 })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RATING3.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm">{week.company[key] as string}</div>
            )}
          </div>
        ))}
        <div className="md:col-span-3">
          <Label className="text-xs">Department / Section</Label>
          {editing ? (
            <Input
              value={draft.section}
              onChange={(e) => setDraft({ ...draft, section: e.target.value })}
            />
          ) : (
            <div className="text-sm">{week.company.section}</div>
          )}
        </div>
        <div className="md:col-span-3">
          <Label className="text-xs">Comments</Label>
          {editing ? (
            <Textarea
              value={draft.comments}
              onChange={(e) => setDraft({ ...draft, comments: e.target.value })}
              rows={2}
            />
          ) : (
            <p className="text-sm">{week.company.comments || "—"}</p>
          )}
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Endorsed by: {week.company.endorsedByName},{" "}
        {week.company.endorsedByPosition} ·{" "}
        {week.company.endorsedAt ? fmt(week.company.endorsedAt) : "Not endorsed"}
      </div>

      {editing && (
        <div className="mt-3 space-y-2">
          <div>
            <Label className="text-xs">Reason for this change (required)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Why is this change necessary?"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={tryCommit}>
              Save Changes
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={commit}
      />
    </div>
  );
}

/* -------- Academic endorsement (edit-in-place with confirm) -------- */

function AcademicEndorsementPanel({
  week,
  logbookId,
}: {
  week: WeekEntry;
  logbookId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AcademicEndorsement>(week.academic);
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const start = () => {
    setDraft(week.academic);
    setReason("");
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const tryCommit = () => {
    if (!reason.trim()) {
      toast.error("Reason for edit is required");
      return;
    }
    setConfirmOpen(true);
  };
  const commit = () => {
    logbooksStore.updateAcademicEndorsement(
      logbookId,
      week.weekNumber,
      draft,
      reason.trim(),
    );
    setConfirmOpen(false);
    setEditing(false);
    toast.success("Endorsement updated and logged");
  };

  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">
          🎓 Academic Supervisor Endorsement
        </div>
        {!editing && (
          <Button size="sm" variant="outline" onClick={start}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit Endorsement
          </Button>
        )}
      </div>

      {editing && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
          <span>
            You are editing a submitted endorsement. This action is permanent
            and will be logged.
          </span>
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-3">
        <div>
          <Label className="text-xs">Endorsement Status</Label>
          {editing ? (
            <Select
              value={draft.status}
              onValueChange={(v) =>
                setDraft({ ...draft, status: v as AcademicEndorseStatus })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="endorsed">Endorsed</SelectItem>
                <SelectItem value="revision_requested">
                  Revision Requested
                </SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm capitalize">
              {week.academic.status.replace("_", " ")}
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Feedback to student</Label>
          {editing ? (
            <Textarea
              value={draft.comments}
              onChange={(e) => setDraft({ ...draft, comments: e.target.value })}
              rows={2}
            />
          ) : (
            <p className="text-sm">{week.academic.comments || "—"}</p>
          )}
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {week.academic.endorsedByName} ·{" "}
        {week.academic.endorsedAt ? fmt(week.academic.endorsedAt) : "Not endorsed"}
      </div>
      {week.academic.revisionThread.length > 0 && (
        <div className="mt-2 space-y-1 rounded border-l-2 border-orange-300 bg-orange-50 p-2 text-xs">
          <div className="font-medium text-orange-800">Revision history</div>
          {week.academic.revisionThread.map((r, i) => (
            <div key={i}>
              <span className="font-medium">{r.author}</span> ·{" "}
              {fmtDateTime(r.at)} — {r.text}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="mt-3 space-y-2">
          <div>
            <Label className="text-xs">Reason for this change (required)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Why is this change necessary?"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={tryCommit}>
              Save Changes
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={commit}
      />
    </div>
  );
}

/* -------- Final grade (edit-in-place with confirm) -------- */

function FinalGradeSection({
  id,
  current,
  submittedBy,
  submittedAt,
  comments,
}: {
  id: string;
  current: Grade;
  submittedBy: string;
  submittedAt: string | null;
  comments: string;
}) {
  const [editing, setEditing] = useState(false);
  const [grade, setGrade] = useState<Grade>(current);
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const start = () => {
    setGrade(current);
    setReason("");
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const tryCommit = () => {
    if (!reason.trim()) {
      toast.error("Reason for edit is required");
      return;
    }
    setConfirmOpen(true);
  };
  const commit = () => {
    logbooksStore.setFinalGrade(id, grade, reason.trim());
    setConfirmOpen(false);
    setEditing(false);
    toast.success("Final grade updated and logged");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div>
            <span className="text-muted-foreground">Grade:</span>{" "}
            <span className="font-semibold">{current}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Submitted by: {submittedBy} · {fmt(submittedAt)}
          </div>
        </div>
        {!editing && (
          <Button size="sm" variant="outline" onClick={start}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit Final Grade
          </Button>
        )}
      </div>

      {comments && (
        <div className="rounded-md border bg-muted/40 p-2 text-sm">
          <div className="text-xs font-medium text-muted-foreground">
            Supervisor Comments
          </div>
          <div>{comments}</div>
        </div>
      )}

      {editing && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
            <span>
              You are editing a submitted final grade. This action is permanent
              and will be logged.
            </span>
          </div>
          <div>
            <Label className="text-xs">Select corrected grade</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={
                    "rounded-md border px-3 py-1 text-sm " +
                    (grade === g
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted")
                  }
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Reason for this change (required)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
          <Separator />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={tryCommit}>
              Save Changes
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={commit}
      />
    </div>
  );
}

function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm change</DialogTitle>
          <DialogDescription>
            These changes are permanent and will be recorded in Audit Logs.
            Confirm?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Go Back
          </Button>
          <Button onClick={onConfirm}>Confirm and Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
