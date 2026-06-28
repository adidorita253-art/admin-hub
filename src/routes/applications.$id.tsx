import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  X,
  FileText,
  Download,
  Mail,
  QrCode,
  RotateCcw,
  CalendarClock,
  Ban,
  UserCog,
  Search,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  APP_STAGES,
  academicSupervisors,
  findAcademicSupervisor,
  findCompany,
  findStudent,
  stageLabel,
  type AppStage,
} from "@/lib/mock-data";
import { applicationsStore, useApplications } from "@/lib/applications-store";
import {
  ApprovalBadge,
  LetterBadge,
  StageBadge,
} from "@/components/application-badges";

export const Route = createFileRoute("/applications/$id")({
  head: () => ({ meta: [{ title: "Application — Attachment Admin" }] }),
  component: ApplicationDetailPage,
});

function fmtDateTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ApplicationDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const apps = useApplications();
  const app = useMemo(() => apps.find((a) => a.id === id) ?? null, [apps, id]);

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveReason, setApproveReason] = useState<string>(
    "Company confirmed verbally",
  );

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [extendOpen, setExtendOpen] = useState(false);
  const [extendDate, setExtendDate] = useState("");

  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignSelected, setAssignSelected] = useState<string | null>(null);

  const [note, setNote] = useState("");

  if (!app) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <AlertTriangle className="size-8 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Application not found</h2>
        <Button asChild variant="outline">
          <Link to="/applications">Back to Applications</Link>
        </Button>
      </div>
    );
  }

  const student = findStudent(app.studentId);
  const company = findCompany(app.companyId);
  const supervisor = findAcademicSupervisor(app.academicSupervisorId);
  const expired = app.approvalStatus === "expired";
  const linkExpiresMs = new Date(app.qrLinkExpiresAt).getTime() - Date.now();
  const linkExpiringSoon =
    !app.qrLinkRevoked && linkExpiresMs > 0 && linkExpiresMs < 86400000 * 2;

  // Timeline canonical steps
  const steps: AppStage[] = [
    "applied",
    "letter_generated",
    "letter_sent",
    "company_viewed",
    "awaiting_response",
    app.approvalStatus === "rejected" ? "rejected" : "approved",
  ];
  const completedSet = new Set(app.timeline.map((t) => t.stage));
  const timestampFor = (s: AppStage) =>
    app.timeline.find((t) => t.stage === s)?.at;
  const currentIdx = steps.findIndex((s) => s === app.stage);

  const submitApprove = () => {
    applicationsStore.update(app.id, {
      approvalStatus: "approved",
      letterStatus: "approved",
      stage: "approved",
      manualOverrideReason: approveReason,
      companyResponseMessage:
        approveReason === "Company confirmed verbally"
          ? "Verbally confirmed by company contact."
          : app.companyResponseMessage,
      companyRespondedAt: new Date().toISOString(),
    });
    applicationsStore.pushTimeline(app.id, "approved");
    applicationsStore.addNote(
      app.id,
      `Manually approved — reason: ${approveReason}.`,
    );
    toast.success("Application approved", {
      description: "Student has been notified.",
    });
    setApproveOpen(false);
  };

  const submitReject = () => {
    if (!rejectReason.trim()) {
      toast.error("A rejection reason is required.");
      return;
    }
    applicationsStore.update(app.id, {
      approvalStatus: "rejected",
      letterStatus: "rejected",
      stage: "rejected",
      rejectionReason: rejectReason.trim(),
    });
    applicationsStore.pushTimeline(app.id, "rejected");
    applicationsStore.addNote(
      app.id,
      `Manually rejected — reason: ${rejectReason.trim()}.`,
    );
    toast.success("Application rejected", {
      description: "Student has been notified.",
    });
    setRejectOpen(false);
    setRejectReason("");
  };

  const submitExtend = () => {
    if (!extendDate) {
      toast.error("Pick a new expiry date.");
      return;
    }
    applicationsStore.update(app.id, {
      qrLinkRevoked: false,
      qrLinkExpiresAt: new Date(extendDate).toISOString(),
    });
    applicationsStore.addNote(
      app.id,
      `Approval link expiry extended to ${new Date(extendDate).toLocaleDateString()}.`,
    );
    toast.success("Expiry extended");
    setExtendOpen(false);
    setExtendDate("");
  };

  const submitRevoke = () => {
    if (!revokeReason.trim()) {
      toast.error("A revocation reason is required.");
      return;
    }
    applicationsStore.update(app.id, {
      qrLinkRevoked: true,
      qrLinkRevokedReason: revokeReason.trim(),
      letterStatus: "expired",
      approvalStatus: "expired",
    });
    applicationsStore.addNote(
      app.id,
      `Approval link revoked — reason: ${revokeReason.trim()}.`,
    );
    toast.success("Approval link revoked");
    setRevokeOpen(false);
    setRevokeReason("");
  };

  const submitResend = () => {
    const newExpiry = new Date(Date.now() + 14 * 86400000).toISOString();
    applicationsStore.update(app.id, {
      qrLinkRevoked: false,
      qrLinkExpiresAt: newExpiry,
      letterStatus: "sent",
      approvalStatus: "pending",
      stage: "letter_sent",
    });
    applicationsStore.pushTimeline(app.id, "letter_sent");
    applicationsStore.addNote(
      app.id,
      `Approval link resent (expires ${new Date(newExpiry).toLocaleDateString()}).`,
    );
    toast.success("Approval link resent to company");
  };

  const submitAssign = () => {
    if (!assignSelected) {
      toast.error("Select a supervisor first.");
      return;
    }
    const sup = academicSupervisors.find((s) => s.id === assignSelected);
    applicationsStore.update(app.id, { academicSupervisorId: assignSelected });
    applicationsStore.addNote(
      app.id,
      `Academic supervisor ${supervisor ? "reassigned" : "assigned"} to ${sup?.title} ${sup?.firstName} ${sup?.lastName}.`,
    );
    toast.success("Supervisor assigned");
    setAssignOpen(false);
    setAssignSelected(null);
    setAssignSearch("");
  };

  const submitNote = () => {
    if (!note.trim()) return;
    applicationsStore.addNote(app.id, note.trim());
    setNote("");
    toast.success("Note added");
  };

  const supervisorMatches = academicSupervisors.filter((s) => {
    const q = assignSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.staffNumber.toLowerCase().includes(q)
    );
  });

  const decided =
    app.approvalStatus === "approved" || app.approvalStatus === "rejected";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1 text-muted-foreground"
            onClick={() => router.history.back()}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{app.code}</h1>
            <StageBadge stage={app.stage} />
            <ApprovalBadge status={app.approvalStatus} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Applied {fmtDateTime(app.dateApplied)} · {app.academicYear} ·{" "}
            {app.semester} Semester
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950"
            disabled={decided}
            onClick={() => setApproveOpen(true)}
          >
            <Check className="size-4" /> Approve Manually
          </Button>
          <Button
            variant="outline"
            className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950"
            disabled={decided}
            onClick={() => setRejectOpen(true)}
          >
            <X className="size-4" /> Reject Manually
          </Button>
        </div>
      </div>

      {linkExpiringSoon && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="size-4" />
          Approval link expires in less than 48 hours.
        </div>
      )}

      {/* Sections 1 & 2 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Avatar className="size-14">
              <AvatarImage src={student?.passportPhoto} />
              <AvatarFallback>
                {student
                  ? `${student.firstName[0]}${student.lastName[0]}`
                  : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Student
              </div>
              <div className="truncate font-semibold">
                {student
                  ? `${student.firstName} ${student.lastName}`
                  : "Unknown"}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {student?.regNumber} · {app.department}
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/students">View Full Profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-14 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
              {company?.logoText}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Company
              </div>
              <div className="truncate font-semibold">{app.companyName}</div>
              <div className="truncate text-xs text-muted-foreground">
                {company?.contactPerson} ·{" "}
                {company
                  ? `${company.studentsHosted}/${company.capacity} capacity`
                  : "—"}
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/companies">View Company</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Section 3 - Timeline */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 text-sm font-semibold">Application Timeline</div>
          <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {steps.map((s, idx) => {
              const isDone = completedSet.has(s) || idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const isReject = s === "rejected";
              const ts = timestampFor(s);
              return (
                <li
                  key={s}
                  className={`relative rounded-md border p-3 text-xs ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : isDone
                        ? isReject
                          ? "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40"
                          : "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30"
                        : "border-border bg-muted/30"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    {isDone ? (
                      isReject ? (
                        <X className="size-3.5 text-rose-600" />
                      ) : (
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                      )
                    ) : (
                      <Circle className="size-3.5 text-muted-foreground" />
                    )}
                    <span className="font-medium">{stageLabel[s]}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {ts ? fmtDateTime(ts) : "Pending"}
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {/* Section 4 - Tabs */}
      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="approval">Approval</TabsTrigger>
          <TabsTrigger value="supervisor">Supervisor Assignment</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Documents */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Application Letter</div>
                  <div className="text-xs text-muted-foreground">
                    Reference: KNUST/IA/{new Date(app.dateApplied).getFullYear()}/
                    {app.department.split(" ")[0].toUpperCase()}/
                    {app.code.split("-").pop()}
                  </div>
                </div>
                <LetterBadge status={app.letterStatus} />
              </div>
              <div className="flex h-72 items-center justify-center rounded-md border border-dashed bg-muted/30 text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="size-8" />
                  Inline PDF preview
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline">
                  <Download className="size-4" /> Download
                </Button>
                <Button variant="outline" onClick={submitResend}>
                  <Mail className="size-4" /> Resend Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approval */}
        <TabsContent value="approval" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <QrCode className="size-4" /> QR Approval Link
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Link ID</dt>
                    <dd className="font-mono text-xs">{app.qrLinkId}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      {app.qrLinkRevoked ? (
                        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                          Revoked
                        </Badge>
                      ) : expired ? (
                        <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          Active
                        </Badge>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Expires</dt>
                    <dd>{fmtDateTime(app.qrLinkExpiresAt)}</dd>
                  </div>
                  {app.qrLinkRevokedReason && (
                    <div>
                      <dt className="text-muted-foreground">Revocation reason</dt>
                      <dd className="mt-1 rounded-md bg-muted/40 p-2 text-xs">
                        {app.qrLinkRevokedReason}
                      </dd>
                    </div>
                  )}
                </dl>
                <Separator className="my-3" />
                <div className="flex flex-wrap gap-2">
                  {(expired || app.qrLinkRevoked) && (
                    <Button onClick={submitResend}>
                      <RotateCcw className="size-4" /> Resend Approval Link
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setExtendOpen(true)}>
                    <CalendarClock className="size-4" /> Extend Expiration
                  </Button>
                  {!app.qrLinkRevoked && (
                    <Button
                      variant="outline"
                      className="border-rose-300 text-rose-700 hover:bg-rose-50"
                      onClick={() => setRevokeOpen(true)}
                    >
                      <Ban className="size-4" /> Revoke Link
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="mb-3 text-sm font-semibold">Company Response</div>
                {app.companyResponseMessage ? (
                  <div className="space-y-2">
                    <ApprovalBadge status={app.approvalStatus} />
                    <p className="rounded-md bg-muted/40 p-3 text-sm">
                      {app.companyResponseMessage}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Received {fmtDateTime(app.companyRespondedAt)}
                    </div>
                    {app.rejectionReason && (
                      <div className="text-xs text-rose-600">
                        Reason: {app.rejectionReason}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No response received yet.
                  </div>
                )}

                <Separator className="my-4" />

                <div className="mb-2 text-sm font-semibold">OTP History</div>
                {app.otpEvents.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No OTP events recorded.
                  </div>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {app.otpEvents.map((e, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span className="capitalize">OTP {e.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {fmtDateTime(e.at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Supervisor */}
        <TabsContent value="supervisor" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Assigned Academic Supervisor
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {supervisor
                    ? `${supervisor.title} ${supervisor.firstName} ${supervisor.lastName}`
                    : "Unassigned"}
                </div>
                {supervisor && (
                  <div className="text-xs text-muted-foreground">
                    {supervisor.department} · {supervisor.email}
                  </div>
                )}
              </div>
              <Button onClick={() => setAssignOpen(true)}>
                <UserCog className="size-4" />
                {supervisor ? "Reassign" : "Assign"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 text-sm font-semibold">
                Internal Admin Notes
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Write an internal note (visible only to admins)…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
                <Button onClick={submitNote} disabled={!note.trim()}>
                  Add Note
                </Button>
              </div>
              <Separator className="my-4" />
              {app.notes.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No notes yet.
                </div>
              ) : (
                <ul className="space-y-3">
                  {[...app.notes].reverse().map((n) => (
                    <li
                      key={n.id}
                      className="rounded-md border bg-muted/20 p-3 text-sm"
                    >
                      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {n.author}
                        </span>
                        <span>{fmtDateTime(n.at)}</span>
                      </div>
                      {n.text}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Modal */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application Manually</DialogTitle>
            <DialogDescription>
              This overrides the company link flow. The student will be
              notified and the action will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={approveReason} onValueChange={setApproveReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Company confirmed verbally">
                  Company confirmed verbally
                </SelectItem>
                <SelectItem value="Supporting document provided">
                  Supporting document provided
                </SelectItem>
                <SelectItem value="Admin override">Admin override</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitApprove}>
              <Check className="size-4" /> Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application Manually</DialogTitle>
            <DialogDescription>
              A reason is required. The student will be notified and the action
              will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Rejection reason</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Company capacity full for this intake."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={submitReject}
            >
              <X className="size-4" /> Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Modal */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Approval Link Expiration</DialogTitle>
            <DialogDescription>
              Current expiry: {fmtDateTime(app.qrLinkExpiresAt)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New expiry date</Label>
            <Input
              type="date"
              value={extendDate}
              onChange={(e) => setExtendDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitExtend}>Save New Expiry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Modal */}
      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Approval Link</DialogTitle>
            <DialogDescription>
              The company will no longer be able to act on this link. A reason
              is required and will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={submitRevoke}
            >
              <Ban className="size-4" /> Revoke Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Supervisor Modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {supervisor ? "Reassign" : "Assign"} Academic Supervisor
            </DialogTitle>
            <DialogDescription>
              Search and pick a supervisor for this application.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, department or staff number…"
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-md border">
            {supervisorMatches.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No matches.
              </div>
            )}
            {supervisorMatches.map((s) => {
              const selected = assignSelected === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setAssignSelected(s.id)}
                  className={`flex w-full items-center justify-between gap-3 border-b p-3 text-left text-sm last:border-b-0 hover:bg-muted/50 ${
                    selected ? "bg-primary/10" : ""
                  }`}
                >
                  <div>
                    <div className="font-medium">
                      {s.title} {s.firstName} {s.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.department} · {s.staffNumber}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.studentsAssigned}/{s.maxLoad} load
                  </div>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAssign}>Save Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
