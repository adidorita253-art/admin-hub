import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Mail,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  Send,
  ExternalLink,
  X,
  Calendar as CalendarIcon,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LetterBadge } from "@/components/application-badges";
import { useActiveDepartments, useSettings } from "@/lib/settings-store";
import { useLetters, lettersStore, type LetterRecord } from "@/lib/letters-store";
import type { LetterStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/letters")({
  head: () => ({ meta: [{ title: "Letters — Attachment Admin" }] }),
  component: LettersPage,
});

const STATUSES: LetterStatus[] = [
  "generated",
  "sent",
  "viewed",
  "approved",
  "rejected",
  "expired",
];

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function LettersPage() {
  const letters = useLetters();
  const settings = useSettings();
  const activeDepartments = useActiveDepartments();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [dept, setDept] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [semester, setSemester] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [viewing, setViewing] = useState<LetterRecord | null>(null);
  const [resendTarget, setResendTarget] = useState<LetterRecord | null>(null);
  const [bulkResendOpen, setBulkResendOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return letters.filter((l) => {
      if (q) {
        const hay = [l.studentName, l.studentReg, l.referenceNumber]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status !== "all" && l.status !== status) return false;
      if (dept !== "all" && l.department !== dept) return false;
      if (year !== "all" && l.academicYear !== year) return false;
      if (semester !== "all" && l.semester !== semester) return false;
      const t = new Date(l.generatedAt).getTime();
      if (from && t < new Date(from).getTime()) return false;
      if (to && t > new Date(to).getTime() + 86400000) return false;
      return true;
    });
  }, [letters, search, status, dept, year, semester, from, to]);

  const years = Array.from(new Set(letters.map((l) => l.academicYear)));

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const selectedLetters = filtered.filter((l) =>
    selectedIds.includes(l.applicationId),
  );
  const allOnPageChecked =
    filtered.length > 0 && filtered.every((l) => selected[l.applicationId]);

  const toggleAll = (val: boolean) => {
    const next: Record<string, boolean> = { ...selected };
    filtered.forEach((l) => {
      next[l.applicationId] = val;
    });
    setSelected(next);
  };

  const doResend = (recs: LetterRecord[]) => {
    lettersStore.resend(recs.map((r) => r.applicationId));
    toast.success(
      recs.length === 1
        ? "Letter resent successfully"
        : `${recs.length} letters resent successfully`,
    );
  };

  const doDownload = (rec: LetterRecord) => {
    const blob = new Blob([buildLetterText(rec, settings)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rec.referenceNumber.replace(/\//g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Letter downloaded");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Letters"
        description="Monitor every introduction letter generated across applications."
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[260px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student, ID, or reference number…"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {activeDepartments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value="First">First</SelectItem>
                <SelectItem value="Second">Second</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Generated:</span>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-[170px]"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-[170px]"
            />
            <div className="ml-auto text-xs text-muted-foreground">
              {filtered.length} of {letters.length} letters
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedLetters.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between p-3">
            <div className="text-sm">
              <span className="font-medium">{selectedLetters.length}</span>{" "}
              selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelected({})}
              >
                Clear
              </Button>
              <Button size="sm" onClick={() => setBulkResendOpen(true)}>
                <Send className="size-4" /> Resend Selected Letters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allOnPageChecked}
                    onCheckedChange={(v) => toggleAll(Boolean(v))}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Reference Number</TableHead>
                <TableHead>Generated Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-16 text-center text-sm text-muted-foreground"
                  >
                    No letters generated yet. Letters are created automatically
                    when a student's application is approved.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((l) => (
                <TableRow key={l.applicationId}>
                  <TableCell>
                    <Checkbox
                      checked={!!selected[l.applicationId]}
                      onCheckedChange={(v) =>
                        setSelected((s) => ({
                          ...s,
                          [l.applicationId]: Boolean(v),
                        }))
                      }
                      aria-label={`Select ${l.studentName}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{l.studentName}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {l.studentReg}
                  </TableCell>
                  <TableCell className="text-sm">{l.department}</TableCell>
                  <TableCell>{l.companyName}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {l.referenceNumber}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {fmtDate(l.generatedAt)}
                  </TableCell>
                  <TableCell>
                    <LetterBadge status={l.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewing(l)}>
                          <Eye className="size-4" /> View Letter
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => doDownload(l)}>
                          <Download className="size-4" /> Download Letter
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResendTarget(l)}>
                          <Send className="size-4" /> Resend Letter
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            navigate({
                              to: "/applications/$id",
                              params: { id: l.applicationId },
                            })
                          }
                        >
                          <ExternalLink className="size-4" /> View Application
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Mail className="size-3.5" />
        Letters are created automatically when an application is approved. They
        cannot be authored manually here.
      </div>

      {/* View Letter Modal */}
      <Dialog
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <DialogTitle>Introduction Letter</DialogTitle>
                  <DialogDescription className="font-mono text-xs">
                    {viewing.referenceNumber}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <LetterBadge status={viewing.status} />
                </div>
              </DialogHeader>

              <LetterPreview rec={viewing} />

              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => setViewing(null)}
                  className="sm:order-first"
                >
                  <X className="size-4" /> Close
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => doDownload(viewing)}>
                    <Download className="size-4" /> Download
                  </Button>
                  <Button
                    onClick={() => {
                      setResendTarget(viewing);
                    }}
                  >
                    <Send className="size-4" /> Resend
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Single Resend Confirmation */}
      <Dialog
        open={!!resendTarget}
        onOpenChange={(open) => !open && setResendTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend letter?</DialogTitle>
            <DialogDescription>
              Resend letter to{" "}
              <span className="font-medium text-foreground">
                {resendTarget?.companyEmail}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResendTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (resendTarget) doResend([resendTarget]);
                setResendTarget(null);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Resend */}
      <Dialog open={bulkResendOpen} onOpenChange={setBulkResendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend {selectedLetters.length} letters?</DialogTitle>
            <DialogDescription>
              Each company will receive its letter via email again. Every
              resend is recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkResendOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                doResend(selectedLetters);
                setBulkResendOpen(false);
                setSelected({});
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

function buildLetterText(
  rec: LetterRecord,
  settings: ReturnType<typeof useSettings>,
): string {
  const t = settings.letterTemplate;
  const filled = t.body
    .replace(/{{COMPANY_NAME}}/g, rec.companyName)
    .replace(/{{STUDENT_NAME}}/g, rec.studentName)
    .replace(/{{STUDENT_REG}}/g, rec.studentReg)
    .replace(/{{DEPARTMENT}}/g, rec.department)
    .replace(/{{YEAR_OF_STUDY}}/g, "Year 3")
    .replace(/{{START_DATE}}/g, fmtDate(rec.generatedAt))
    .replace(/{{END_DATE}}/g, fmtDate(rec.generatedAt))
    .replace(/{{ACADEMIC_SUPERVISOR}}/g, "the assigned academic supervisor")
    .replace(/{{SIGNATORY}}/g, t.signatory)
    .replace(/{{SIGNATORY_TITLE}}/g, t.signatoryTitle);
  return [
    t.institutionHeader,
    "",
    `Ref: ${rec.referenceNumber}`,
    `Date: ${fmtDate(rec.generatedAt)}`,
    "",
    filled,
  ].join("\n");
}

function LetterPreview({ rec }: { rec: LetterRecord }) {
  const settings = useSettings();
  const t = settings.letterTemplate;
  const filled = t.body
    .replace(/{{COMPANY_NAME}}/g, rec.companyName)
    .replace(/{{STUDENT_NAME}}/g, rec.studentName)
    .replace(/{{STUDENT_REG}}/g, rec.studentReg)
    .replace(/{{DEPARTMENT}}/g, rec.department)
    .replace(/{{YEAR_OF_STUDY}}/g, "Year 3")
    .replace(/{{START_DATE}}/g, fmtDate(rec.generatedAt))
    .replace(/{{END_DATE}}/g, fmtDate(rec.generatedAt))
    .replace(/{{ACADEMIC_SUPERVISOR}}/g, "the assigned academic supervisor")
    .replace(/{{SIGNATORY}}/g, t.signatory)
    .replace(/{{SIGNATORY_TITLE}}/g, t.signatoryTitle);

  return (
    <div className="rounded-md border border-border bg-white p-8 text-sm text-zinc-900 shadow-sm">
      <div className="flex items-start justify-between gap-6 border-b border-zinc-200 pb-4">
        <div>
          <div
            className="flex size-14 items-center justify-center rounded-md text-base font-bold text-white"
            style={{ backgroundColor: settings.branding.primaryColor }}
          >
            {settings.branding.institutionName
              .split(/\s+/)
              .map((w) => w[0])
              .join("")
              .slice(0, 3)
              .toUpperCase()}
          </div>
        </div>
        <div className="flex-1 whitespace-pre-line text-center text-xs font-semibold tracking-wide text-zinc-700">
          {t.institutionHeader}
        </div>
        <div className="text-right text-xs">
          <div className="font-mono">Ref: {rec.referenceNumber}</div>
          <div className="font-mono">Date: {fmtDate(rec.generatedAt)}</div>
        </div>
      </div>

      <div className="mt-6 space-y-1 text-xs text-zinc-600">
        <div>
          <span className="font-semibold text-zinc-900">To:</span>{" "}
          The Human Resource Manager
        </div>
        <div>{rec.companyName}</div>
        <div>{rec.companyAddress}</div>
      </div>

      <div className="mt-6 whitespace-pre-line leading-relaxed">{filled}</div>

      {settings.branding.qrEnabled && (
        <div className="mt-8 flex items-end justify-between gap-4">
          <div className="text-xs text-zinc-600">
            <div className="font-semibold text-zinc-900">{t.signatory}</div>
            <div>{t.signatoryTitle}</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex size-24 items-center justify-center rounded border border-zinc-300 bg-zinc-50">
              <QrCode className="size-16 text-zinc-700" />
            </div>
            <div className="text-[10px] text-zinc-500">Scan to approve</div>
          </div>
        </div>
      )}
    </div>
  );
}
