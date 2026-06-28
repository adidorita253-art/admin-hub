import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type AppStage,
  type ApprovalStatus,
  type LetterStatus,
  stageLabel,
  approvalLabel,
  letterLabel,
} from "@/lib/mock-data";

export function StageBadge({ stage }: { stage: AppStage }) {
  const map: Record<AppStage, string> = {
    applied: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300",
    letter_generated:
      "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300",
    letter_sent:
      "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300",
    company_viewed:
      "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300",
    awaiting_response:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300",
    approved:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300",
    rejected:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", map[stage])}>
      {stageLabel[stage]}
    </Badge>
  );
}

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const map: Record<ApprovalStatus, string> = {
    pending:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300",
    approved:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300",
    rejected:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300",
    expired:
      "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-300",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", map[status])}>
      {approvalLabel[status]}
    </Badge>
  );
}

export function LetterBadge({ status }: { status: LetterStatus }) {
  const map: Record<LetterStatus, string> = {
    not_generated: "bg-muted text-muted-foreground border-border",
    generated:
      "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300",
    sent: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300",
    viewed:
      "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300",
    approved:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300",
    rejected:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300",
    expired:
      "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-300",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", map[status])}>
      {letterLabel[status]}
    </Badge>
  );
}
